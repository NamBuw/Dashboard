import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

// Whitelist worker → log filename (prevents path traversal: the param never
// reaches the filesystem directly).
const LOG_FILES: Record<string, string> = {
  llm: "llm_worker.log",
  stt: "stt_worker.log",
  tts: "tts_worker.log",
  ptalk_v2: "ptalk_v2.log",
  ptalk_v1: "ptalk_v1.log",
  eldercare: "ptalk_dify_eldercare.log",
  rag: "rag_server.log",
  omnivoice: "omnivoice_server.log",
};

const LOGS_DIR = process.env.CLOUDPTALK_LOGS_DIR || "/cloudptalk-logs";
const MAX_TAIL_BYTES = 512 * 1024; // read at most the last 512KB

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const worker = searchParams.get("worker") || "llm";
  const lines = Math.min(Math.max(parseInt(searchParams.get("lines") || "200", 10) || 200, 1), 2000);

  const file = LOG_FILES[worker];
  if (!file) {
    return NextResponse.json({ error: "Unknown worker", workers: Object.keys(LOG_FILES) }, { status: 400 });
  }

  const full = path.join(LOGS_DIR, file);
  try {
    const stat = await fs.stat(full);
    const start = Math.max(0, stat.size - MAX_TAIL_BYTES);
    const len = stat.size - start;
    const fh = await fs.open(full, "r");
    try {
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, start);
      const all = buf.toString("utf8").split(/\r?\n/);
      const content = all.slice(-lines).join("\n");
      return NextResponse.json({ worker, file, lines, size: stat.size, content, workers: Object.keys(LOG_FILES) });
    } finally {
      await fh.close();
    }
  } catch {
    // File missing / not mounted → graceful empty (200) so the UI shows a hint.
    return NextResponse.json(
      {
        worker,
        file,
        content: "",
        error: "Không đọc được file log (chưa mount logs vào container hoặc file chưa tồn tại).",
        workers: Object.keys(LOG_FILES),
      },
      { status: 200 },
    );
  }
}
