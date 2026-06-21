import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";
import {
  ChildRow,
  childRowToJson,
  collectStudentFields,
  normRelationship,
} from "@/lib/children";

/**
 * Children ("hồ sơ các bé") owned by the authenticated parent.
 *
 * A child is a no-login `users` row (user_type='child', authentik_user_id=NULL,
 * synthetic username + <hex>@kidmentor.local email, non-login password_hash) linked
 * to the parent via user_relationships(parent_id, child_id, relationship_type).
 * The child's `username` is what the app sends as device_id in the WS handshake so
 * CloudPTalk attributes RAG personalization + chat history to that child.
 */

/** GET /api/v1/children — list the caller's children. */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await query<ChildRow>(
      `SELECT u.id, u.username, u.full_name, u.grade,
              to_char(u.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
              u.hometown, u.curriculum, r.relationship_type
         FROM user_relationships r
         JOIN users u ON u.id = r.child_id
        WHERE r.parent_id = $1
        ORDER BY u.created_at ASC`,
      [user.id],
    );
    return NextResponse.json({ children: rows.map(childRowToJson) });
  } catch (e) {
    console.error("Children GET error:", e);
    return NextResponse.json({ error: "Failed to load children" }, { status: 500 });
  }
}

/** POST /api/v1/children — create a child profile under the caller. */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!fullName) {
      return NextResponse.json({ error: "Vui lòng nhập tên bé" }, { status: 400 });
    }

    const { cols, error } = collectStudentFields(body);
    if (error) return NextResponse.json({ error }, { status: 400 });
    cols.full_name = fullName; // ensure name is set even if not in the present-keys map

    const relationship = normRelationship(body.relationship);
    if (relationship === null) {
      return NextResponse.json({ error: "Quan hệ không hợp lệ" }, { status: 400 });
    }

    // Synthetic, non-login identity for the child users row.
    const childId = randomUUID();
    const slug = childId.replace(/-/g, "").slice(0, 12);
    const username = `child_${slug}`;
    const email = `${slug}@kidmentor.local`;
    const passwordHash = await bcrypt.hash(randomUUID(), 10); // unknown → never logs in

    await query(
      `INSERT INTO users
         (id, username, email, password_hash, display_name, user_type,
          authentik_user_id, subscription_tier, is_active, is_superuser, email_verified,
          full_name, grade, date_of_birth, hometown, curriculum)
       VALUES ($1, $2, $3, $4, $5, 'child', NULL, 'basic', true, false, false,
               $6, $7, $8, $9, $10)`,
      [
        childId,
        username,
        email,
        passwordHash,
        fullName,
        cols.full_name ?? fullName,
        cols.grade ?? null,
        cols.date_of_birth ?? null,
        cols.hometown ?? null,
        cols.curriculum ?? null,
      ],
    );

    await query(
      `INSERT INTO user_relationships (parent_id, child_id, relationship_type)
       VALUES ($1, $2, $3)`,
      [user.id, childId, relationship],
    );

    return NextResponse.json(
      {
        success: true,
        child: childRowToJson({
          id: childId,
          username,
          full_name: fullName,
          grade: cols.grade ?? null,
          date_of_birth: cols.date_of_birth ?? null,
          hometown: cols.hometown ?? null,
          curriculum: cols.curriculum ?? null,
          relationship_type: relationship,
        }),
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("Children POST error:", e);
    return NextResponse.json({ error: "Failed to create child" }, { status: 500 });
  }
}
