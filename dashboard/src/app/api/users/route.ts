import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
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

interface UserRow {
  id: string;
  username: string;
  email: string;
  user_type: string;
  display_name: string | null;
  subscription_tier: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  requests_today: string;
}

interface CountRow {
  total: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const tier = searchParams.get("tier") || "all";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (!isSuperUser) {
      conditions.push(
        `(u.id = $${paramIdx} OR u.id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $${paramIdx} AND assigned_user_id IS NOT NULL))`
      );
      params.push(currentUserId);
      paramIdx++;
    }

    if (search) {
      conditions.push(
        `(u.username ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.display_name ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (tier !== "all") {
      if (tier === "admin") {
        conditions.push(`u.is_superuser = true`);
      } else {
        conditions.push(`u.subscription_tier = $${paramIdx} AND u.is_superuser = false`);
        params.push(tier);
        paramIdx++;
      }
    }

    if (status !== "all") {
      conditions.push(`u.is_active = $${paramIdx}`);
      params.push(status === "active");
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const [countResult] = await query<CountRow>(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      params
    );

    // Get users with today's request count
    const users = await query<UserRow>(
      `SELECT
        u.id, u.username, u.email, u.user_type, u.display_name,
        u.subscription_tier, u.is_active, u.is_superuser, u.created_at,
        COALESCE(r.request_count, 0) AS requests_today
      FROM users u
      LEFT JOIN request_logs r ON r.user_id = u.id AND r.request_date = CURRENT_DATE
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.display_name,
        userType: u.user_type === "account_owner" ? "owner" : u.user_type,
        tier: u.subscription_tier || "basic",
        isActive: u.is_active,
        isSuperuser: u.is_superuser,
        requestsToday: parseInt(u.requests_today),
        createdAt: u.created_at,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.total),
        totalPages: Math.ceil(parseInt(countResult.total) / limit),
      },
    });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.is_superuser) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { username, email, password, displayName, userType, tier } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create user in Authentik
    const createRes = await authentikFetch("/api/v3/core/users/", {
      method: "POST",
      body: JSON.stringify({
        username: username.toLowerCase().trim(),
        email: email.trim(),
        name: displayName || username,
        is_active: true,
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error("Authentik user creation failed:", createRes.status, errBody);
      if (createRes.status === 400 && errBody.includes("already exists")) {
        return NextResponse.json({ error: "Username hoặc email đã tồn tại" }, { status: 409 });
      }
      return NextResponse.json({ error: "Không thể tạo tài khoản trên Authentik" }, { status: 502 });
    }

    const createData = await createRes.json();
    const authentikUserId = createData.pk;

    // 2. Set password in Authentik
    const pwRes = await authentikFetch(
      `/api/v3/core/users/${authentikUserId}/set_password/`,
      { method: "POST", body: JSON.stringify({ password }) }
    );

    if (!pwRes.ok) {
      console.error("Authentik set_password failed:", pwRes.status);
      await authentikFetch(`/api/v3/core/users/${authentikUserId}/`, { method: "DELETE" }).catch(() => {});
      return NextResponse.json({ error: "Không thể tạo tài khoản" }, { status: 502 });
    }

    // 3. Assign to AccountOwner group
    try {
      const groupRes = await authentikFetch("/api/v3/core/groups/?name=AccountOwner");
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        if (groupData.results?.length > 0) {
          await authentikFetch(`/api/v3/core/groups/${groupData.results[0].pk}/add_user/`, {
            method: "POST",
            body: JSON.stringify({ pk: authentikUserId }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Group assignment error (non-critical):", err);
    }

    // 4. Hash password and insert into Dashboard DB
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const [newUser] = await query<{ id: string; username: string; email: string }>(
      `INSERT INTO users (id, username, email, password_hash, display_name, user_type, authentik_user_id, subscription_tier, is_active, is_superuser)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false)
       RETURNING id, username, email`,
      [
        userId,
        username.toLowerCase().trim(),
        email.trim(),
        passwordHash,
        displayName || username,
        userType || "account_owner",
        authentikUserId,
        tier || "basic",
      ]
    );

    return NextResponse.json({ success: true, user: { ...newUser, subscription_tier: tier || "basic" } });
  } catch (error) {
    console.error("Users API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.is_superuser) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id, displayName, userType, tier, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Update user properties in database
    await query(
      `UPDATE users
       SET display_name = $1, user_type = $2, subscription_tier = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5`,
      [displayName, userType, tier, isActive, id]
    );

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Users API PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.is_superuser) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Prevent Admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    // Delete user from database (Cascade deletes roles, sessions, devices, etc. based on foreign keys)
    await query(`DELETE FROM users WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Users API DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
