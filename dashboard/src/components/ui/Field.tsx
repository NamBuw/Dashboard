import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

const BASE =
  "bg-surface border border-border text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted";
const SIZING = { height: 38, borderRadius: "var(--r-sm)", fontSize: "var(--t-body)" } as const;

/** Consistent text input — replaces ad-hoc input styling across filters/forms. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(BASE, className)} style={{ ...SIZING, padding: "0 12px" }} {...rest} />;
}

/** Consistent select — matches Input. */
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(BASE, "cursor-pointer", className)} style={{ ...SIZING, padding: "0 10px" }} {...rest}>
      {children}
    </select>
  );
}
