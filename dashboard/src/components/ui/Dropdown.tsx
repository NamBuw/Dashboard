"use client";

import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from "react";

interface DropdownProps {
  /** Trigger node, or a render fn receiving the current `open` state (for chevrons etc.). */
  trigger: ReactNode | ((open: boolean) => ReactNode);
  /** Menu content, or a render fn receiving a `close` callback. */
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  width?: number;
  menuStyle?: CSSProperties;
  /** Open downward (default) or upward (e.g. a sidebar footer menu). */
  direction?: "down" | "up";
  /** Stretch the menu to the trigger's width (left:0;right:0) instead of a fixed width. */
  fullWidth?: boolean;
  /** Wrapper className (e.g. to hide the trigger label on small screens). */
  className?: string;
}

/**
 * One dropdown menu primitive (click-outside + scale-in), replacing the ~5 copied
 * absolute-positioned menus across the toolbar / sidebar / product switcher.
 */
export function Dropdown({ trigger, children, align = "right", width = 300, menuStyle, direction = "down", fullWidth = false, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={className} style={{ position: "relative" }}>
      <div onClick={() => setOpen((o) => !o)}>{typeof trigger === "function" ? trigger(open) : trigger}</div>
      {open && (
        <div
          className="anim-scale-in"
          style={{
            position: "absolute",
            ...(direction === "up" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }),
            ...(fullWidth ? { left: 0, right: 0 } : align === "right" ? { right: 0 } : { left: 0 }),
            ...(fullWidth ? {} : { width }),
            background: "var(--inner)",
            border: "1px solid var(--btn-line)",
            borderRadius: "var(--r-md)",
            padding: 7,
            boxShadow: "var(--shadow)",
            zIndex: 50,
            maxHeight: 360,
            overflowY: "auto",
            ...menuStyle,
          }}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
