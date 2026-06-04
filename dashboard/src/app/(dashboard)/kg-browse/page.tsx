"use client";
import { useState, useEffect, useCallback } from "react";
import { FilterSidebar } from "@/components/kg/FilterSidebar";
import { Breadcrumb } from "@/components/kg/Breadcrumb";
import { ViewToggle } from "@/components/kg/ViewToggle";
import { BrowseListView } from "@/components/kg/BrowseListView";
import { BrowseGraphView } from "@/components/kg/BrowseGraphView";
import { ChunkDetailPanel } from "@/components/kg/ChunkDetailPanel";
import { RefreshButton } from "@/components/kg/RefreshButton";
import type { BrowseResponse, BrowseItem, GraphNode } from "@/lib/kg-types";

export interface FilterState {
  bo_sach: string | null;
  subject: string | null;
  grade: string | null;
  lesson_no: string | null;
  concept_id: string | null;
  work: string | null;
  content_class: string | null;
  status: "prod" | "all" | "demoted";
}

const EMPTY: FilterState = {
  bo_sach: null, subject: null, grade: null, lesson_no: null,
  concept_id: null, work: null, content_class: null, status: "prod",
};

function parseHref(href: string, status: FilterState["status"]): FilterState {
  const q = new URLSearchParams(href.split("?")[1] ?? "");
  return {
    ...EMPTY, status,
    bo_sach: q.get("bo_sach"), subject: q.get("subject"), grade: q.get("grade"),
    lesson_no: q.get("lesson_no"), concept_id: q.get("concept_id"), work: q.get("work"),
  };
}

export default function BrowsePage() {
  const [filter, setFilter] = useState<FilterState>(EMPTY);
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
      setError("Neo4j không khả dụng"); setData(null);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const drillInto = (item: BrowseItem) => {
    if (item.meta?.is_chunk) { setSelectedChunkUid(item.id); return; }
    setFilter((f) => {
      switch (item.kind) {
        case "L0_book": return { ...f, bo_sach: item.id };
        case "L1_subject": return { ...f, subject: item.id };
        case "L2_grade": return { ...f, grade: item.id };
        case "L3_lesson": return { ...f, lesson_no: item.id };
        case "L4_concept": return { ...f, concept_id: item.id };
        case "L4a_work": return { ...f, work: item.id };
        default: return f;
      }
    });
  };

  const drillIntoGraphNode = (node: GraphNode) => {
    if (!data) return;
    const itemId = String(node.id).split("/").pop();
    const item = data.items.find((i) => i.id === itemId);
    if (item) drillInto(item);
  };

  const jumpToCrumb = (idx: number) => {
    const href = data?.breadcrumb?.[idx]?.href;
    if (href) setFilter((f) => parseHref(href, f.status));
  };

  return (
    <div className="flex h-full min-h-[70vh]">
      <FilterSidebar filter={filter} onChange={setFilter} />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
          <Breadcrumb crumbs={data?.breadcrumb ?? []} onJump={jumpToCrumb} />
          <div className="flex gap-2 items-center">
            <ViewToggle value={view} onChange={setView} />
            <RefreshButton onClick={fetchData} lastFetchedAt={data?.cachedAt} loading={loading} />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 text-danger px-4 py-3 text-sm">{error}</div>
          ) : loading && !data ? (
            <div className="text-muted">Đang tải...</div>
          ) : (data?.items ?? []).length === 0 ? (
            <div className="text-muted">Không có dữ liệu trong scope này</div>
          ) : view === "list" ? (
            <BrowseListView items={data!.items} level={data!.level} onClick={drillInto} />
          ) : (
            <BrowseGraphView graph={data!.graph} onNodeClick={drillIntoGraphNode} />
          )}
        </div>
      </main>
      {selectedChunkUid && (
        <ChunkDetailPanel uid={selectedChunkUid} onClose={() => setSelectedChunkUid(null)} />
      )}
    </div>
  );
}
