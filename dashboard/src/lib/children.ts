import { query } from "@/lib/db";

// Mirrors sql/add_student_profile.sql CHECK + the Android client.
export const CURRICULUM_CODES = ["chan_troi_sang_tao", "canh_dieu", "ket_noi_tri_thuc"];
export const RELATIONSHIP_CODES = ["father", "mother", "grandparent", "guardian", "other"];

export type ChildRow = {
  id: string;
  username: string;
  full_name: string | null;
  grade: string | null;
  date_of_birth: string | null; // 'YYYY-MM-DD'
  hometown: string | null;
  curriculum: string | null;
  relationship_type: string | null;
};

export function childRowToJson(row: ChildRow) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    grade: row.grade,
    dateOfBirth: row.date_of_birth,
    hometown: row.hometown,
    curriculum: row.curriculum,
    relationship: row.relationship_type,
  };
}

/** SELECT a child by id joined with its relationship to the given parent. */
export async function selectChildForParent(
  parentId: string,
  childId: string,
): Promise<ChildRow | undefined> {
  const [row] = await query<ChildRow>(
    `SELECT u.id, u.username, u.full_name, u.grade,
            to_char(u.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
            u.hometown, u.curriculum, r.relationship_type
       FROM user_relationships r
       JOIN users u ON u.id = r.child_id
      WHERE r.parent_id = $1 AND r.child_id = $2`,
    [parentId, childId],
  );
  return row;
}

const norm = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
};

/**
 * Validate + normalize the student fields present in `body`.
 * Returns the `users`-column map for keys that were supplied (empty string → null),
 * or `{ error }` on the first validation failure. Does NOT include relationship
 * (that lives on user_relationships — see normRelationship).
 */
export function collectStudentFields(
  body: Record<string, unknown>,
): { cols: Record<string, string | null>; error?: string } {
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
  const cols: Record<string, string | null> = {};

  if (has("fullName")) {
    const v = norm(body.fullName);
    if (v && v.length > 255) return { cols, error: "Họ và tên quá dài" };
    cols.full_name = v;
  }
  if (has("grade")) {
    const v = norm(body.grade);
    if (v !== null) {
      if (!/^[0-9]{1,2}$/.test(v)) return { cols, error: "Lớp không hợp lệ" };
      const n = parseInt(v, 10);
      if (n < 1 || n > 12) return { cols, error: "Lớp phải từ 1 đến 12" };
    }
    cols.grade = v;
  }
  if (has("dateOfBirth")) {
    const v = norm(body.dateOfBirth);
    if (v !== null) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
      const d = v ? new Date(v) : null;
      if (!m || !d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
        return { cols, error: "Ngày sinh không hợp lệ" };
      }
    }
    cols.date_of_birth = v;
  }
  if (has("hometown")) {
    const v = norm(body.hometown);
    if (v && v.length > 255) return { cols, error: "Quê quán quá dài" };
    cols.hometown = v;
  }
  if (has("curriculum")) {
    const v = norm(body.curriculum);
    if (v !== null && !CURRICULUM_CODES.includes(v)) {
      return { cols, error: "Bộ sách không hợp lệ" };
    }
    cols.curriculum = v;
  }
  return { cols };
}

/** Validate the relationship code; defaults to 'guardian'. Returns null on invalid. */
export function normRelationship(raw: unknown): string | null {
  const v = norm(raw);
  if (v === null) return "guardian";
  return RELATIONSHIP_CODES.includes(v) ? v : null;
}
