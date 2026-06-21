import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Accessible label (also the tooltip). */
  label: string;
  size?: number;
  active?: boolean;
}

/** The repeated 34–42px icon button, consolidated. */
export function IconButton({ icon: Icon, label, size = 38, active, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx("flex items-center justify-center shrink-0 border transition-colors", className)}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--r-sm)",
        background: active ? "var(--chip)" : "var(--btn)",
        color: active ? "var(--chip-fg)" : "var(--ink-2)",
        borderColor: "var(--btn-line)",
        cursor: "pointer",
      }}
      {...rest}
    >
      <Icon size={Math.round(size * 0.46)} strokeWidth={1.8} />
    </button>
  );
}
