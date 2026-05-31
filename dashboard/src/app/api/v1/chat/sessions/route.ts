import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * GET /api/v1/chat/sessions
 * List chat sessions derived from conversation_logs.
 *
 * Query params: product_source, page, limit
 * Auth: Bearer token (Authentik JWT)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productSource = searchParams.get("product_source");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build RBAC filter
    let userFilter: string;
    let params: unknown[];

    if (user.is_superuser) {
      userFilter = "";
      params = [];
    } else {
      userFilter = `AND cl.user_id = $1`;
      params = [user.id];
    }

    // Source filter
    let sourceFilter = "";
    if (productSource === "kid_mentor") {
      sourceFilter = `AND cl.source = 'kids'`;
    } else if (productSource === "ptalk") {
      sourceFilter = `AND cl.source = 'ptalk'`;
    }

    // Get virtual sessions: group by user + date, join devices for label
    const sessions = await query<{
      session_id: string;
      user_id: string;
      user_name: string;
      source: string;
      device_id: string | null;
      device_label: string | null;
      device_mac: string | null;
      message_count: string;
      first_message: string;
      last_message: string;
      preview: string;
    }>(
      `SELECT
        CONCAT(cl.user_id, '_', DATE(cl.created_at)) as session_id,
        cl.user_id,
        u.display_name as user_name,
        cl.source,
        cl.device_id,
        d.label as device_label,
        d.mac_address as device_mac,
        COUNT(*) as message_count,
        MIN(cl.created_at) as first_message,
        MAX(cl.created_at) as last_message,
        (SELECT message FROM conversation_logs WHERE user_id = cl.user_id AND DATE(created_at) = DATE(cl.created_at) ORDER BY created_at DESC LIMIT 1) as preview
       FROM conversation_logs cl
       LEFT JOIN users u ON cl.user_id = u.id
       LEFT JOIN devices d ON cl.device_id = d.id
       WHERE 1=1 ${userFilter} ${sourceFilter}
       GROUP BY cl.user_id, DATE(cl.created_at), u.display_name, cl.source, cl.device_id, d.label, d.mac_address
       ORDER BY last_message DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT CONCAT(user_id, '_', DATE(created_at))) as count
       FROM conversation_logs cl
       WHERE 1=1 ${userFilter} ${sourceFilter}`,
      params
    );
    const total = parseInt(countResult?.count || "0", 10);

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.session_id,
        userId: s.user_id,
        userName: s.user_name,
        productSource: productSource || "all",
        channel: "voice",
        deviceId: s.device_id,
        deviceLabel: s.device_label,
        deviceMac: s.device_mac,
        messageCount: parseInt(s.message_count),
        startedAt: s.first_message,
        lastMessageAt: s.last_message,
        preview: s.preview,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Chat sessions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load chat sessions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/chat/sessions
 * Not supported for conversation_logs (data written by CloudPTalk).
 */
export async function POST() {
  return NextResponse.json(
    { error: "Use conversation_logs directly. Sessions are auto-created." },
    { status: 405 }
  );
}
