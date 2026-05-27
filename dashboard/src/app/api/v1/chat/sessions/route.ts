import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * GET /api/v1/chat/sessions
 * List chat sessions with RBAC filtering.
 *
 * Query params: product_source, channel, device_id, page, limit
 * Auth: Bearer token (Authentik JWT)
 *
 * RBAC:
 * - Admin: sees ALL sessions
 * - AccountOwner: sees sessions of own devices + dependents
 * - Child/Elder: sees own sessions only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productSource = searchParams.get("product_source");
    const channel = searchParams.get("channel");
    const deviceId = searchParams.get("device_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query based on RBAC
    let fromClause: string;
    let whereClause: string;
    let params: unknown[];

    if (user.is_superuser) {
      // Admin: sees everything
      fromClause = `chat_sessions cs`;
      whereClause = `WHERE 1=1`;
      params = [];
    } else {
      // User: sees own sessions + sessions of owned devices
      fromClause = `chat_sessions cs`;
      whereClause = `WHERE (
          cs.user_id = $1
          OR cs.device_id IN (SELECT id FROM devices WHERE owner_id = $1)
          OR cs.user_id IN (SELECT dependent_id FROM user_relationships WHERE owner_id = $1)
        )`;
      params = [user.id];
    }

    // Apply filters
    let paramIndex = params.length + 1;
    let filterClauses = "";

    if (productSource) {
      filterClauses += ` AND cs.product_source = $${paramIndex}`;
      params.push(productSource);
      paramIndex++;
    }
    if (channel) {
      filterClauses += ` AND cs.channel = $${paramIndex}`;
      params.push(channel);
      paramIndex++;
    }
    if (deviceId) {
      filterClauses += ` AND cs.device_id = $${paramIndex}`;
      params.push(deviceId);
      paramIndex++;
    }

    // Get total count
    const [countResult] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${fromClause} ${whereClause}${filterClauses}`,
      params
    );
    const total = parseInt(countResult?.count || "0", 10);

    // Get sessions
    const sessions = await query<{
      id: string;
      user_id: string;
      device_id: string | null;
      product_source: string;
      channel: string;
      title: string | null;
      message_count: number;
      avg_sentiment: string | null;
      started_at: string;
      last_message_at: string | null;
      user_name: string | null;
      device_label: string | null;
    }>(
      `SELECT cs.*,
        u.display_name as user_name,
        d.label as device_label
       FROM ${fromClause}
       LEFT JOIN users u ON cs.user_id = u.id
       LEFT JOIN devices d ON cs.device_id = d.id
       ${whereClause}
       ${filterClauses}
       ORDER BY cs.last_message_at DESC NULLS LAST, cs.started_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        userId: s.user_id,
        deviceId: s.device_id,
        productSource: s.product_source,
        channel: s.channel,
        title: s.title,
        messageCount: s.message_count,
        avgSentiment: s.avg_sentiment,
        startedAt: s.started_at,
        lastMessageAt: s.last_message_at,
        userName: s.user_name,
        deviceLabel: s.device_label,
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
 * Create a new chat session.
 *
 * Body: { user_id?, device_id?, product_source, channel, title? }
 * Auth: Bearer token (Authentik JWT)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, device_id, product_source, channel, title } = body;

    if (!product_source || !channel) {
      return NextResponse.json(
        { error: "Missing product_source or channel" },
        { status: 400 }
      );
    }

    // Use authenticated user if no user_id specified
    const sessionUserId = user_id || user.id;

    // RBAC: non-admin can only create sessions for themselves or their dependents
    if (!user.is_superuser && sessionUserId !== user.id) {
      const [assoc] = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM user_relationships WHERE owner_id = $1 AND dependent_id = $2`,
        [user.id, sessionUserId]
      );
      if (parseInt(assoc?.count || "0") === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [session] = await query<{
      id: string;
      started_at: string;
    }>(
      `INSERT INTO chat_sessions (user_id, device_id, product_source, channel, title, started_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, started_at`,
      [sessionUserId, device_id || null, product_source, channel, title || null]
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      startedAt: session.started_at,
    });
  } catch (error) {
    console.error("Chat sessions POST error:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}
