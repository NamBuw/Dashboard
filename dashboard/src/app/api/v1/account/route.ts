import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/api-auth";
import pool from "@/lib/db";

const AUTHENTIK_URL = process.env.AUTHENTIK_URL || "https://auth.ctslab.net";
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN || "";

/** Vô hiệu hoá user trên Authentik (best-effort, gọi SAU khi DB đã commit). */
async function deactivateAuthentikUser(authentikUserId: string): Promise<boolean> {
  try {
    const res = await fetch(`${AUTHENTIK_URL}/api/v3/core/users/${authentikUserId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
      body: JSON.stringify({ is_active: false }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * DELETE /api/v1/account — người dùng tự xoá tài khoản (account_owner).
 *
 * - Tài khoản: SOFT-DELETE (is_active=false, deleted_at=now) + ẩn danh PII. Không xoá row.
 * - Lịch sử hội thoại của phụ huynh + các bé: HARD-DELETE.
 * - Toàn bộ thao tác DB trong 1 transaction (lỗi → ROLLBACK, không hỏng gì).
 * - Authentik vô hiệu hoá best-effort SAU khi DB commit (lỗi → log, vẫn trả success).
 *
 * Auth: verifyBearerToken → chỉ xoá được tài khoản của chính mình.
 */
export async function DELETE(request: NextRequest) {
  const user = await verifyBearerToken(request.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  let authentikUserId: string | null = null;
  try {
    await client.query("BEGIN");

    // Khoá hàng tài khoản + kiểm tra loại / đã xoá.
    const meRes = await client.query(
      `SELECT id, user_type, deleted_at, authentik_user_id
         FROM users WHERE id = $1 FOR UPDATE`,
      [user.id]
    );
    const me = meRes.rows[0];
    if (!me) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (me.user_type === "child") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (me.deleted_at) {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: true, alreadyDeleted: true });
    }
    authentikUserId = me.authentik_user_id;

    // Gom id các bé của phụ huynh.
    const kids = await client.query(
      `SELECT child_id FROM user_relationships WHERE parent_id = $1`,
      [user.id]
    );
    const childIds: string[] = kids.rows.map((r) => r.child_id as string);
    const allIds = [user.id, ...childIds];

    // 1) HARD-DELETE nội dung hội thoại (phụ huynh + bé).
    await client.query(`DELETE FROM conversation_logs WHERE user_id = ANY($1::uuid[])`, [allIds]);
    // chat_messages tự cascade khi xoá chat_sessions (FK ON DELETE CASCADE).
    await client.query(`DELETE FROM chat_sessions WHERE user_id = ANY($1::uuid[])`, [allIds]);

    // 2) Vô hiệu phiên / token.
    await client.query(`DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])`, [allIds]);
    await client.query(`DELETE FROM password_reset_tokens WHERE user_id = ANY($1::uuid[])`, [allIds]);

    // 3) Soft-delete + ẩn danh các bé.
    if (childIds.length > 0) {
      await client.query(
        `UPDATE users
            SET display_name = 'Đã xoá',
                full_name = NULL,
                grade = NULL,
                date_of_birth = NULL,
                hometown = NULL,
                curriculum = NULL,
                is_active = false,
                deleted_at = now(),
                updated_at = now()
          WHERE id = ANY($1::uuid[])`,
        [childIds]
      );
    }

    // 4) Soft-delete + ẩn danh phụ huynh (GIỮ authentik_user_id để khôi phục thủ công).
    await client.query(
      `UPDATE users
          SET email = 'deleted+' || id::text || '@deleted.local',
              username = 'deleted+' || id::text,
              full_name = NULL,
              display_name = 'Người dùng đã xoá',
              phone_number = NULL,
              date_of_birth = NULL,
              password_hash = '!deleted',
              is_active = false,
              deleted_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [user.id]
    );

    await client.query("COMMIT");
    console.log(
      `[account-delete] soft-deleted user=${user.id} children=${childIds.length}`
    );
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Account self-delete error:", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  } finally {
    client.release();
  }

  // Vô hiệu Authentik (best-effort, KHÔNG rollback DB nếu lỗi).
  if (authentikUserId) {
    const ok = await deactivateAuthentikUser(authentikUserId);
    if (!ok) {
      console.warn(
        `[account-delete] authentik_deactivate_failed user=${user.id} authentik=${authentikUserId}`
      );
    }
  }

  return NextResponse.json({ success: true });
}
