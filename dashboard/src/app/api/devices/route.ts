import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

interface DeviceRow {
  id: string;
  serial_number: string;
  firmware_version: string;
  status: string;
  owner_name: string;
  assigned_user_name: string | null;
  last_seen_at: string;
  created_at: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    let devices: DeviceRow[] = [];

    if (isSuperUser) {
      // Admin sees all devices
      devices = await query<DeviceRow>(
        `SELECT 
          d.id, d.serial_number, d.firmware_version, d.status,
          u1.display_name AS owner_name, u2.display_name AS assigned_user_name,
          d.last_seen_at, d.created_at
        FROM devices d
        JOIN users u1 ON d.owner_id = u1.id
        LEFT JOIN users u2 ON d.assigned_user_id = u2.id
        ORDER BY d.created_at DESC`
      );
    } else {
      // Normal user only sees their own devices
      devices = await query<DeviceRow>(
        `SELECT 
          d.id, d.serial_number, d.firmware_version, d.status,
          u1.display_name AS owner_name, u2.display_name AS assigned_user_name,
          d.last_seen_at, d.created_at
        FROM devices d
        JOIN users u1 ON d.owner_id = u1.id
        LEFT JOIN users u2 ON d.assigned_user_id = u2.id
        WHERE d.owner_id = $1
        ORDER BY d.created_at DESC`,
        [currentUserId]
      );
    }

    return NextResponse.json({
      devices: devices.map((d) => ({
        id: d.id,
        serialNumber: d.serial_number,
        firmwareVersion: d.firmware_version || "v2.1.4",
        status: d.status || "offline",
        ownerName: d.owner_name,
        assignedUser: d.assigned_user_name,
        uptime: "Active",
        lastSeen: d.last_seen_at
          ? new Date(d.last_seen_at).toLocaleDateString("vi-VN")
          : "Chưa rõ",
      })),
    });
  } catch (error) {
    console.error("Devices API GET error:", error);
    return NextResponse.json(
      { error: "Failed to load devices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    const { serialNumber, macAddress, ownerId } = await request.json();

    if (!serialNumber || !macAddress) {
      return NextResponse.json(
        { error: "Missing serialNumber or macAddress" },
        { status: 400 }
      );
    }

    // Target owner ID
    const targetOwnerId = isSuperUser && ownerId ? ownerId : currentUserId;

    // Check if device already registered
    const [existing] = await query<{ id: string }>(
      `SELECT id FROM devices WHERE mac_address = $1 OR serial_number = $2`,
      [macAddress.trim(), serialNumber.trim()]
    );

    if (existing) {
      return NextResponse.json(
        { error: "Device with this MAC or Serial is already registered" },
        { status: 400 }
      );
    }

    // Get ptalk product ID from products
    const [ptalkProd] = await query<{ id: string }>(
      `SELECT id FROM products WHERE code = 'ptalk'`
    );
    const productId = ptalkProd ? ptalkProd.id : null;

    // Register device
    const [newDevice] = await query<{ id: string }>(
      `INSERT INTO devices (owner_id, serial_number, mac_address, status, firmware_version, product_id, connection_type, last_seen_at)
       VALUES ($1, $2, $3, 'online', 'v2.1.4', $4, 1, NOW())
       RETURNING id`,
      [targetOwnerId, serialNumber.trim(), macAddress.trim(), productId]
    );

    // Auto Upgrade: Upgrade physical device owner from 'basic' to 'ultra' for free
    await query(
      `UPDATE users 
       SET subscription_tier = 'ultra' 
       WHERE id = $1 AND subscription_tier = 'basic'`,
      [targetOwnerId]
    );

    return NextResponse.json({
      success: true,
      deviceId: newDevice.id,
      message: "Device registered successfully, owner upgraded to Ultra",
    });
  } catch (error) {
    console.error("Devices API POST error:", error);
    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;

    const { deviceId, assigneeName } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing device ID" },
        { status: 400 }
      );
    }

    // Fetch device to check ownership
    const [device] = await query<{ owner_id: string }>(
      `SELECT owner_id FROM devices WHERE id = $1`,
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

    if (!assigneeName || !assigneeName.trim()) {
      // Unassign
      await query(
        `UPDATE devices SET assigned_user_id = NULL WHERE id = $1`,
        [deviceId]
      );
      return NextResponse.json({ success: true, message: "Device unassigned" });
    }

    // Assigning: Look up child user in family scope or create a new one
    // Find child user with same name in this owner's family
    let [childUser] = await query<{ id: string }>(
      `SELECT id FROM users 
       WHERE display_name = $1 AND user_type = 'child'
         AND (id = $2 OR id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $2 AND assigned_user_id IS NOT NULL))`,
      [assigneeName.trim(), device.owner_id]
    );

    if (!childUser) {
      // Create a child account under the hood
      const childUsername = `child_${assigneeName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}_${Math.floor(100 + Math.random() * 900)}`;
      const childEmail = `${childUsername}@ptalk.net`;

      const [newChild] = await query<{ id: string }>(
        `INSERT INTO users (username, email, display_name, user_type, subscription_tier, is_active, is_superuser, password_hash)
         VALUES ($1, $2, $3, 'child', 'basic', true, false, 'child-non-interactive-password')
         RETURNING id`,
        [childUsername, childEmail, assigneeName.trim()]
      );
      childUser = newChild;
    }

    // Update device link
    await query(
      `UPDATE devices SET assigned_user_id = $1 WHERE id = $2`,
      [childUser.id, deviceId]
    );

    return NextResponse.json({
      success: true,
      message: `Device successfully assigned to beneficiary ${assigneeName}`,
    });
  } catch (error) {
    console.error("Devices API PUT error:", error);
    return NextResponse.json(
      { error: "Failed to assign device" },
      { status: 500 }
    );
  }
}
