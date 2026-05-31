"use client";
import { List, Share2 } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  value: "list" | "graph";
  onChange: (v: "list" | "graph") => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden text-[13px]">
      <button
        onClick={() => onChange("list")}
        className={clsx("flex items-center gap-1.5 px-3 py-1.5 transition-colors",
          value === "list" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-surface/50")}
      >
        <List size={14} /> Danh sách
      </button>
      <button
        onClick={() => onChange("graph")}
        className={clsx("flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-border",
          value === "graph" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-surface/50")}
      >
        <Share2 size={14} /> Đồ thị
      </button>
    </div>
  );
}
