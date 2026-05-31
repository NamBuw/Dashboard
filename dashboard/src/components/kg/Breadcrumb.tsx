"use client";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbCrumb } from "@/lib/kg-types";

interface Props {
  crumbs: BreadcrumbCrumb[];
  onJump: (idx: number) => void;
}

export function Breadcrumb({ crumbs, onJump }: Props) {
  if (crumbs.length === 0) return <div className="text-sm text-muted">Kho tri thức</div>;
  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 flex-wrap">
      {crumbs.map((c, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={c.href} className="flex items-center gap-1 min-w-0">
            {idx > 0 && <ChevronRight size={14} className="text-muted shrink-0" />}
            <button
              onClick={() => onJump(idx)}
              disabled={isLast}
              className={isLast
                ? "font-semibold text-foreground truncate"
                : "text-muted hover:text-accent transition-colors truncate"}
            >
              {c.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
