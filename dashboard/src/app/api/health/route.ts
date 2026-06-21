import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

const HOST = process.env.CLOUDPTALK_HOST_BASE || "http://host.docker.internal";

type Status = "healthy" | "warning" | "unhealthy";

async function pingHttp(url: string): Promise<{ ok: boolean; ms: number }> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 2500);
  try {
    await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    return { ok: true, ms: Date.now() - t0 };
  } catch {
    return { ok: false, ms: Date.now() - t0 };
  } finally {
    clearTimeout(to);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const services: { name: string; status: Status; latency: number }[] = [];

  // Postgres
  {
    const t0 = Date.now();
    try {
      await query("SELECT 1");
      const ms = Date.now() - t0;
      services.push({ name: "PostgreSQL Database", status: ms > 500 ? "warning" : "healthy", latency: ms });
    } catch {
      services.push({ name: "PostgreSQL Database", status: "unhealthy", latency: Date.now() - t0 });
    }
  }

  // CloudPTalk HTTP servers (any response = up; refused/timeout = down)
  const http = [
    { name: "PTalk Kids (v2)", url: `${HOST}:8002/` },
    { name: "PTalk Elderly (v1)", url: `${HOST}:8001/` },
    { name: "Eldercare (Dify)", url: `${HOST}:8003/` },
  ];
  const results = await Promise.all(http.map((h) => pingHttp(h.url)));
  http.forEach((h, i) => {
    const r = results[i];
    services.push({ name: h.name, status: r.ok ? (r.ms > 800 ? "warning" : "healthy") : "unhealthy", latency: r.ms });
  });

  return NextResponse.json({ services });
}
