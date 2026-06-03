"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Database, BookOpen, FileText, Search, RefreshCw, AlertTriangle } from "lucide-react";
import {
  BentoShell,
  BentoOuter,
  BentoStat,
  BentoDonut,
  BentoLegend,
  BentoHBars,
  BentoHeatmap,
} from "@/components/bento";
import { DrillDownTable } from "@/components/kg/DrillDownTable";
import type { AnalyticsResponse } from "@/lib/kg-types";

type BoSach = "ALL" | "KNTT" | "CTST" | "CD" | "NONE";
const BOOK_OPTS: { value: BoSach; label: string }[] = [
  { value: "ALL", label: "Tất cả bộ" },
  { value: "KNTT", label: "Kết nối tri thức" },
  { value: "CTST", label: "Chân trời sáng tạo" },
  { value: "CD", label: "Cánh diều" },
  { value: "NONE", label: "Chưa gắn bộ" },
];

const SUBJECT_LABELS: Record<string, string> = {
  toan: "Toán", ngu_van: "Ngữ văn", khtn: "KHTN", tieng_viet: "Tiếng Việt",
  lich_su: "Lịch sử", dia_li: "Địa lí", gdcd: "GDCD", tieng_anh: "Tiếng Anh",
  vat_li: "Vật lí", hoa_hoc: "Hóa học", sinh_hoc: "Sinh học",
  lich_su_dia_li: "Lịch sử & Địa lí", tnxh: "TNXH",
};

const CAT_PALETTE = ["var(--blue)", "var(--sky)", "var(--green)", "var(--amber)", "var(--red)", "var(--slate)"];

export default function KGAnalyticsPage() {
  const [boSach, setBoSach] = useState<BoSach>("ALL");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drillCell, setDrillCell] = useState<{ subject: string; grade: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kg/analytics?bo_sach=${boSach}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Đã xảy ra lỗi"); setData(null); }
      else setData(json);
    } catch {
      setError("Neo4j không khả dụng");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [boSach]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const t = data?.totals;

  const { grid, rowLabels, colLabels, subjects, grades } = useMemo(() => {
    const subjects = data?.heatmap?.subjects ?? [];
    const grades = data?.heatmap?.grades ?? [];
    const cells = data?.heatmap?.cells ?? [];
    const lookup = new Map<string, number>();
    for (const cell of cells) lookup.set(`${cell.subject}|${cell.grade}`, cell.count);
    const grid = subjects.map((s) => grades.map((g) => lookup.get(`${s}|${g}`) ?? 0));
    return {
      grid,
      rowLabels: subjects.map((s) => SUBJECT_LABELS[s] ?? s),
      colLabels: grades.map((g) => `L${g}`),
      subjects,
      grades,
    };
  }, [data]);

  const demoteData = useMemo(() => {
    if (!data?.demoteReasons) return [];
    return data.demoteReasons.map((d) => ({ l: d.reason, v: d.count }));
  }, [data]);

  const boSachDonut = useMemo(() => {
    if (!data?.boSachDistribution) return [];
    return data.boSachDistribution.map((d, i) => ({
      l: d.bo_sach || "Chưa gắn",
      v: d.count,
      c: CAT_PALETTE[i % CAT_PALETTE.length],
    }));
  }, [data]);

  const boSachTotal = boSachDonut.reduce((s, d) => s + d.v, 0);

  return (
    <BentoShell
      title="Phân tích Kho tri thức"
      sub="Chất lượng & độ phủ knowledge chunk theo môn / lớp / bộ sách"
    >
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <select
          value={boSach}
          onChange={(e) => setBoSach(e.target.value as BoSach)}
          style={{
            padding: "9px 14px",
            fontSize: 13,
            background: "var(--inner)",
            border: "1px solid var(--btn-line)",
            borderRadius: 14,
            color: "var(--ink)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {BOOK_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={fetchData}
          disabled={loading}
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            background: "var(--inner)",
            border: "1px solid var(--btn-line)",
            borderRadius: 14,
            color: "var(--ink-2)",
            fontSize: 13,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <RefreshCw size={14} strokeWidth={1.8} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          Làm mới
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "color-mix(in srgb, var(--red) 12%, var(--inner))",
            border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
            color: "var(--red)",
            borderRadius: 14,
            fontSize: 13,
          }}
        >
          <AlertTriangle size={16} strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
        <BentoStat
          icon={Database}
          label="Tổng chunk"
          value={t?.total_kc?.toLocaleString("vi") ?? "—"}
          delta="trong kho"
          deltaTone="neutral"
        />
        <BentoStat
          icon={BookOpen}
          label="Đang dùng (production)"
          value={t?.total_production_kc?.toLocaleString("vi") ?? "—"}
          delta="sẵn sàng phục vụ RAG"
          deltaTone="neutral"
        />
        <BentoStat
          icon={FileText}
          label="Độ phủ số bài"
          value={t ? `${t.lesson_no_coverage_pct}%` : "—"}
          delta="có lesson_no"
          deltaTone="neutral"
        />
        <BentoStat
          icon={Search}
          label="Độ phủ số trang"
          value={t ? `${t.trang_no_coverage_pct}%` : "—"}
          delta="có trang_no"
          deltaTone="neutral"
        />
      </div>

      {/* Heatmap (full width) */}
      <BentoOuter title="Mật độ chunk theo môn × lớp" sub="Nhấp vào ô để xem chi tiết 20 chunk mẫu">
        <div className="bento-inner">
          {grid.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              {loading ? "Đang tải dữ liệu…" : "Không có dữ liệu cho bộ sách đã chọn"}
            </div>
          ) : (
            <BentoHeatmap
              grid={grid}
              rowLabels={rowLabels}
              colLabels={colLabels}
              onCellClick={(r, c, v) => {
                if (v > 0) setDrillCell({ subject: subjects[r], grade: grades[c] });
              }}
              cellTitle={(r, c, v) => `${rowLabels[r]} · Lớp ${grades[c]} · ${v} chunk`}
            />
          )}
        </div>
      </BentoOuter>

      {/* Donut + HBars */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 22, alignItems: "start" }}>
        <BentoOuter title="Bộ sách" sub="Phân bố chunk theo bộ sách">
          <div className="bento-inner" style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {boSachDonut.length === 0 ? (
              <div style={{ padding: 20, color: "var(--muted)", fontSize: 12 }}>Chưa có dữ liệu</div>
            ) : (
              <>
                <BentoDonut data={boSachDonut} size={168} thick={23} center={boSachTotal.toLocaleString("vi")} centerSub="chunk" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <BentoLegend data={boSachDonut} />
                </div>
              </>
            )}
          </div>
        </BentoOuter>

        <BentoOuter title="Lý do hạ cấp chunk" sub="Top reason demote (đang trong staging)">
          <div className="bento-inner">
            {demoteData.length === 0 ? (
              <div style={{ padding: 20, color: "var(--muted)", fontSize: 12 }}>Không có chunk nào bị hạ cấp</div>
            ) : (
              <BentoHBars data={demoteData} />
            )}
          </div>
        </BentoOuter>
      </div>

      {drillCell && (
        <DrillDownTable
          cell={{ ...drillCell, bo_sach: boSach }}
          onClose={() => setDrillCell(null)}
        />
      )}
    </BentoShell>
  );
}
