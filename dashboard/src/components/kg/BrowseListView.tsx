import type { ReactNode } from "react";
import type { BrowseItem, BrowseLevel } from "@/lib/kg-types";

const LEVEL_TITLES: Record<BrowseLevel, string> = {
  L0_book: "Bộ sách", L1_subject: "Môn", L2_grade: "Lớp", L3_lesson: "Bài",
  L4_concept: "Concept", L4a_work: "Tác phẩm", L4b_section: "Section", L5_chunk: "Chunk", L4_chunk: "Chunk",
};
const ICON: Partial<Record<BrowseLevel, string>> = { L4_concept: "🧠", L4a_work: "📖", L3_lesson: "📘" };
const CHUNK_LEVELS = new Set<BrowseLevel>(["L4_chunk", "L5_chunk", "L4b_section"]);

function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "purple" }) {
  const cls = tone === "accent" ? "bg-accent/15 text-accent" : tone === "purple" ? "bg-purple/15 text-purple" : "bg-surface text-muted";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cls}`}>{children}</span>;
}

export function BrowseListView({ items, level, onClick }: { items: BrowseItem[]; level: BrowseLevel; onClick: (i: BrowseItem) => void }) {
  // ── Chunk-style row list ──
  if (CHUNK_LEVELS.has(level)) {
    return (
      <div className="space-y-2">
        {items.map((it) => (
          <button key={it.id} onClick={() => onClick(it)}
            className="w-full text-left p-4 bg-card border border-border rounded-lg hover:border-accent transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-foreground">{it.meta?.title ?? it.label}</div>
                <div className="text-xs text-muted mt-1 flex flex-wrap gap-1.5 items-center">
                  {it.meta?.section_type && <Badge tone="purple">{it.meta.section_type}</Badge>}
                  {it.meta?.variant && <Badge>{it.meta.variant}</Badge>}
                  {it.meta?.trang_no != null && <span>trang {it.meta.trang_no}</span>}
                </div>
              </div>
              <div className="text-xs text-muted shrink-0">{it.count.toLocaleString()} ký tự</div>
            </div>
          </button>
        ))}
      </div>
    );
  }
  // ── Tile grid ──
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <button key={it.id} onClick={() => onClick(it)}
          className="flex flex-col items-start p-4 bg-card border border-border rounded-lg hover:border-accent transition-colors text-left">
          <div className="text-xs text-muted uppercase tracking-wide">{ICON[level] ? `${ICON[level]} ` : ""}{LEVEL_TITLES[level]}</div>
          <div className="text-lg font-semibold mt-1 text-foreground line-clamp-2">{it.label}</div>
          {it.meta?.title && level === "L3_lesson" && <div className="text-sm text-muted mt-1 line-clamp-2">{it.meta.title}</div>}
          {it.meta?.strand && <div className="mt-1"><Badge tone="purple">{it.meta.strand}</Badge></div>}
          {!!it.meta?.reading_texts?.length && (
            <div className="text-xs text-muted mt-1 line-clamp-2">📖 {it.meta.reading_texts.join(", ")}</div>
          )}
          {!!it.meta?.sections?.length && (
            <div className="text-xs text-muted mt-1 flex flex-wrap gap-1">
              {it.meta.sections.slice(0, 4).map((s) => <Badge key={s} tone="purple">{s}</Badge>)}
            </div>
          )}
          <div className="text-xs text-muted mt-2 flex items-center gap-2 flex-wrap">
            <span>{it.count.toLocaleString()} {level === "L3_lesson" || level === "L4_concept" ? "chunk" : "mục"}</span>
            {it.meta?.has_recitation && <Badge tone="purple">📜 đọc thuộc</Badge>}
          </div>
        </button>
      ))}
    </div>
  );
}
