"use client";
import { useState, useEffect, useCallback } from "react";
import { FilterSidebar } from "@/components/kg/FilterSidebar";
import { Breadcrumb } from "@/components/kg/Breadcrumb";
import { ViewToggle } from "@/components/kg/ViewToggle";
import { BrowseListView } from "@/components/kg/BrowseListView";
import { BrowseGraphView } from "@/components/kg/BrowseGraphView";
import { ChunkDetailPanel } from "@/components/kg/ChunkDetailPanel";
import { RefreshButton } from "@/components/kg/RefreshButton";
import { BentoShell, BentoOuter } from "@/components/bento";
import type { BrowseResponse, BrowseItem, GraphNode } from "@/lib/kg-types";

export interface FilterState {
  bo_sach: string | null;
  subject: string | null;
  grade: string | null;
  lesson_no: string | null;
  status: "prod" | "all" | "demoted";
}

export default function BrowsePage() {
  const [filter, setFilter] = useState<FilterState>({
    bo_sach: null, subject: null, grade: null, lesson_no: null, status: "prod",
  });
  const [view, setView] = useState<"list" | "graph">("list");
  const [data, setData] = useState<BrowseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChunkUid, setSelectedChunkUid] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      Object.entries(filter).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)); });
      const res = await fetch(`/api/kg/browse?${qs}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Đã xảy ra lỗi"); setData(null); }
      else setData(json);
    } catch {
      setError("Neo4j không khả dụng");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const drillInto = (item: BrowseItem) => {
    if (!data) return;
    if (data.level === "L0_book") setFilter((f) => ({ ...f, bo_sach: item.id }));
    else if (data.level === "L1_subject") setFilter((f) => ({ ...f, subject: item.id }));
    else if (data.level === "L2_grade") setFilter((f) => ({ ...f, grade: item.id }));
    else if (data.level === "L3_lesson") setFilter((f) => ({ ...f, lesson_no: item.id }));
    else if (data.level === "L4_chunk") setSelectedChunkUid(item.id);
  };

  const drillIntoGraphNode = (node: GraphNode) => {
    if (!data) return;
    const itemId = String(node.id).split("/").pop();
    const item = data.items.find((i) => i.id === itemId);
    if (item) drillInto(item);
  };

  const jumpToCrumb = (idx: number) => {
    setFilter((f) => {
      const next: FilterState = { ...f };
      if (idx < 4) next.lesson_no = null;
      if (idx < 3) next.grade = null;
      if (idx < 2) next.subject = null;
      if (idx < 1) next.bo_sach = null;
      return next;
    });
  };

  return (
    <BentoShell title="Kho tri thức" sub="Duyệt đồ thị Neo4j theo cấp · bộ → môn → lớp → bài → chunk">
      <BentoOuter>
        <div className="bento-inner" style={{ padding: 0, display: "flex", minHeight: "60vh" }}>
          <div style={{ width: 260, borderRight: "1px solid var(--line)", flex: "none", overflowY: "auto" }}>
            <FilterSidebar filter={filter} onChange={setFilter} />
          </div>
          <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: 16,
                borderBottom: "1px solid var(--line)",
                flexWrap: "wrap",
              }}
            >
              <Breadcrumb crumbs={data?.breadcrumb ?? []} onJump={jumpToCrumb} />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <ViewToggle value={view} onChange={setView} />
                <RefreshButton onClick={fetchData} lastFetchedAt={data?.cachedAt} loading={loading} />
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
              {error ? (
                <div style={{
                  borderRadius: 12,
                  border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
                  background: "color-mix(in srgb, var(--red) 12%, var(--inner))",
                  color: "var(--red)",
                  padding: "12px 16px",
                  fontSize: 13,
                }}>
                  {error}
                </div>
              ) : loading && !data ? (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Đang tải...</div>
              ) : (data?.items ?? []).length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Không có dữ liệu trong scope này</div>
              ) : view === "list" ? (
                <BrowseListView items={data!.items} level={data!.level} onClick={drillInto} />
              ) : (
                <BrowseGraphView graph={data!.graph} onNodeClick={drillIntoGraphNode} />
              )}
            </div>
          </main>
        </div>
      </BentoOuter>
      {selectedChunkUid && (
        <ChunkDetailPanel uid={selectedChunkUid} onClose={() => setSelectedChunkUid(null)} />
      )}
    </BentoShell>
  );
}
