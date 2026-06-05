import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * Parent (account owner) self-profile for the KidMentor app.
 *
 * Auth: Bearer token (Authentik JWT) — the user is resolved from the token, so a
 * caller can only ever read/write their OWN account row. Student fields (lớp, bộ sách,
 * ...) live on child records — see /api/v1/children.
 *
 * Editable here: full_name (parent name), phone (→ phone_number).
 * Read-only: email / username (account identity).
 */

type ParentRow = {
  username: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  phone_number: string | null;
};

function rowToJson(row: ParentRow) {
  return {
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    fullName: row.full_name,
    phone: row.phone_number,
  };
}

async function selectParent(userId: string): Promise<ParentRow | undefined> {
  const [row] = await query<ParentRow>(
    `SELECT username, email, display_name, full_name, phone_number
       FROM users WHERE id = $1`,
    [userId],
  );
  return row;
}

/** GET /api/v1/profile — the caller's own parent profile. */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const row = await selectParent(user.id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ profile: rowToJson(row) });
  } catch (e) {
    console.error("Parent profile GET error:", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/**
 * PUT /api/v1/profile — update the caller's own parent profile.
 * Body (optional): { fullName, phone }. A present field is updated (empty → NULL);
 * absent fields are unchanged. email / username are NOT editable here.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const norm = (v: unknown): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s.length === 0 ? null : s;
    };
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

    const sets: string[] = [];
    const vals: unknown[] = [];
    const add = (col: string, value: string | null) => {
      vals.push(value);
      sets.push(`${col} = $${vals.length}`);
    };

    if (has("fullName")) {
      const v = norm(body.fullName);
      if (v && v.length > 255) {
        return NextResponse.json({ error: "Họ và tên quá dài" }, { status: 400 });
      }
      add("full_name", v);
    }

    if (has("phone")) {
      const v = norm(body.phone);
      if (v && (v.length > 30 || !/^[0-9+()\-\s]+$/.test(v))) {
        return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
      }
      add("phone_number", v);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Không có trường nào để cập nhật" }, { status: 400 });
    }

    vals.push(user.id);
    await query(
      `UPDATE users SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`,
      vals,
    );

    const row = await selectParent(user.id);
    return NextResponse.json({ success: true, profile: row ? rowToJson(row) : null });
  } catch (e) {
    console.error("Parent profile PUT error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
