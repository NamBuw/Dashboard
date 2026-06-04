"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { NAV, NAV_GROUPS, ADMIN_ONLY_HREFS, type NavItem } from "./NAV";
import CTSMark from "./CTSMark";

interface Props {
  onNavigate?: () => void;
}

export default function BentoSidebar({ onNavigate }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperUser = !!session?.user?.is_superuser;

  const itemsByGroup = (groupId: string) =>
    NAV.filter((n) => n.group === groupId).filter(
      (n) => !(ADMIN_ONLY_HREFS.includes(n.href) && !isSuperUser),
    );

  const isActive = (item: NavItem) =>
    pathname === item.href || pathname.startsWith(item.href + "/");

  const userName = session?.user?.name || "Tài khoản";
  const userEmail = session?.user?.email || "";
  const userRole = isSuperUser ? "Super Admin" : (session?.user?.role || "Viewer");
  const initials = userName.split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <aside
      style={{
        width: 250,
        flex: "none",
        padding: "22px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "var(--page)",
        minHeight: "100vh",
      }}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 18px", color: "var(--ink)", textDecoration: "none" }}
        onClick={onNavigate}
      >
        <CTSMark size={32} radius={9} />
        <div>
          <b style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-.02em", display: "block" }}>CTS Lab</b>
          <span style={{ display: "block", fontSize: 11, color: "var(--muted)", fontWeight: 500, marginTop: 1 }}>
            Bảng điều khiển
          </span>
        </div>
      </Link>

      {/* Grouped nav */}
      {NAV_GROUPS.map((g) => {
        const items = itemsByGroup(g.id);
        if (items.length === 0) return null;
        return (
          <div key={g.id}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--faint)",
                padding: "0 12px",
                margin: "16px 0 6px",
              }}
            >
              {g.label}
            </div>
            {items.map((item) => {
              const IconCmp = item.icon;
              const on = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 13px",
                    borderRadius: 13,
                    fontSize: 13.5,
                    fontWeight: on ? 600 : 500,
                    color: on ? "var(--chip-fg)" : "var(--ink-2)",
                    background: on ? "var(--chip)" : "transparent",
                    boxShadow: on ? "var(--shadow-sm)" : "none",
                    textDecoration: "none",
                    transition: ".13s",
                  }}
                  onMouseEnter={(e) => {
                    if (!on) (e.currentTarget as HTMLAnchorElement).style.background = "var(--outer)";
                  }}
                  onMouseLeave={(e) => {
                    if (!on) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }}
                >
                  <IconCmp size={17} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 20,
                        background: on ? "rgba(255,255,255,.18)" : "var(--outer)",
                        color: on ? "var(--chip-fg)" : "var(--muted)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* User card footer + account menu */}
      <div ref={menuRef} style={{ position: "relative" }}>
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "calc(100% + 8px)",
              background: "var(--inner)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 6,
              boxShadow: "var(--shadow)",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 11px 10px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>
              {userEmail && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 1,
                  }}
                >
                  {userEmail}
                </div>
              )}
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: ".03em",
                  color: "var(--chip-fg)",
                  background: "var(--chip)",
                  padding: "1px 8px",
                  borderRadius: 20,
                  marginTop: 6,
                }}
              >
                {userRole}
              </span>
            </div>

            <Link
              href="/settings"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 12px",
                borderRadius: 10,
                color: "var(--ink-2)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--outer)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
            >
              <Settings size={15} strokeWidth={1.8} />
              Cài đặt tài khoản
            </Link>

            <button
              type="button"
              role="menuitem"
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
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--outer)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <LogOut size={15} strokeWidth={1.8} />
              Đăng xuất
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: 11,
            borderRadius: 15,
            background: "var(--inner)",
            boxShadow: "var(--shadow-sm)",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              flex: "none",
              background: "var(--chip)",
              color: "var(--chip-fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{userRole}</div>
          </div>
          <ChevronDown
            size={15}
            style={{
              marginLeft: "auto",
              color: "var(--muted)",
              transition: "transform .15s",
              transform: menuOpen ? "rotate(180deg)" : "none",
            }}
          />
        </button>
      </div>
    </aside>
  );
}
