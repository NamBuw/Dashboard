"use client";
import { useState, useEffect, useCallback } from "react";
import { Heatmap } from "@/components/kg/Heatmap";
import { Donut } from "@/components/kg/Donut";
import { BarChart } from "@/components/kg/BarChart";
import { DrillDownTable } from "@/components/kg/DrillDownTable";
import { RefreshButton } from "@/components/kg/RefreshButton";
import type { AnalyticsResponse } from "@/lib/kg-types";

type BoSach = "ALL" | "KNTT" | "CTST" | "CD" | "NONE";
const BOOK_OPTS: { value: BoSach; label: string }[] = [
  { value: "ALL", label: "Tất cả bộ" },
  { value: "KNTT", label: "Kết nối tri thức" },
  { value: "CTST", label: "Chân trời sáng tạo" },
  { value: "CD", label: "Cánh diều" },
  { value: "NONE", label: "Chưa gắn bộ" },
];

export default function AnalyticsPage() {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phân tích Kho Tri Thức</h1>
          <p className="text-muted text-sm mt-1">Chất lượng & độ phủ knowledge chunk theo môn / lớp / bộ sách.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={boSach}
            onChange={(e) => setBoSach(e.target.value as BoSach)}
            className="px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground"
          >
            {BOOK_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <RefreshButton onClick={fetchData} lastFetchedAt={data?.cachedAt} loading={loading} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 text-danger px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng chunk" value={t?.total_kc} />
        <StatCard label="Đang dùng (production)" value={t?.total_production_kc} accent />
        <StatCard label="Độ phủ số bài" value={t ? `${t.lesson_no_coverage_pct}%` : undefined} />
        <StatCard label="Độ phủ số trang" value={t ? `${t.trang_no_coverage_pct}%` : undefined} />
      </div>

      <Heatmap
        subjects={data?.heatmap?.subjects}
        grades={data?.heatmap?.grades}
        cells={data?.heatmap?.cells}
        onCellClick={setDrillCell}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Donut data={data?.demoteReasons} />
        <BarChart data={data?.boSachDistribution} />
      </div>

      {drillCell && (
        <DrillDownTable cell={{ ...drillCell, bo_sach: boSach }} onClose={() => setDrillCell(null)} />
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value?: number | string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? "text-accent" : "text-foreground"}`}>
        {value == null ? "—" : typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
