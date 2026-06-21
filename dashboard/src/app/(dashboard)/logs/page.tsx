"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import { BentoShell, BentoOuter } from "@/components/bento";

const WORKERS = [
  { k: "llm", label: "LLM Worker" },
  { k: "stt", label: "STT Worker" },
  { k: "tts", label: "TTS Worker" },
  { k: "ptalk_v2", label: "PTalk Kids (v2)" },
  { k: "ptalk_v1", label: "PTalk v1" },
  { k: "eldercare", label: "Eldercare" },
  { k: "rag", label: "RAG Server" },
  { k: "omnivoice", label: "OmniVoice (TTS)" },
];

const ctrl: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 12.5,
  background: "var(--inner-2)",
  border: "1px solid var(--btn-line)",
  borderRadius: 10,
  color: "var(--ink)",
  outline: "none",
};

export default function LogsPage() {
  const { data: session } = useSession();
  const isSuper = !!session?.user?.is_superuser;

  const [worker, setWorker] = useState("llm");
  const [lines, setLines] = useState(200);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(false);
  const [filter, setFilter] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/logs?worker=${worker}&lines=${lines}`);
      if (r.status === 403) {
        setError("Chỉ Super Admin được xem nhật ký.");
        setContent("");
        return;
      }
      const d = await r.json();
      setContent(d.content || "");
      setError(d.error || null);
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [worker, lines]);

  useEffect(() => { if (isSuper) load(); }, [load, isSuper]);
  useEffect(() => {
    if (!auto || !isSuper) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [auto, load, isSuper]);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [content]);

  if (session && !isSuper) {
    return (
      <BentoShell title="Nhật ký hệ thống" sub="Chỉ Super Admin">
        <div className="bento-inner" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)" }}>
          <ShieldAlert size={18} style={{ color: "var(--red)" }} />
          Bạn không có quyền xem trang này.
        </div>
      </BentoShell>
    );
  }

  const shown = filter
    ? content.split("\n").filter((l) => l.toLowerCase().includes(filter.toLowerCase())).join("\n")
    : content;

  return (
    <BentoShell title="Nhật ký hệ thống" sub="Log worker CloudPTalk (STT · LLM · TTS · servers)">
      <BentoOuter title="Worker logs" sub="Tail log đọc trực tiếp từ máy chủ">
        <div className="bento-inner" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={worker} onChange={(e) => setWorker(e.target.value)} style={ctrl}>
              {WORKERS.map((w) => <option key={w.k} value={w.k}>{w.label}</option>)}
            </select>
            <select value={lines} onChange={(e) => setLines(Number(e.target.value))} style={ctrl}>
              {[100, 200, 500, 1000].map((n) => <option key={n} value={n}>{n} dòng</option>)}
            </select>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Lọc dòng…" style={{ ...ctrl, flex: 1, minWidth: 140 }} />
            <button onClick={load} type="button" className="bento-pill" style={{ cursor: "pointer" }}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={1.8} /> Làm mới
            </button>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-2)" }}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Tự động 5s
            </label>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "var(--amber)", display: "flex", gap: 6, alignItems: "center" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <pre
            className="mono"
            style={{
              margin: 0,
              padding: 14,
              background: "var(--inner-2)",
              borderRadius: 12,
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              maxHeight: "62vh",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {shown || "(trống)"}
            <div ref={endRef} />
          </pre>
        </div>
      </BentoOuter>
    </BentoShell>
  );
}
