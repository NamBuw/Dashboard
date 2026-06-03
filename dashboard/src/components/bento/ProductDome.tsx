"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Grid3x3, Bot, BookOpen, Heart, type LucideIcon } from "lucide-react";
import { useProduct, type ProductKey } from "../ProductProvider";

interface Product {
  k: ProductKey;
  label: string;
  icon: LucideIcon;
  c: string;
}

const PRODUCTS: Product[] = [
  { k: "all", label: "Toàn hệ sinh thái", icon: Grid3x3, c: "var(--ink)" },
  { k: "ptalk", label: "PTalk Assistant", icon: Bot, c: "var(--blue)" },
  { k: "kid", label: "Kid Mentor", icon: BookOpen, c: "var(--amber)" },
  { k: "elder", label: "Elder Kare", icon: Heart, c: "var(--green)" },
];

export default function ProductDome() {
  const { active, setActive } = useProduct();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const cur = PRODUCTS.find((p) => p.k === active) ?? PRODUCTS[0];
  const CurIcon = cur.icon;

  return (
    <div ref={ref} style={{ position: "relative", width: 480, height: 128, display: "flex", justifyContent: "center" }}>
      {/* Dotted radial gradient dome */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          width: 480,
          height: 170,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--blue) 50%, transparent) 1.15px, transparent 1.4px)",
          backgroundSize: "13px 13px",
          WebkitMaskImage:
            "radial-gradient(50% 118% at 50% -4%, #000 0%, rgba(0,0,0,.4) 40%, transparent 68%)",
          maskImage:
            "radial-gradient(50% 118% at 50% -4%, #000 0%, rgba(0,0,0,.4) 40%, transparent 68%)",
        }}
      />
      {/* Soft glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: -20,
          transform: "translateX(-50%)",
          width: 380,
          height: 150,
          pointerEvents: "none",
          background:
            "radial-gradient(46% 80% at 50% 0%, color-mix(in srgb, var(--blue) 16%, transparent), transparent 64%)",
        }}
      />

      <button
        onClick={() => setOpen((o) => !o)}
        type="button"
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: 34,
          height: 50,
          display: "inline-flex",
          alignItems: "center",
          gap: 11,
          padding: "0 18px 0 7px",
          borderRadius: 26,
          background: "var(--inner)",
          border: "1px solid var(--btn-line)",
          boxShadow:
            "0 2px 4px rgba(20,22,28,.05), 0 16px 36px -14px color-mix(in srgb, var(--blue) 30%, transparent)",
          cursor: "pointer",
          color: "var(--ink)",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `color-mix(in srgb, ${cur.c} 16%, var(--inner))`,
            color: cur.c,
          }}
        >
          <CurIcon size={18} strokeWidth={1.8} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>{cur.label}</span>
        <ChevronDown size={16} style={{ color: "var(--muted)" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 6,
            top: 92,
            left: "50%",
            transform: "translateX(-50%)",
            width: 268,
            background: "var(--inner)",
            border: "1px solid var(--btn-line)",
            borderRadius: 18,
            padding: 7,
            boxShadow: "0 2px 6px rgba(20,22,28,.08), 0 20px 50px -16px rgba(20,22,28,.4)",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--faint)",
              padding: "8px 12px 6px",
            }}
          >
            Chuyển sản phẩm
          </div>
          {PRODUCTS.map((p) => {
            const ItemIcon = p.icon;
            return (
              <div
                key={p.k}
                onClick={() => { setActive(p.k); setOpen(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { setActive(p.k); setOpen(false); } }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "9px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink-2)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--inner-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `color-mix(in srgb, ${p.c} 16%, var(--inner))`,
                    color: p.c,
                  }}
                >
                  <ItemIcon size={15} strokeWidth={1.8} />
                </span>
                <span>{p.label}</span>
                {p.k === active && (
                  <span style={{ marginLeft: "auto", color: "var(--blue)" }}>
                    <Check size={16} strokeWidth={2} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
