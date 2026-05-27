import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * POST /api/v1/devices/register
 * Register a new device from PAssistant mobile app.
 *
 * Body: { mac_address, serial_number, model?, device_type?, firmware_version? }
 * Auth: Bearer token (Authentik JWT)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token
    const user = await verifyBearerToken(
      request.headers.get("Authorization")
    );
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mac_address, serial_number, model, device_type, firmware_version } = body;

    if (!mac_address) {
      return NextResponse.json(
        { error: "Missing mac_address" },
        { status: 400 }
      );
    }

    // Check if device already exists
    const [existing] = await query<{ id: string; owner_id: string }>(
      `SELECT id, owner_id FROM devices WHERE mac_address = $1`,
      [mac_address.trim()]
    );

    if (existing) {
      // Device exists - check if same owner
      if (existing.owner_id === user.id) {
        // Update last_seen_at
        await query(
          `UPDATE devices SET last_seen_at = NOW(), status = 'online' WHERE id = $1`,
          [existing.id]
        );
        return NextResponse.json({
          success: true,
          deviceId: existing.id,
          message: "Device already registered, updated status",
        });
      } else {
        return NextResponse.json(
          { error: "Device registered by another user" },
          { status: 409 }
        );
      }
    }

    // Get ptalk product ID
    const [ptalkProd] = await query<{ id: string }>(
      `SELECT id FROM products WHERE code = 'ptalk'`
    );

    // Register new device
    const [newDevice] = await query<{ id: string }>(
      `INSERT INTO devices (owner_id, mac_address, serial_number, model, device_type, firmware_version, product_id, status, connection_type, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'online', 1, NOW())
       RETURNING id`,
      [
        user.id,
        mac_address.trim(),
        serial_number?.trim() || null,
        model || "PTalk Robot",
        device_type || 1,
        firmware_version || "v2.1.4",
        ptalkProd?.id || null,
      ]
    );

    // Auto-upgrade owner from basic to ultra
    await query(
      `UPDATE users SET subscription_tier = 'ultra' WHERE id = $1 AND subscription_tier = 'basic'`,
      [user.id]
    );

    // Create device_user_link
    await query(
      `INSERT INTO device_user_links (device_id, user_id, link_type, linked_by)
       VALUES ($1, $2, 'owner', $2)
       ON CONFLICT DO NOTHING`,
      [newDevice.id, user.id]
    );

    return NextResponse.json({
      success: true,
      deviceId: newDevice.id,
      message: "Device registered successfully",
    });
  } catch (error) {
    console.error("Device register error:", error);
    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 }
    );
  }
}
