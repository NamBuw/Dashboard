import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { publishCommand, mqttConfigured } from "@/lib/mqtt";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "set_volume",
  "set_brightness",
  "set_device_name",
  "reboot",
  "request_ble_config",
  "ota_update",
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const isSuper = !!session.user.is_superuser;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  if (!ALLOWED.has(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  try {
    const [d] = await query<{ owner_id: string; device_hw_id: string | null; mac_address: string | null }>(
      "SELECT owner_id, device_hw_id, mac_address FROM devices WHERE id = $1",
      [id],
    );
    if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isSuper && d.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const mqttId = d.device_hw_id || d.mac_address;
    if (!mqttId) return NextResponse.json({ error: "Thiết bị chưa có hw_id/MAC để điều khiển" }, { status: 400 });
    if (!mqttConfigured()) return NextResponse.json({ error: "MQTT chưa cấu hình (DASHBOARD_MQTT_URL)" }, { status: 503 });

    const cmd: Record<string, unknown> = { cmd: action };
    if (action === "set_volume") cmd.volume = Math.max(0, Math.min(100, parseInt(body.value, 10) || 0));
    else if (action === "set_brightness") cmd.brightness = Math.max(0, Math.min(100, parseInt(body.value, 10) || 0));
    else if (action === "set_device_name") cmd.device_name = String(body.value || "").slice(0, 64);
    else if (action === "ota_update" && body.value) cmd.value = String(body.value).slice(0, 32);

    const ok = publishCommand(mqttId, cmd);
    return NextResponse.json({ success: ok, sent: ok ? cmd : null });
  } catch (e) {
    console.error("Device command error:", e);
    return NextResponse.json({ error: "Failed to send command" }, { status: 500 });
  }
}
