import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * POST /api/v1/devices/link-user
 * Link a user to a device (e.g., viewer, dependent).
 *
 * Body: { device_id, user_id, link_type }
 * Auth: Bearer token (Authentik JWT)
 *
 * RBAC:
 * - Admin: can link any user to any device
 * - AccountOwner: can link users to own devices
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { device_id, user_id, link_type = "viewer" } = body;

    if (!device_id || !user_id) {
      return NextResponse.json(
        { error: "Missing device_id or user_id" },
        { status: 400 }
      );
    }

    // Verify device exists
    const [device] = await query<{ id: string; owner_id: string }>(
      `SELECT id, owner_id FROM devices WHERE id = $1`,
      [device_id]
    );

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // RBAC: non-admin can only link to own devices
    if (!user.is_superuser && device.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify target user exists
    const [targetUser] = await query<{ id: string }>(
      `SELECT id FROM users WHERE id = $1`,
      [user_id]
    );

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create link (upsert)
    await query(
      `INSERT INTO device_user_links (device_id, user_id, link_type, linked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (device_id, user_id, link_type) DO NOTHING`,
      [device_id, user_id, link_type, user.id]
    );

    return NextResponse.json({
      success: true,
      message: "User linked to device successfully",
    });
  } catch (error) {
    console.error("Device link-user error:", error);
    return NextResponse.json(
      { error: "Failed to link user to device" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/devices/link-user
 * Remove a user link from a device.
 *
 * Body: { device_id, user_id, link_type }
 * Auth: Bearer token (Authentik JWT)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { device_id, user_id, link_type = "viewer" } = body;

    if (!device_id || !user_id) {
      return NextResponse.json(
        { error: "Missing device_id or user_id" },
        { status: 400 }
      );
    }

    // Verify device exists and user has access
    const [device] = await query<{ id: string; owner_id: string }>(
      `SELECT id, owner_id FROM devices WHERE id = $1`,
      [device_id]
    );

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (!user.is_superuser && device.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query(
      `DELETE FROM device_user_links WHERE device_id = $1 AND user_id = $2 AND link_type = $3`,
      [device_id, user_id, link_type]
    );

    return NextResponse.json({
      success: true,
      message: "User unlinked from device",
    });
  } catch (error) {
    console.error("Device unlink-user error:", error);
    return NextResponse.json(
      { error: "Failed to unlink user from device" },
      { status: 500 }
    );
  }
}
