import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

interface DeviceRow {
  id: string;
  serial: string | null;
  label: string | null;
  status: string | null;
  last_seen_at: string | null;
  mins: number | null;
}

interface Alert {
  id: string;
  severity: "high" | "warning" | "neutral";
  message: string;
  time: string;
}

function rel(ts: string | null): string {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.round(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.round(diff / 3600)} giờ trước`;
  return `${Math.round(diff / 86400)} ngày trước`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isSuper = !!session.user.is_superuser;
  const uid = session.user.id;

  try {
    let threshold = 15;
    try {
      const [s] = await query<{ offline_threshold_min: number }>(
        "SELECT offline_threshold_min FROM app_settings WHERE id = 1",
      );
      if (s?.offline_threshold_min) threshold = s.offline_threshold_min;
    } catch { /* app_settings chưa migrate → dùng mặc định */ }

    const scope = isSuper ? "" : "AND d.owner_id = $1";
    const params = isSuper ? [] : [uid];
    const rows = await query<DeviceRow>(
      `SELECT d.id, d.serial_number AS serial, d.label, d.status, d.last_seen_at,
              EXTRACT(EPOCH FROM (now() - d.last_seen_at)) / 60 AS mins
       FROM devices d
       WHERE COALESCE(d.status, 'offline') <> 'forgotten' ${scope}`,
      params,
    );

    const alerts: Alert[] = [];
    for (const d of rows) {
      const name = d.label || d.serial || "PTalk";
      if (d.status === "error") {
        alerts.push({ id: `err-${d.id}`, severity: "high", message: `Robot ${name} đang báo lỗi`, time: rel(d.last_seen_at) });
      } else if (d.status === "offline" || (d.mins != null && d.mins > threshold)) {
        const m = d.mins != null ? Math.round(d.mins) : null;
        alerts.push({
          id: `off-${d.id}`,
          severity: "warning",
          message: `Robot ${name} mất kết nối${m != null ? ` ~${m} phút` : ""}`,
          time: rel(d.last_seen_at),
        });
      }
    }
    const order = { high: 0, warning: 1, neutral: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);
    return NextResponse.json({ alerts });
  } catch (e) {
    console.error("Alerts API error:", e);
    return NextResponse.json({ alerts: [], error: "Failed to load alerts" }, { status: 200 });
  }
}
