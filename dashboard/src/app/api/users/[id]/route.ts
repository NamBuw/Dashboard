import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canViewUserChat } from "@/lib/chat-access";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const isSuper = !!session.user.is_superuser;
  if (!isSuper && session.user.id !== id && !(await canViewUserChat(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const [user] = await query<Record<string, unknown>>(
      `SELECT id, username, email, display_name, user_type, subscription_tier, is_active, is_superuser, created_at,
              full_name, grade, to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
              hometown, phone_number, curriculum
       FROM users WHERE id = $1`,
      [id],
    );
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const devices = await query<Record<string, unknown>>(
      `SELECT id, serial_number, label, status, device_hw_id, mac_address,
              CASE WHEN assigned_user_id = $1 THEN 'assigned' ELSE 'owner' END AS rel
       FROM devices WHERE owner_id = $1 OR assigned_user_id = $1
       ORDER BY created_at DESC`,
      [id],
    );

    // Children (hồ sơ các bé) linked to this user as a parent.
    const children = await query<Record<string, unknown>>(
      `SELECT u.id, u.full_name, u.grade,
              to_char(u.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
              u.hometown, u.curriculum, r.relationship_type
         FROM user_relationships r
         JOIN users u ON u.id = r.child_id
        WHERE r.parent_id = $1
        ORDER BY u.created_at ASC`,
      [id],
    );

    const msg = await query<{ source: string; n: string }>(
      `SELECT source, COUNT(*) AS n FROM conversation_logs WHERE user_id = $1 GROUP BY source`,
      [id],
    );
    const messageCounts: Record<string, number> = {};
    let totalMessages = 0;
    for (const m of msg) {
      const n = parseInt(m.n, 10);
      messageCounts[m.source || "kids"] = n;
      totalMessages += n;
    }

    return NextResponse.json({ user, devices, children, messageCounts, totalMessages });
  } catch (e) {
    console.error("User detail error:", e);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}
