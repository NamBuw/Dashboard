import type { CSSProperties, ReactNode } from "react";
import { Children, isValidElement } from "react";
import { clsx } from "clsx";

interface CardGridProps {
  children: ReactNode;
  /** Min column width (px). Grid auto-fits as many columns as fit → responsive on every screen. */
  min?: number;
  gap?: number;
  /** Staggered entrance animation for the children. */
  stagger?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Responsive card grid. Uses `repeat(auto-fit, minmax(min, 1fr))` so it adapts to any
 * width WITHOUT hardcoded breakpoints — replacing fixed inline `gridTemplateColumns`.
 * Optional synchronized stagger entrance.
 */
export function CardGrid({ children, min = 240, gap = 18, stagger = false, className, style }: CardGridProps) {
  return (
    <div
      className={clsx(stagger && "stagger", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
        gap,
        ...style,
      }}
    >
      {stagger
        ? Children.map(children, (child, i) =>
            isValidElement(child) ? (
              <div style={{ ["--i" as string]: i } as CSSProperties}>{child}</div>
            ) : (
              child
            ),
          )
        : children}
    </div>
  );
}
