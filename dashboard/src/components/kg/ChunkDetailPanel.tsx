"use client";
import { useEffect, useState, type ReactNode } from "react";
import { X, ExternalLink } from "lucide-react";

interface ChunkDetail {
  uid: string; title?: string; text?: string;
  subject_code?: string; grade?: string | number; bo_sach?: string;
  lesson_no?: number; trang_no?: number;
  source_name?: string; source_url?: string;
  production_ready?: boolean; demote_reason?: string;
  text_length?: number;
  parent_lesson_guide_title?: string; parent_lesson_guide_url?: string;
}

interface Props {
  uid: string;
  onClose: () => void;
}

export function ChunkDetailPanel({ uid, onClose }: Props) {
  const [data, setData] = useState<ChunkDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/kg/chunk/${encodeURIComponent(uid)}`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "Không tải được chunk");
        else setData(json);
      })
      .catch(() => { if (!cancelled) setError("Neo4j không khả dụng"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid]);

  const rows: [string, ReactNode][] = data ? [
    ["UID", <span key="u" className="font-mono text-xs break-all">{data.uid}</span>],
    ["Môn", data.subject_code ?? "-"],
    ["Lớp", data.grade ?? "-"],
    ["Bộ sách", data.bo_sach ?? "-"],
    ["Bài", data.lesson_no ?? "-"],
    ["Trang", data.trang_no ?? "-"],
    ["Nguồn", data.source_name ?? "-"],
    ["Số ký tự", data.text_length?.toLocaleString() ?? "-"],
    ["Trạng thái", data.production_ready ? "Đang dùng" : `Bị loại${data.demote_reason ? ` (${data.demote_reason})` : ""}`],
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative w-full max-w-[480px] h-full bg-background border-l border-border flex flex-col shadow-lg">
        <div className="flex items-center justify-between h-[52px] px-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Chi tiết chunk</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="text-muted text-sm">Đang tải...</div>
          ) : error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 text-danger px-3 py-2 text-sm">{error}</div>
          ) : data ? (
            <>
              <div className="text-base font-medium text-foreground">{data.title ?? "(không tiêu đề)"}</div>
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 text-muted align-top whitespace-nowrap">{k}</td>
                      <td className="py-1.5 text-foreground break-words">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.source_url && (
                <a href={data.source_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                  <ExternalLink size={14} /> Mở nguồn
                </a>
              )}
              {data.text && (
                <div>
                  <div className="text-xs text-muted mb-1">Nội dung</div>
                  <div className="text-sm text-foreground whitespace-pre-wrap bg-card border border-border rounded-lg p-3 max-h-[40vh] overflow-auto">
                    {data.text}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
