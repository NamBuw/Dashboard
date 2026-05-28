import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const AUTHENTIK_URL = process.env.AUTHENTIK_URL || "https://auth.ctslab.net";
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN || "";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password || password.trim().length < 6) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ. Mật khẩu phải từ 6 ký tự." },
        { status: 400 }
      );
    }

    // 1. Hash incoming token using SHA-256 to match DB
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Query valid token from password_reset_tokens
    const [tokenRecord] = await query<{ id: string; user_id: string }>(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used = false`,
      [tokenHash]
    );

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu." },
        { status: 400 }
      );
    }

    // 3. Securely hash new password using bcryptjs
    let passwordHash = "";
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (err) {
      console.error("Bcrypt hashing failed:", err);
      return NextResponse.json(
        { error: "Lỗi hệ thống khi mã hoá mật khẩu mới." },
        { status: 500 }
      );
    }

    if (!passwordHash) {
      return NextResponse.json(
        { error: "Lỗi hệ thống khi tạo mật khẩu." },
        { status: 500 }
      );
    }

    // 4. Update password_hash in Dashboard DB
    await query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, tokenRecord.user_id]
    );

    // 5. Sync password to Authentik (if user has authentik_user_id)
    try {
      const [user] = await query<{ authentik_user_id: string | null }>(
        `SELECT authentik_user_id FROM users WHERE id = $1`,
        [tokenRecord.user_id]
      );

      if (user?.authentik_user_id) {
        const pwRes = await fetch(
          `${AUTHENTIK_URL}/api/v3/core/users/${user.authentik_user_id}/set_password/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${AUTHENTIK_API_TOKEN}`,
            },
            body: JSON.stringify({ password }),
          }
        );

        if (!pwRes.ok) {
          console.error("Authentik set_password failed:", pwRes.status, await pwRes.text());
        }
      }
    } catch (err) {
      console.error("Authentik password sync error (non-critical):", err);
    }

    // 6. Mark token as used
    await query(
      `UPDATE password_reset_tokens
       SET used = true
       WHERE id = $1`,
      [tokenRecord.id]
    );

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu mới thành công",
    });
  } catch (error) {
    console.error("Reset Password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
