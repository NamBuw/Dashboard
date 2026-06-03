"use client";

import { Search, Bell, Plus, Sun, Moon, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "../ThemeProvider";

export default function BentoToolbar() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          height: 42,
          padding: "0 16px",
          borderRadius: 24,
          background: "var(--inner)",
          color: "var(--muted)",
          fontSize: 13,
          width: 230,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Search size={16} strokeWidth={1.8} />
        <span>Tìm kiếm…</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        type="button"
        aria-label="Chuyển giao diện"
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "var(--inner)",
          boxShadow: "var(--shadow-sm)",
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
        }}
      >
        {theme === "dark" ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
      </button>

      {/* Bell */}
      <button
        type="button"
        aria-label="Thông báo"
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "var(--inner)",
          boxShadow: "var(--shadow-sm)",
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Bell size={17} strokeWidth={1.8} />
        <span
          style={{
            position: "absolute",
            top: 9,
            right: 10,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--red)",
          }}
        />
      </button>

      {/* User menu trigger (also serves as the Tạo mới slot — kept simple) */}
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 42,
            padding: "0 20px",
            borderRadius: 24,
            background: "var(--chip)",
            color: "var(--chip-fg)",
            fontSize: 13.5,
            fontWeight: 600,
            border: "none",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
          }}
        >
          <Plus size={16} strokeWidth={2} />
          Tạo mới
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 6,
              minWidth: 180,
              background: "var(--inner)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 6,
              boxShadow: "var(--shadow)",
              zIndex: 50,
            }}
          >
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 12px",
                background: "transparent",
                color: "var(--red)",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogOut size={15} strokeWidth={1.8} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
