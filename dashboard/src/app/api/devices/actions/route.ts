import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Helper: Clear all conversation data for a specific device.
 * Scoped to device_id (not user_id) to avoid wiping data from other devices.
 */
async function clearDeviceConversationData(deviceId: string) {
  // Delete conversation_logs linked to this device
  await query(`DELETE FROM conversation_logs WHERE device_id = $1`, [deviceId]);

  // Also delete conversation_logs that have no device_id but belong to the device's assigned_user
  // (legacy rows written before device_id was added)
  const [device] = await query<{ assigned_user_id: string | null }>(
    `SELECT assigned_user_id FROM devices WHERE id = $1`,
    [deviceId]
  );
  if (device?.assigned_user_id) {
    // Only delete orphan logs (device_id IS NULL) for this assigned user
    await query(
      `DELETE FROM conversation_logs WHERE user_id = $1 AND device_id IS NULL`,
      [device.assigned_user_id]
    );
  }

  // Delete chat sessions linked to this device
  const sessionIds = await query<{ id: string }>(
    `SELECT id FROM chat_sessions WHERE device_id = $1`,
    [deviceId]
  );
  if (sessionIds.length > 0) {
    const ids = sessionIds.map((s) => s.id);
    await query(`DELETE FROM chat_messages WHERE session_id = ANY($1)`, [ids]);
    await query(`DELETE FROM chat_sessions WHERE id = ANY($1)`, [ids]);
  }

  // Delete robot conversations linked to this device
  await query(`DELETE FROM robot_conversations WHERE device_id = $1`, [deviceId]);
}

/**
 * POST /api/devices/actions
 * Unified device action endpoint.
 *
 * Body: { action: "forget" | "transfer" | "factory-reset", deviceId, newOwnerId? }
 *
 * Actions:
 * - "forget":        Soft-delete device. Clears conversation data, removes owner link,
 *                    sets status='forgotten'. Device can re-register with same MAC.
 * - "transfer":      Transfer device to another user. Changes owner_id, clears old
 *                    conversation data, resets assigned_user. Requires newOwnerId.
 * - "factory-reset": Wipe conversation data only. Device stays registered to owner.
 *
 * RBAC: admin can act on any device, owner can act on own devices.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;
    const body = await request.json();
    const { action, deviceId, newOwnerId } = body;

    if (!deviceId || !action) {
      return NextResponse.json(
        { error: "Missing deviceId or action" },
        { status: 400 }
      );
    }

    const validActions = ["forget", "transfer", "factory-reset"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch device
    const [device] = await query<{
      id: string;
      owner_id: string;
      mac_address: string;
      label: string | null;
    }>(
      `SELECT id, owner_id, mac_address, label FROM devices WHERE id = $1`,
      [deviceId]
    );

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (!isSuperUser && device.owner_id !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden - You do not own this device" },
        { status: 403 }
      );
    }

    // ── Action: forget ──
    if (action === "forget") {
      await clearDeviceConversationData(deviceId);

      // Soft-delete: mark as forgotten, detach assigned user
      // owner_id is kept (NOT NULL constraint) but device is reclaimable
      await query(
        `UPDATE devices SET status = 'forgotten', assigned_user_id = NULL, last_seen_at = NOW() WHERE id = $1`,
        [deviceId]
      );

      // Remove all device-user links
      await query(`DELETE FROM device_user_links WHERE device_id = $1`, [deviceId]);

      return NextResponse.json({
        success: true,
        message: `Device "${device.label || device.mac_address}" has been forgotten. Conversation data cleared. The device can re-register with a new owner.`,
      });
    }

    // ── Action: transfer ──
    if (action === "transfer") {
      if (!newOwnerId) {
        return NextResponse.json(
          { error: "Missing newOwnerId for transfer action" },
          { status: 400 }
        );
      }

      // Verify new owner exists
      const [newOwner] = await query<{ id: string; display_name: string }>(
        `SELECT id, display_name FROM users WHERE id = $1`,
        [newOwnerId]
      );
      if (!newOwner) {
        return NextResponse.json(
          { error: "New owner user not found" },
          { status: 404 }
        );
      }

      // Clear conversation data from previous owner
      await clearDeviceConversationData(deviceId);

      // Transfer ownership
      await query(
        `UPDATE devices SET owner_id = $1, assigned_user_id = NULL, status = 'offline', last_seen_at = NOW() WHERE id = $2`,
        [newOwnerId, deviceId]
      );

      // Update device_user_links
      await query(`DELETE FROM device_user_links WHERE device_id = $1`, [deviceId]);
      await query(
        `INSERT INTO device_user_links (device_id, user_id, link_type, linked_by)
         VALUES ($1, $2, 'owner', $3)
         ON CONFLICT (device_id, user_id, link_type) DO NOTHING`,
        [deviceId, newOwnerId, currentUserId]
      );

      // Auto-upgrade new owner if basic
      await query(
        `UPDATE users SET subscription_tier = 'ultra' WHERE id = $1 AND subscription_tier = 'basic'`,
        [newOwnerId]
      );

      return NextResponse.json({
        success: true,
        message: `Device "${device.label || device.mac_address}" transferred to ${newOwner.display_name}. Conversation data cleared.`,
      });
    }

    // ── Action: factory-reset ──
    if (action === "factory-reset") {
      await clearDeviceConversationData(deviceId);

      return NextResponse.json({
        success: true,
        message: `Device "${device.label || device.mac_address}" conversation data has been reset. Device remains registered.`,
      });
    }

    // Should never reach here
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Devices action error:", error);
    return NextResponse.json(
      { error: "Failed to perform device action" },
      { status: 500 }
    );
  }
}
