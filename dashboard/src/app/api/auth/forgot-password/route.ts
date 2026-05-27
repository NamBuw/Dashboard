import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ email" },
        { status: 400 }
      );
    }

    // 1. Check if user exists with this email in database
    const [user] = await query<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE email = $1`,
      [email.trim()]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản nào được đăng ký với email này" },
        { status: 404 }
      );
    }

    // 2. Generate secure token
    const token = crypto.randomUUID(); // secure UUID token
    
    // Hash token using SHA-256 for secure DB storage
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 3. Save token to password_reset_tokens table (expires in 1 hour)
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, tokenHash]
    );

    // 4. Return success and the resetUrl (excellent for testing without SMTP server)
    const resetUrl = `/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      message: "Yêu cầu khôi phục mật khẩu đã được xử lý",
      resetUrl, // Helper for local dev testing
    });
  } catch (error) {
    console.error("Forgot Password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
