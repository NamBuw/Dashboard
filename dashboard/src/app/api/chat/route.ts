import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

interface ChatLog {
  id: string;
  user_id: string;
  sender: string;
  message: string;
  sentiment: string;
  source: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const source = searchParams.get("source"); // optional: 'kids' or 'eldercare'

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // RBAC: Non-admin can only view their own chat or their children's chat
    if (!isSuperUser && userId !== currentUserId) {
      const [assocCheck] = await query<{ count: string }>(
        `SELECT COUNT(*) AS count 
         FROM devices 
         WHERE owner_id = $1 AND assigned_user_id = $2`,
        [currentUserId, userId]
      );
      if (parseInt(assocCheck?.count || "0") === 0) {
        return NextResponse.json({ error: "Forbidden - You do not have permission to access this chat history" }, { status: 403 });
      }
    }

    // Try fetching actual conversation logs for this user from database
    let chatLogs: ChatLog[];
    if (source) {
      chatLogs = await query<ChatLog>(
        `SELECT id, user_id, sender, message, sentiment, source, created_at
         FROM conversation_logs
         WHERE user_id = $1 AND source = $2
         ORDER BY created_at ASC`,
        [userId, source]
      );
    } else {
      chatLogs = await query<ChatLog>(
        `SELECT id, user_id, sender, message, sentiment, source, created_at
         FROM conversation_logs
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [userId]
      );
    }

    // Returns actual conversation logs or empty list if none exist
    return NextResponse.json({ chatLogs });
  } catch (error) {
    console.error("Chat API GET error:", error);
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    const { userId, sender, message, sentiment, source } = await request.json();

    if (!userId || !sender || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // RBAC: Non-admin can only post their own chat or their children's chat
    if (!isSuperUser && userId !== currentUserId) {
      const [assocCheck] = await query<{ count: string }>(
        `SELECT COUNT(*) AS count 
         FROM devices 
         WHERE owner_id = $1 AND assigned_user_id = $2`,
        [currentUserId, userId]
      );
      if (parseInt(assocCheck?.count || "0") === 0) {
        return NextResponse.json({ error: "Forbidden - You do not have permission to send chat messages for this user" }, { status: 403 });
      }
    }

    // Insert new chat message into DB
    const result = await query<ChatLog>(
      `INSERT INTO conversation_logs (user_id, sender, message, sentiment, source)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, sender, message, sentiment, source, created_at`,
      [userId, sender, message, sentiment || "neutral", source || "kids"]
    );

    return NextResponse.json({ success: true, chatLog: result[0] });
  } catch (error) {
    console.error("Chat API POST error:", error);
    return NextResponse.json({ error: "Failed to save chat message" }, { status: 500 });
  }
}
