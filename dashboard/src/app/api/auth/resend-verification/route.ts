import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { randomUUID, createHash } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Vui long nhap dia chi email" },
        { status: 400 }
      );
    }

    // 1. Find unverified user
    const [user] = await query<{
      id: string;
      username: string;
      email: string;
      email_verified: boolean;
    }>(
      `SELECT id, username, email, email_verified FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({
        success: true,
        message:
          "Neu tai khoan ton tai va chua xac thuc, email xac thuc se duoc gui.",
      });
    }

    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        message: "Email da duoc xac thuc truoc do. Ban co the dang nhap.",
      });
    }

    // 2. Delete old tokens and create new one
    await query(
      `DELETE FROM email_verification_tokens WHERE user_id = $1 AND used = false`,
      [user.id]
    );

    const token = randomUUID();
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.id, tokenHash]
    );

    // 3. Send email
    await sendVerificationEmail(user.email, user.username, token);

    return NextResponse.json({
      success: true,
      message: "Email xac thuc da duoc gui lai. Vui long kiem tra hop thu.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Loi he thong" },
      { status: 500 }
    );
  }
}
