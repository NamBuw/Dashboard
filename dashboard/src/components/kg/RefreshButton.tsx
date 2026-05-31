"use client";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  onClick: () => void;
  lastFetchedAt?: string;
  loading?: boolean;
}

function fmtTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function RefreshButton({ onClick, lastFetchedAt, loading }: Props) {
  const t = fmtTime(lastFetchedAt);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[13px] text-muted hover:text-foreground hover:bg-surface/50 transition-colors disabled:opacity-50"
      title={t ? `Cập nhật lúc ${t}` : undefined}
    >
      <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
      <span>Làm mới{t ? ` · ${t}` : ""}</span>
    </button>
  );
}
