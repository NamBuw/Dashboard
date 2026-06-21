"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Menu } from "lucide-react";
import BentoSidebar from "./BentoSidebar";
import BentoToolbar from "./BentoToolbar";

interface Props {
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
}

export default function BentoShell({ title, sub, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: "var(--page)", color: "var(--ink)" }}>
      {/* Desktop sidebar */}
      <div className="bento-side-desktop" style={{ position: "sticky", top: 0, alignSelf: "flex-start", height: "100vh", overflowY: "auto" }}>
        <BentoSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50 }}
          />
          <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 51, boxShadow: "0 0 40px rgba(0,0,0,.4)" }}>
            <BentoSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <main className="bento-main-head" style={{ flex: 1, minWidth: 0, padding: "22px 26px 34px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setMobileOpen(true)}
              className="bento-mobile-menu"
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--inner)",
                color: "var(--ink-2)",
                border: "1px solid var(--btn-line)",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Menu size={18} strokeWidth={1.8} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-.025em",
                  lineHeight: 1.15,
                  color: "var(--ink)",
                }}
              >
                {title}
              </h1>
              {sub && <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 5 }}>{sub}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
            <BentoToolbar />
          </div>
        </div>

        <style>{`
          @media (max-width: 1023px) {
            .bento-side-desktop { display: none !important; }
            .bento-mobile-menu { display: flex !important; }
            .bento-dome-label { display: none !important; }
          }
          /* Phones: the fixed-width search would push the title + hamburger off-screen. */
          @media (max-width: 767px) {
            .bento-search-wrap { display: none !important; }
          }
          @media (max-width: 599px) {
            .bento-main-head { padding: 16px 16px 24px !important; }
            .bento-main-head h1 { font-size: 21px !important; }
          }
        `}</style>

        {children}
      </main>
    </div>
  );
}
