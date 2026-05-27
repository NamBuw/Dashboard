import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
import { execSync } from "child_process";

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

    // 3. Securely hash new password using Python bcrypt environment
    // Escape single quotes for safe shell command execution
    const escapedPassword = password.replace(/'/g, "'\\''");
    const pythonCmd = `python3 -c "import bcrypt; print(bcrypt.hashpw(b'${escapedPassword}', bcrypt.gensalt()).decode('utf-8'))"`;
    
    let passwordHash = "";
    try {
      passwordHash = execSync(pythonCmd).toString().trim();
    } catch (err) {
      console.error("Bcrypt hashing command failed:", err);
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

    // 4. Update password_hash in users table
    await query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE id = $2`,
      [passwordHash, tokenRecord.user_id]
    );

    // 5. Mark token as used
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
