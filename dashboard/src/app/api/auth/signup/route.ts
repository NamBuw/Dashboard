import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

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

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, confirmPassword } = await request.json();

    // 1. Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải từ 6 ký tự" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Mật khẩu xác nhận không khớp" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Địa chỉ email không hợp lệ" },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Tên đăng nhập chỉ gồm chữ, số, dấu gạch dưới (3-30 ký tự)" },
        { status: 400 }
      );
    }

    // 2. Check for existing user in Dashboard DB
    const existing = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
      [email.toLowerCase().trim(), username.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email hoặc tên đăng nhập đã được sử dụng" },
        { status: 409 }
      );
    }

    // 3. Create user in Authentik
    let authentikUserId: string;
    try {
      const createRes = await authentikFetch("/api/v3/core/users/", {
        method: "POST",
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          email: email.trim(),
          name: username.trim(),
          is_active: true,
        }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text();
        console.error("Authentik user creation failed:", createRes.status, errBody);

        if (createRes.status === 400 && errBody.includes("already exists")) {
          return NextResponse.json(
            { error: "Email hoặc tên đăng nhập đã được sử dụng" },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Không thể tạo tài khoản. Vui lòng thử lại sau." },
          { status: 502 }
        );
      }

      const createData = await createRes.json();
      authentikUserId = createData.pk;
    } catch (err) {
      console.error("Authentik API unreachable:", err);
      return NextResponse.json(
        { error: "Không thể kết nối đến dịch vụ xác thực. Vui lòng thử lại sau." },
        { status: 502 }
      );
    }

    // 4. Set password in Authentik
    try {
      const pwRes = await authentikFetch(
        `/api/v3/core/users/${authentikUserId}/set_password/`,
        {
          method: "POST",
          body: JSON.stringify({ password }),
        }
      );

      if (!pwRes.ok) {
        const errBody = await pwRes.text();
        console.error("Authentik set_password failed:", pwRes.status, errBody);
        // Cleanup: delete the Authentik user
        await authentikFetch(`/api/v3/core/users/${authentikUserId}/`, {
          method: "DELETE",
        }).catch(() => {});
        return NextResponse.json(
          { error: "Không thể tạo tài khoản. Vui lòng thử lại sau." },
          { status: 502 }
        );
      }
    } catch (err) {
      console.error("Authentik set_password error:", err);
      await authentikFetch(`/api/v3/core/users/${authentikUserId}/`, {
        method: "DELETE",
      }).catch(() => {});
      return NextResponse.json(
        { error: "Không thể tạo tài khoản. Vui lòng thử lại sau." },
        { status: 502 }
      );
    }

    // 5. Assign to AccountOwner group (non-critical)
    try {
      const groupRes = await authentikFetch(
        `/api/v3/core/groups/?name=AccountOwner`
      );
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        if (groupData.results && groupData.results.length > 0) {
          const groupPk = groupData.results[0].pk;
          await authentikFetch(`/api/v3/core/groups/${groupPk}/add_user/`, {
            method: "POST",
            body: JSON.stringify({ pk: authentikUserId }),
          }).catch((err) => console.warn("Group assignment failed:", err));
        }
      }
    } catch (err) {
      console.warn("Group assignment error (non-critical):", err);
    }

    // 6. Hash password for Dashboard DB
    let passwordHash = "";
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (err) {
      console.error("Bcrypt hashing failed:", err);
      // Cleanup: delete the Authentik user
      await authentikFetch(`/api/v3/core/users/${authentikUserId}/`, {
        method: "DELETE",
      }).catch(() => {});
      return NextResponse.json(
        { error: "Lỗi hệ thống khi mã hoá mật khẩu." },
        { status: 500 }
      );
    }

    // 7. Insert user into Dashboard DB
    try {
      const userId = randomUUID();
      const [newUser] = await query<{ id: string; username: string; email: string }>(
        `INSERT INTO users (id, username, email, password_hash, display_name, user_type, authentik_user_id, subscription_tier, is_active, is_superuser)
         VALUES ($1, $2, $3, $4, $5, 'account_owner', $6, 'basic', true, false)
         RETURNING id, username, email`,
        [
          userId,
          username.toLowerCase().trim(),
          email.trim(),
          passwordHash,
          username.trim(),
          authentikUserId,
        ]
      );

      return NextResponse.json(
        { success: true, user: newUser },
        { status: 201 }
      );
    } catch (err) {
      console.error("Dashboard DB insert failed:", err);
      // Cleanup: delete the Authentik user
      await authentikFetch(`/api/v3/core/users/${authentikUserId}/`, {
        method: "DELETE",
      }).catch(() => {});
      return NextResponse.json(
        { error: "Không thể tạo tài khoản. Vui lòng thử lại sau." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
