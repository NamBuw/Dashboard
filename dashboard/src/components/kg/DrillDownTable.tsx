"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

const SUBJECT_LABELS: Record<string, string> = {
  toan: "Toán", ngu_van: "Ngữ văn", khtn: "KHTN", tieng_viet: "Tiếng Việt",
  lich_su: "Lịch sử", dia_li: "Địa lí", gdcd: "GDCD", tieng_anh: "Tiếng Anh",
  vat_li: "Vật lí", hoa_hoc: "Hóa học", sinh_hoc: "Sinh học",
  lich_su_dia_li: "Lịch sử & Địa lí", tnxh: "TNXH",
};

interface Row {
  uid: string; title?: string; lesson_no?: number; trang_no?: number;
  source_name?: string; source_url?: string; text_length?: number;
}
interface Props {
  cell: { subject: string; grade: number; bo_sach: string };
  onClose: () => void;
}

export function DrillDownTable({ cell, onClose }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ subject: cell.subject, grade: String(cell.grade), bo_sach: cell.bo_sach, limit: "20" });
    fetch(`/api/kg/drilldown?${qs}`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "Không tải được dữ liệu");
        else setRows(json.rows ?? []);
      })
      .catch(() => { if (!cancelled) setError("Neo4j không khả dụng"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cell]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-background border border-border rounded-2xl flex flex-col shadow-lg">
        <div className="flex items-center justify-between px-5 h-[52px] border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">
            {SUBJECT_LABELS[cell.subject] ?? cell.subject} · Lớp {cell.grade}
            {cell.bo_sach !== "ALL" && ` · ${cell.bo_sach}`} — 20 chunk mẫu
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-muted text-sm">Đang tải...</div>
          ) : error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 text-danger px-3 py-2 text-sm">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-muted text-sm">Không có chunk nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="py-2 pr-2">Tiêu đề</th>
                  <th className="py-2 px-2 whitespace-nowrap">Bài</th>
                  <th className="py-2 px-2 whitespace-nowrap">Trang</th>
                  <th className="py-2 px-2 whitespace-nowrap">Nguồn</th>
                  <th className="py-2 pl-2 text-right whitespace-nowrap">Ký tự</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.uid} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground">
                      <div className="line-clamp-2">{r.title ?? r.uid}</div>
                    </td>
                    <td className="py-2 px-2 text-muted">{r.lesson_no ?? "-"}</td>
                    <td className="py-2 px-2 text-muted">{r.trang_no ?? "-"}</td>
                    <td className="py-2 px-2 text-muted">
                      {r.source_url ? (
                        <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                          {r.source_name ?? "link"} <ExternalLink size={12} />
                        </a>
                      ) : (r.source_name ?? "-")}
                    </td>
                    <td className="py-2 pl-2 text-right text-muted">{r.text_length?.toLocaleString() ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
