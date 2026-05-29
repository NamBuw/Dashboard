import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * GET /api/v1/chat/messages?session_id=userId_YYYY-MM-DD&page=1&limit=50
 * Get messages from conversation_logs for a virtual session.
 *
 * Auth: Bearer token (Authentik JWT)
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

    // Parse session_id format: userId_YYYY-MM-DD
    const parts = sessionId.split("_");
    if (parts.length < 2) {
      return NextResponse.json(
        { error: "Invalid session_id format. Expected: userId_YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const sessionUserId = parts[0];
    const sessionDate = parts.slice(1).join("_"); // Handle dates with underscores if any

    // RBAC check
    if (!user.is_superuser) {
      const isOwner = sessionUserId === user.id;
      const isDependent =
        (await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM user_relationships WHERE owner_id = $1 AND dependent_id = $2`,
          [user.id, sessionUserId]
        ))[0]?.count !== "0";

      if (!isOwner && !isDependent) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get messages from conversation_logs
    const messages = await query<{
      id: string;
      sender: string;
      message: string;
      sentiment: string | null;
      source: string;
      created_at: string;
    }>(
      `SELECT id, sender, message, sentiment, source, created_at
       FROM conversation_logs
       WHERE user_id = $1 AND DATE(created_at) = $2
       ORDER BY created_at ASC
       LIMIT $3 OFFSET $4`,
      [sessionUserId, sessionDate, limit, offset]
    );

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM conversation_logs
       WHERE user_id = $1 AND DATE(created_at) = $2`,
      [sessionUserId, sessionDate]
    );
    const total = parseInt(countResult?.count || "0");

    return NextResponse.json({
      sessionId,
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        messageType: "text",
        content: m.message,
        sentiment: m.sentiment,
        source: m.source,
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
 * Not supported for conversation_logs (data written by CloudPTalk).
 */
export async function POST() {
  return NextResponse.json(
    { error: "Use conversation_logs directly. Messages are written by CloudPTalk." },
    { status: 405 }
  );
}
