import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * GET /api/v1/chat/messages?session_id=xxx&page=1&limit=50
 * Get messages for a chat session.
 *
 * RBAC:
 * - Admin: sees all messages
 * - AccountOwner: sees messages of own sessions / owned device sessions
 * - Child/Elder: sees own messages
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = (page - 1) * limit;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Verify access to this session
    const [session] = await query<{
      id: string;
      user_id: string;
      device_id: string | null;
    }>(
      `SELECT id, user_id, device_id FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // RBAC check
    if (!user.is_superuser) {
      const isOwner = session.user_id === user.id;
      const ownsDevice = session.device_id
        ? (await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM devices WHERE id = $1 AND owner_id = $2`,
            [session.device_id, user.id]
          ))[0]?.count !== "0"
        : false;
      const isDependent =
        (await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM user_relationships WHERE owner_id = $1 AND dependent_id = $2`,
          [user.id, session.user_id]
        ))[0]?.count !== "0";

      if (!isOwner && !ownsDevice && !isDependent) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1`,
      [sessionId]
    );
    const total = parseInt(countResult?.count || "0");

    // Get messages
    const messages = await query<{
      id: string;
      sender: string;
      message_type: string;
      content: string;
      audio_url: string | null;
      audio_duration: number | null;
      sentiment: string | null;
      emotion_code: string | null;
      created_at: string;
    }>(
      `SELECT id, sender, message_type, content, audio_url, audio_duration,
              sentiment, emotion_code, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    return NextResponse.json({
      sessionId,
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        messageType: m.message_type,
        content: m.content,
        audioUrl: m.audio_url,
        audioDuration: m.audio_duration,
        sentiment: m.sentiment,
        emotionCode: m.emotion_code,
        createdAt: m.created_at,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Chat messages GET error:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/chat/messages
 * Add a message to a chat session.
 *
 * Body: { session_id, sender, content, message_type?, audio_url?, sentiment?, emotion_code? }
 * Auth: Bearer token (Authentik JWT)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      session_id,
      sender,
      content,
      message_type,
      audio_url,
      sentiment,
      emotion_code,
    } = body;

    if (!session_id || !sender || !content) {
      return NextResponse.json(
        { error: "Missing session_id, sender, or content" },
        { status: 400 }
      );
    }

    // Verify session exists and user has access
    const [session] = await query<{
      id: string;
      user_id: string;
      device_id: string | null;
    }>(
      `SELECT id, user_id, device_id FROM chat_sessions WHERE id = $1`,
      [session_id]
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // RBAC check
    if (!user.is_superuser) {
      const isOwner = session.user_id === user.id;
      const ownsDevice = session.device_id
        ? (await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM devices WHERE id = $1 AND owner_id = $2`,
            [session.device_id, user.id]
          ))[0]?.count !== "0"
        : false;
      const isDependent =
        (await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM user_relationships WHERE owner_id = $1 AND dependent_id = $2`,
          [user.id, session.user_id]
        ))[0]?.count !== "0";

      if (!isOwner && !ownsDevice && !isDependent) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Insert message
    const [message] = await query<{
      id: string;
      created_at: string;
    }>(
      `INSERT INTO chat_messages (session_id, sender, message_type, content, audio_url, sentiment, emotion_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        session_id,
        sender,
        message_type || "text",
        content,
        audio_url || null,
        sentiment || "neutral",
        emotion_code || null,
      ]
    );

    // Update session metadata
    await query(
      `UPDATE chat_sessions
       SET message_count = message_count + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [session_id]
    );

    return NextResponse.json({
      success: true,
      messageId: message.id,
      createdAt: message.created_at,
    });
  } catch (error) {
    console.error("Chat messages POST error:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
