import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Parent (account owner) self-profile — COOKIE-authed (NextAuth session), used by
 * the Dashboard onboarding wizard + the User View "/account" page. Mirrors the
 * Bearer-token /api/v1/profile contract but resolves the user from the session, so a
 * caller can only ever read/write their OWN account row.
 *
 * Editable: full_name (parent name), phone (→ phone_number), date_of_birth.
 * The `onboarded` flag may be set to true here (wizard completion). email/username are not editable.
 */

type ParentRow = {
  username: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null; // 'YYYY-MM-DD'
  onboarded: boolean;
};

function rowToJson(row: ParentRow) {
  return {
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    fullName: row.full_name,
    phone: row.phone_number,
    dateOfBirth: row.date_of_birth,
    onboarded: row.onboarded,
  };
}

async function selectParent(userId: string): Promise<ParentRow | undefined> {
  const [row] = await query<ParentRow>(
    `SELECT username, email, display_name, full_name, phone_number,
            to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, onboarded
       FROM users WHERE id = $1`,
    [userId],
  );
  return row;
}

/** GET /api/account/profile — the logged-in user's own parent profile. */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const row = await selectParent(session.user.id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ profile: rowToJson(row) });
  } catch (e) {
    console.error("Account profile GET error:", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/**
 * PUT /api/account/profile — update the caller's own parent profile.
 * Body (all optional): { fullName, phone, dateOfBirth, onboarded }.
 * A present field is updated (empty → NULL). `onboarded` only ever sets true.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

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
    const add = (col: string, value: unknown) => {
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

    if (has("dateOfBirth")) {
      const v = norm(body.dateOfBirth);
      if (v !== null) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
        const d = m ? new Date(v) : null;
        if (!m || !d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
          return NextResponse.json({ error: "Ngày sinh không hợp lệ" }, { status: 400 });
        }
      }
      add("date_of_birth", v);
    }

    if (body.onboarded === true) {
      add("onboarded", true);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Không có trường nào để cập nhật" }, { status: 400 });
    }

    vals.push(userId);
    await query(
      `UPDATE users SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`,
      vals,
    );

    const row = await selectParent(userId);
    return NextResponse.json({ success: true, profile: row ? rowToJson(row) : null });
  } catch (e) {
    console.error("Account profile PUT error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
