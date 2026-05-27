import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

interface StatsRow {
  total_users: string;
  active_users: string;
  new_today: string;
  new_this_week: string;
}

interface TierRow {
  subscription_tier: string;
  count: string;
}

interface RequestRow {
  total_requests: string;
  active_users_today: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    if (isSuperUser) {
      // Total users, active, new today (Admin only)
      const [userStats] = await query<StatsRow>(`
        SELECT
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE is_active = true) AS active_users,
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS new_today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_this_week
        FROM users
      `);

      // Tier distribution (Admin only)
      const tiers = await query<TierRow>(`
        SELECT
          CASE
            WHEN is_superuser = true THEN 'admin'
            ELSE subscription_tier
          END AS subscription_tier,
          COUNT(*) AS count
        FROM users
        GROUP BY
          CASE
            WHEN is_superuser = true THEN 'admin'
            ELSE subscription_tier
          END
        ORDER BY count DESC
      `);

      // Today's requests (Admin only)
      const [requestStats] = await query<RequestRow>(`
        SELECT
          COALESCE(SUM(request_count), 0) AS total_requests,
          COUNT(DISTINCT user_id) AS active_users_today
        FROM request_logs
        WHERE request_date = CURRENT_DATE
      `);

      // Recent users (last 5) (Admin only)
      const recentUsers = await query(`
        SELECT id, username, email, subscription_tier, is_superuser, is_active, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);

      // Real device statistics (Admin only)
      const [deviceStats] = await query<{
        total_devices: string;
        online_devices: string;
        offline_devices: string;
        error_devices: string;
      }>(`
        SELECT
          COUNT(*) AS total_devices,
          COUNT(*) FILTER (WHERE status = 'online') AS online_devices,
          COUNT(*) FILTER (WHERE status = 'offline' OR status IS NULL OR status = '') AS offline_devices,
          COUNT(*) FILTER (WHERE status = 'error') AS error_devices
        FROM devices
      `);

      return NextResponse.json({
        users: {
          total: parseInt(userStats.total_users || "0"),
          active: parseInt(userStats.active_users || "0"),
          newToday: parseInt(userStats.new_today || "0"),
          newThisWeek: parseInt(userStats.new_this_week || "0"),
        },
        tiers: tiers.map((t) => ({
          tier: t.subscription_tier,
          count: parseInt(t.count),
        })),
        requests: {
          totalToday: parseInt(requestStats.total_requests || "0"),
          activeUsersToday: parseInt(requestStats.active_users_today || "0"),
        },
        devices: {
          total: parseInt(deviceStats.total_devices || "0"),
          online: parseInt(deviceStats.online_devices || "0"),
          offline: parseInt(deviceStats.offline_devices || "0"),
          error: parseInt(deviceStats.error_devices || "0"),
        },
        recentUsers,
      });
    } else {
      // Normal user (Pro / Ultra) statistics filtered by their own family scope
      // Total users in family (owner + assigned children)
      const [userStats] = await query<StatsRow>(
        `SELECT
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE is_active = true) AS active_users,
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS new_today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_this_week
        FROM users
        WHERE id = $1 OR id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $1 AND assigned_user_id IS NOT NULL)`,
        [currentUserId]
      );

      // Tier distribution in family
      const tiers = await query<TierRow>(
        `SELECT
          subscription_tier,
          COUNT(*) AS count
        FROM users
        WHERE id = $1 OR id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $1 AND assigned_user_id IS NOT NULL)
        GROUP BY subscription_tier
        ORDER BY count DESC`,
        [currentUserId]
      );

      // Today's requests for their own family
      const [requestStats] = await query<RequestRow>(
        `SELECT
          COALESCE(SUM(request_count), 0) AS total_requests,
          COUNT(DISTINCT user_id) AS active_users_today
        FROM request_logs
        WHERE request_date = CURRENT_DATE
          AND (user_id = $1 OR user_id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $1 AND assigned_user_id IS NOT NULL))`,
        [currentUserId]
      );

      // Recent family users (last 5)
      const recentUsers = await query(
        `SELECT id, username, email, subscription_tier, is_superuser, is_active, created_at
        FROM users
        WHERE id = $1 OR id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $1 AND assigned_user_id IS NOT NULL)
        ORDER BY created_at DESC
        LIMIT 5`,
        [currentUserId]
      );

      // Device stats for this owner
      const [deviceStats] = await query<{
        total_devices: string;
        online_devices: string;
        offline_devices: string;
        error_devices: string;
      }>(
        `SELECT
          COUNT(*) AS total_devices,
          COUNT(*) FILTER (WHERE status = 'online') AS online_devices,
          COUNT(*) FILTER (WHERE status = 'offline' OR status IS NULL OR status = '') AS offline_devices,
          COUNT(*) FILTER (WHERE status = 'error') AS error_devices
        FROM devices
        WHERE owner_id = $1`,
        [currentUserId]
      );

      return NextResponse.json({
        users: {
          total: parseInt(userStats.total_users || "0"),
          active: parseInt(userStats.active_users || "0"),
          newToday: parseInt(userStats.new_today || "0"),
          newThisWeek: parseInt(userStats.new_this_week || "0"),
        },
        tiers: tiers.map((t) => ({
          tier: t.subscription_tier,
          count: parseInt(t.count),
        })),
        requests: {
          totalToday: parseInt(requestStats.total_requests || "0"),
          activeUsersToday: parseInt(requestStats.active_users_today || "0"),
        },
        devices: {
          total: parseInt(deviceStats.total_devices || "0"),
          online: parseInt(deviceStats.online_devices || "0"),
          offline: parseInt(deviceStats.offline_devices || "0"),
          error: parseInt(deviceStats.error_devices || "0"),
        },
        recentUsers,
      });
    }
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
