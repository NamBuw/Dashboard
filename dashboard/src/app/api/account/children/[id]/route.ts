import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  childRowToJson,
  collectStudentFields,
  normRelationship,
  selectChildForParent,
} from "@/lib/children";

/**
 * A single child profile, scoped to the logged-in parent — COOKIE-authed (NextAuth
 * session) sibling of /api/v1/children/[id] (which is Bearer-authed for the mobile
 * client). Used by the Dashboard "/account" self-service page.
 *
 * Every method is gated by guardianship: the caller must be linked to the child via
 * user_relationships(parent_id=<caller>, child_id=<id>) — enforced through
 * selectChildForParent(). A caller can therefore only ever read/write/delete a child
 * that belongs to their OWN account.
 */

async function authorize(childId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const child = await selectChildForParent(session.user.id, childId);
  if (!child) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { userId: session.user.id, child };
}

/** GET /api/account/children/[id] */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await authorize(id);
    if ("error" in result) return result.error;
    return NextResponse.json({ child: childRowToJson(result.child) });
  } catch (e) {
    console.error("Account child GET error:", e);
    return NextResponse.json({ error: "Failed to load child" }, { status: 500 });
  }
}

/** PUT /api/account/children/[id] — update a child's student fields (and relationship). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await authorize(id);
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { cols, error } = collectStudentFields(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const entries = Object.entries(cols);
    if (entries.length > 0) {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const [col, value] of entries) {
        vals.push(value);
        sets.push(`${col} = $${vals.length}`);
      }
      vals.push(id);
      // Guard: only ever mutate a no-login child profile, never a real account.
      await query(
        `UPDATE users SET ${sets.join(", ")}, updated_at = now()
          WHERE id = $${vals.length} AND user_type = 'child'`,
        vals,
      );
    }

    if (Object.prototype.hasOwnProperty.call(body, "relationship")) {
      const rel = normRelationship(body.relationship);
      if (rel === null) return NextResponse.json({ error: "Quan hệ không hợp lệ" }, { status: 400 });
      await query(
        `UPDATE user_relationships SET relationship_type = $1 WHERE parent_id = $2 AND child_id = $3`,
        [rel, result.userId, id],
      );
    }

    const child = await selectChildForParent(result.userId, id);
    return NextResponse.json({ success: true, child: child ? childRowToJson(child) : null });
  } catch (e) {
    console.error("Account child PUT error:", e);
    return NextResponse.json({ error: "Failed to update child" }, { status: 500 });
  }
}

/** DELETE /api/account/children/[id] — remove the child profile + its relationship. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await authorize(id);
    if ("error" in result) return result.error;

    // Drop the relationship first, then the child row. Safety: only ever delete a
    // no-login child profile (user_type='child'), never a real account.
    await query(
      `DELETE FROM user_relationships WHERE parent_id = $1 AND child_id = $2`,
      [result.userId, id],
    );
    await query(`DELETE FROM users WHERE id = $1 AND user_type = 'child'`, [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Account child DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete child" }, { status: 500 });
  }
}
