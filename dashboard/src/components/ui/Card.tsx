import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** Right-aligned header slot (actions, badges). */
  right?: ReactNode;
  /** Adds the synchronized hover lift + zoom + press feedback for clickable cards. */
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * The one card surface for the whole dashboard. Replaces the ~16 hand-rolled
 * `bg-card border border-border rounded-2xl p-5` copies. Single radius (var(--r-lg)),
 * consistent padding, optional icon+title header, optional interactive motion.
 */
export function Card({
  title,
  subtitle,
  icon: Icon,
  right,
  interactive,
  onClick,
  className,
  bodyClassName,
  style,
  children,
}: CardProps) {
  const hasHeader = title != null || right != null || Icon != null;
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-card border border-border text-foreground p-5 shadow-[var(--shadow-sm)]",
        interactive && "card-interactive",
        className,
      )}
      style={{ borderRadius: "var(--r-lg)", ...style }}
    >
      {hasHeader && (
        <div className="flex items-center gap-3 mb-4">
          {Icon && (
            <span
              className="flex items-center justify-center shrink-0 bg-surface text-muted"
              style={{ width: 34, height: 34, borderRadius: "var(--r-sm)" }}
            >
              <Icon size={17} strokeWidth={1.8} />
            </span>
          )}
          {(title != null || subtitle != null) && (
            <div className="min-w-0">
              {title != null && (
                <div className="font-bold text-foreground truncate" style={{ fontSize: "var(--t-title)" }}>
                  {title}
                </div>
              )}
              {subtitle != null && (
                <div className="text-muted truncate" style={{ fontSize: "var(--t-label)", marginTop: 1 }}>
                  {subtitle}
                </div>
              )}
            </div>
          )}
          {right != null && <div className="ml-auto flex items-center gap-2">{right}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
