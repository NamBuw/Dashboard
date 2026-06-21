import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ChildRow, childRowToJson } from "@/lib/children";

/**
 * GET /api/users/[id]/children — read-only viewer for the Settings "Người dùng & Bé" section.
 *
 * Returns the target user's basic profile + the children (hồ sơ các bé) linked to them
 * as a parent via user_relationships(parent_id, child_id, relationship_type).
 *
 * Auth: web session (`auth()`). RBAC: SuperAdmin (any user) or the user themselves.
 * Self-contained on purpose so it works in both the source and deploy trees.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isSuper = !!session.user.is_superuser;
  if (!isSuper && session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [user] = await query<Record<string, unknown>>(
      `SELECT id, username, email, display_name, user_type, subscription_tier,
              is_active, is_superuser, created_at, full_name, phone_number
         FROM users WHERE id = $1`,
      [id],
    );
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const childRows = await query<ChildRow>(
      `SELECT u.id, u.username, u.full_name, u.grade,
              to_char(u.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
              u.hometown, u.curriculum, r.relationship_type
         FROM user_relationships r
         JOIN users u ON u.id = r.child_id
        WHERE r.parent_id = $1
        ORDER BY u.created_at ASC`,
      [id],
    );

    return NextResponse.json({ user, children: childRows.map(childRowToJson) });
  } catch (e) {
    console.error("Users children GET error:", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
