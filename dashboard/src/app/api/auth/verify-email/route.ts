import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

const AUTHENTIK_URL = process.env.AUTHENTIK_URL || "https://auth.ctslab.net";
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN || "";

async function authentikFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${AUTHENTIK_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTHENTIK_API_TOKEN}`,
      ...options.headers,
    },
  });
  return res;
}

/**
 * GET /api/auth/verify-email?token=xxx
 * Verifies the email token and activates the user.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token xac thuc khong hop le" },
        { status: 400 }
      );
    }

    // 1. Hash incoming token to match DB
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Look up valid token
    const [tokenRecord] = await query<{ id: string; user_id: string }>(
      `SELECT id, user_id
       FROM email_verification_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used = false`,
      [tokenHash]
    );

    if (!tokenRecord) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid", request.url)
      );
    }

    // 3. Activate user in Dashboard DB
    await query(
      `UPDATE users
       SET email_verified = true, is_active = true, updated_at = NOW()
       WHERE id = $1`,
      [tokenRecord.user_id]
    );

    // 4. Activate user in Authentik
    try {
      const [user] = await query<{ authentik_user_id: string | null }>(
        `SELECT authentik_user_id FROM users WHERE id = $1`,
        [tokenRecord.user_id]
      );

      if (user?.authentik_user_id) {
        await authentikFetch(
          `/api/v3/core/users/${user.authentik_user_id}/`,
          {
            method: "PATCH",
            body: JSON.stringify({ is_active: true }),
          }
        );
      }
    } catch (err) {
      console.error("Authentik activation error (non-critical):", err);
    }

    // 5. Mark token as used
    await query(
      `UPDATE email_verification_tokens SET used = true WHERE id = $1`,
      [tokenRecord.id]
    );

    // 6. Redirect to success page
    return NextResponse.redirect(
      new URL("/verify-email?success=true", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/verify-email?error=server", request.url)
    );
  }
}
