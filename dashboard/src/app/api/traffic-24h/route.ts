import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

/** 24 rolling hourly buckets of message volume from conversation_logs (oldest→newest). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isSuper = !!session.user.is_superuser;
  const uid = session.user.id;

  try {
    const scope = isSuper
      ? ""
      : "AND (user_id = $1 OR user_id IN (SELECT assigned_user_id FROM devices WHERE owner_id = $1 AND assigned_user_id IS NOT NULL))";
    const params = isSuper ? [] : [uid];
    const rows = await query<{ h: string; n: string }>(
      `SELECT date_trunc('hour', created_at) AS h, COUNT(*) AS n
       FROM conversation_logs
       WHERE created_at >= now() - interval '24 hours' ${scope}
       GROUP BY 1 ORDER BY 1`,
      params,
    );

    const buckets = new Array(24).fill(0);
    const base = new Date();
    base.setMinutes(0, 0, 0); // current clock hour
    for (const r of rows) {
      const diffH = Math.floor((base.getTime() - new Date(r.h).getTime()) / 3_600_000); // 0=current
      const idx = 23 - diffH;
      if (idx >= 0 && idx < 24) buckets[idx] = parseInt(r.n, 10);
    }
    return NextResponse.json({ traffic: buckets });
  } catch (e) {
    console.error("Traffic API error:", e);
    return NextResponse.json({ traffic: new Array(24).fill(0), error: "Failed" }, { status: 200 });
  }
}
