import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

interface SettingsRow {
  offline_threshold_min: number;
  email_alerts_enabled: boolean;
  telegram_token: string | null;
  telegram_chat_id: string | null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [row] = await query<SettingsRow>(
      "SELECT offline_threshold_min, email_alerts_enabled, telegram_token, telegram_chat_id FROM app_settings WHERE id = 1",
    );
    return NextResponse.json({
      offlineThresholdMin: row?.offline_threshold_min ?? 15,
      emailAlertsEnabled: row?.email_alerts_enabled ?? true,
      telegramToken: row?.telegram_token ?? "",
      telegramChatId: row?.telegram_chat_id ?? "",
    });
  } catch (e) {
    console.error("Settings GET error:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await request.json();
    const threshold = Math.max(1, Math.min(1440, parseInt(b.offlineThresholdMin, 10) || 15));
    const email = !!b.emailAlertsEnabled;
    const token = (b.telegramToken ?? "").toString().slice(0, 255) || null;
    const chat = (b.telegramChatId ?? "").toString().slice(0, 128) || null;
    await query(
      `INSERT INTO app_settings (id, offline_threshold_min, email_alerts_enabled, telegram_token, telegram_chat_id, updated_at)
       VALUES (1, $1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET
         offline_threshold_min = $1, email_alerts_enabled = $2,
         telegram_token = $3, telegram_chat_id = $4, updated_at = now()`,
      [threshold, email, token, chat],
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Settings PUT error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
