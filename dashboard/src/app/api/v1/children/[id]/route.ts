import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";
import {
  childRowToJson,
  collectStudentFields,
  normRelationship,
  selectChildForParent,
} from "@/lib/children";

/**
 * A single child profile, scoped to the authenticated parent.
 * Every method is gated by guardianship: the caller must be linked to the child
 * via user_relationships(parent_id=<caller>, child_id=<id>).
 */

async function authorize(request: NextRequest, childId: string) {
  const user = await verifyBearerToken(request.headers.get("Authorization"));
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const child = await selectChildForParent(user.id, childId);
  if (!child) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { user, child };
}

/** GET /api/v1/children/[id] */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(request, id);
    if (auth.error) return auth.error;
    return NextResponse.json({ child: childRowToJson(auth.child) });
  } catch (e) {
    console.error("Child GET error:", e);
    return NextResponse.json({ error: "Failed to load child" }, { status: 500 });
  }
}

/** PUT /api/v1/children/[id] — update a child's student fields (and relationship). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(request, id);
    if (auth.error) return auth.error;

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
      await query(
        `UPDATE users SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`,
        vals,
      );
    }

    if (Object.prototype.hasOwnProperty.call(body, "relationship")) {
      const rel = normRelationship(body.relationship);
      if (rel === null) return NextResponse.json({ error: "Quan hệ không hợp lệ" }, { status: 400 });
      await query(
        `UPDATE user_relationships SET relationship_type = $1 WHERE parent_id = $2 AND child_id = $3`,
        [rel, auth.user.id, id],
      );
    }

    const child = await selectChildForParent(auth.user.id, id);
    return NextResponse.json({ success: true, child: child ? childRowToJson(child) : null });
  } catch (e) {
    console.error("Child PUT error:", e);
    return NextResponse.json({ error: "Failed to update child" }, { status: 500 });
  }
}

/** DELETE /api/v1/children/[id] — remove the child profile (relationship cascades). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(request, id);
    if (auth.error) return auth.error;

    // Safety: only ever delete a no-login child profile, never a real account.
    await query(`DELETE FROM users WHERE id = $1 AND user_type = 'child'`, [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Child DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete child" }, { status: 500 });
  }
}
