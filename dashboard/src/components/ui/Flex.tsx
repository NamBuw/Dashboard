import type { CSSProperties, ReactNode } from "react";

type Justify = "start" | "center" | "end" | "between" | "around";
type Align = "start" | "center" | "end" | "stretch" | "baseline";

const J: Record<Justify, string> = {
  start: "flex-start", center: "center", end: "flex-end", between: "space-between", around: "space-around",
};
const A: Record<Align, string> = {
  start: "flex-start", center: "center", end: "flex-end", stretch: "stretch", baseline: "baseline",
};

interface FlexProps {
  children: ReactNode;
  gap?: number;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Horizontal flex row — replaces the repeated inline `display:flex; align-items:center; gap`. */
export function Row({ children, gap = 12, align = "center", justify = "start", wrap = false, className, style }: FlexProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "row", gap, alignItems: A[align], justifyContent: J[justify], flexWrap: wrap ? "wrap" : "nowrap", ...style }}
    >
      {children}
    </div>
  );
}

/** Vertical flex column. */
export function Col({ children, gap = 12, align = "stretch", justify = "start", className, style }: Omit<FlexProps, "wrap">) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap, alignItems: A[align], justifyContent: J[justify], ...style }}
    >
      {children}
    </div>
  );
}
