"use client";

import type { ReactNode } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import BentoOuter from "./BentoOuter";

export interface DetailItem {
  l: ReactNode;
  v: ReactNode;
}

interface Props {
  id: string;
  title: ReactNode;
  sub?: ReactNode;
  expandedId?: string | null;
  onToggle?: (id: string) => void;
  detail?: DetailItem[];
  innerClassName?: string;
  children: (expanded: boolean) => ReactNode;
}

export default function BentoModule({
  id,
  title,
  sub,
  expandedId,
  onToggle,
  detail,
  innerClassName,
  children,
}: Props) {
  const exp = expandedId === id;
  return (
    <div className={"bento-mod" + (exp ? " exp" : "")}>
      <BentoOuter
        title={title}
        sub={sub}
        right={
          onToggle && (
            <span
              className="bento-exptag"
              onClick={(e) => { e.stopPropagation(); onToggle(id); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); } }}
            >
              {exp ? <ChevronDown size={13} /> : <ArrowUpRight size={13} />}
              {exp ? "Thu nhỏ" : "Mở rộng"}
            </span>
          )
        }
      >
        <div className={"bento-inner " + (innerClassName ?? "")}>
          {children(exp)}
          {exp && detail && (
            <div className="bento-mod-detail">
              {detail.map((d, i) => (
                <div key={i}>
                  <div className="l">{d.l}</div>
                  <div className="v">{d.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BentoOuter>
    </div>
  );
}
