import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canViewUserChat } from "@/lib/chat-access";

interface ChatLog {
  id: string;
  user_id: string;
  sender: string;
  message: string;
  sentiment: string;
  source: string;
  session_id: string | null;
  channel: string | null;
  created_at: string;
}

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 5000;

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
    const source = searchParams.get("source"); // optional: 'kids' | 'eldercare'
    const channel = searchParams.get("channel"); // optional: 'robot' | 'app'

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // RBAC: non-admin may only view their own chat, a child assigned to one of
    // their devices, or a child linked via user_relationships.
    if (!isSuperUser && !(await canViewUserChat(currentUserId, userId))) {
      return NextResponse.json(
        { error: "Forbidden - You do not have permission to access this chat history" },
        { status: 403 },
      );
    }

    // Bounded query: fetch the most recent `limit` turns, returned chronologically.
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const conds = ["user_id = $1"];
    const params: (string | number)[] = [userId];
    if (source) {
      params.push(source);
      conds.push(`source = $${params.length}`);
    }
    if (channel) {
      params.push(channel);
      conds.push(`channel = $${params.length}`);
    }
    params.push(limit);

    const chatLogs = await query<ChatLog>(
      `SELECT * FROM (
         SELECT id, user_id, sender, message, sentiment, source, session_id, channel, created_at
         FROM conversation_logs
         WHERE ${conds.join(" AND ")}
         ORDER BY created_at DESC
         LIMIT $${params.length}
       ) t
       ORDER BY created_at ASC, (sender = 'user') DESC`,
      params,
    );

    return NextResponse.json({ chatLogs, limit, truncated: chatLogs.length >= limit });
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

    const { userId, sender, message, sentiment, source, channel } = await request.json();

    if (!userId || !sender || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // RBAC: same rule as GET.
    if (!isSuperUser && !(await canViewUserChat(currentUserId, userId))) {
      return NextResponse.json(
        { error: "Forbidden - You do not have permission to send chat messages for this user" },
        { status: 403 },
      );
    }

    const result = await query<ChatLog>(
      `INSERT INTO conversation_logs (user_id, sender, message, sentiment, source, channel)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, sender, message, sentiment, source, session_id, channel, created_at`,
      [userId, sender, message, sentiment || "neutral", source || "kids", channel || "app"],
    );

    return NextResponse.json({ success: true, chatLog: result[0] });
  } catch (error) {
    console.error("Chat API POST error:", error);
    return NextResponse.json({ error: "Failed to save chat message" }, { status: 500 });
  }
}
