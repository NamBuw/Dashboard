import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getLastStatus, mqttConfigured } from "@/lib/mqtt";

export const runtime = "nodejs";

interface DeviceDetail {
  id: string;
  serial_number: string | null;
  firmware_version: string | null;
  app_version: string | null;
  build_number: string | null;
  model: string | null;
  device_type: number | null;
  connection_type: number | null;
  status: string | null;
  last_seen_at: string | null;
  owner_id: string;
  assigned_user_id: string | null;
  device_hw_id: string | null;
  mac_address: string | null;
  label: string | null;
  owner_name: string | null;
  assigned_name: string | null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const isSuper = !!session.user.is_superuser;
  try {
    const [d] = await query<DeviceDetail>(
      `SELECT d.id, d.serial_number, d.firmware_version, d.app_version, d.build_number, d.model,
              d.device_type, d.connection_type, d.status, d.last_seen_at, d.owner_id, d.assigned_user_id,
              d.device_hw_id, d.mac_address, d.label,
              u1.display_name AS owner_name, u2.display_name AS assigned_name
       FROM devices d
       LEFT JOIN users u1 ON u1.id = d.owner_id
       LEFT JOIN users u2 ON u2.id = d.assigned_user_id
       WHERE d.id = $1`,
      [id],
    );
    if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isSuper && d.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const mqttId = d.device_hw_id || d.mac_address || "";
    return NextResponse.json({
      device: d,
      liveStatus: mqttId ? getLastStatus(mqttId) ?? null : null,
      mqttConfigured: mqttConfigured(),
    });
  } catch (e) {
    console.error("Device detail error:", e);
    return NextResponse.json({ error: "Failed to load device" }, { status: 500 });
  }
}
