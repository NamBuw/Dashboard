import type { BrowseItem, BrowseLevel } from "@/lib/kg-types";

const LEVEL_TITLES: Record<BrowseLevel, string> = {
  L0_book: "Bộ sách", L1_subject: "Môn", L2_grade: "Lớp", L3_lesson: "Bài", L4_chunk: "Chunk",
};

interface Props {
  items: BrowseItem[];
  level: BrowseLevel;
  onClick: (item: BrowseItem) => void;
}

export function BrowseListView({ items, level, onClick }: Props) {
  if (level === "L4_chunk") {
    return (
      <div className="space-y-2">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onClick(it)}
            className="w-full text-left p-4 bg-card border border-border rounded-lg hover:border-accent transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-muted truncate">{it.id.slice(0, 60)}</div>
                <div className="text-base mt-1 font-medium text-foreground">{it.meta?.title ?? it.label}</div>
                <div className="text-xs text-muted mt-1">
                  trang {it.meta?.trang_no ?? "-"} · {it.meta?.source_name ?? "?"}
                </div>
              </div>
              <div className="text-xs text-muted shrink-0">{it.count.toLocaleString()} ký tự</div>
            </div>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onClick(it)}
          className="flex flex-col items-start p-4 bg-card border border-border rounded-lg hover:border-accent transition-colors text-left"
        >
          <div className="text-xs text-muted uppercase tracking-wide">{LEVEL_TITLES[level]}</div>
          <div className="text-lg font-semibold mt-1 text-foreground">{it.label}</div>
          {it.meta?.title && (
            <div className="text-sm text-muted mt-1 line-clamp-2">{it.meta.title}</div>
          )}
          <div className="text-xs text-muted mt-2 flex items-center gap-2">
            <span>{it.count.toLocaleString()} {level === "L3_lesson" ? "chunk" : "mục"}</span>
            {it.meta?.has_vietjack && <span className="text-warning">⭐</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
