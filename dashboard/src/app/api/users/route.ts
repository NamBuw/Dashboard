import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    // Enforce that only Admin can CRUD users
    if (!session?.user?.is_superuser) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { username, email, password, displayName, userType, tier } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call FastAPI auth service to register user and securely hash password using bcrypt
    const AUTH_API_URL = process.env.AUTH_API_URL || "https://auth.ctslab.net";
    const registerRes = await fetch(`${AUTH_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.toLowerCase().trim(),
        email: email.trim(),
        password,
        user_type: userType || "owner",
        display_name: displayName || username,
      }),
    });

    if (!registerRes.ok) {
      const errData = await registerRes.json();
      return NextResponse.json({ error: errData.detail || "Failed to register user in Auth Service" }, { status: registerRes.status });
    }

    const newUser = await registerRes.json();

    // If subscription tier is customized (Pro/Ultra), update it directly in DB
    if (tier && tier !== "basic") {
      await query(
        `UPDATE users SET subscription_tier = $1 WHERE id = $2`,
        [tier, newUser.id]
      );
    }

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
