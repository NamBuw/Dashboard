"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import { NAV, NAV_GROUPS, ADMIN_ONLY_HREFS, type NavItem } from "./NAV";
import { Dropdown } from "@/components/ui/Dropdown";

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

  // Sliding active indicator
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [ind, setInd] = useState<{ top: number; height: number; show: boolean }>({ top: 0, height: 0, show: false });
  useEffect(() => {
    const activeItem = NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
    const el = activeItem ? linkRefs.current.get(activeItem.href) : undefined;
    if (el) setInd({ top: el.offsetTop, height: el.offsetHeight, show: true });
    else setInd((s) => ({ ...s, show: false }));
  }, [pathname, isSuperUser]);

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
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "2px 6px 16px", color: "var(--ink)", textDecoration: "none" }}
        onClick={onNavigate}
      >
        <Image
          src="/cts-logo.png"
          alt="CTS Lab — Creative Technologies & Simulation Lab"
          width={150}
          height={131}
          priority
        />
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, paddingLeft: 2 }}>
          Bảng điều khiển
        </span>
      </Link>

      {/* Grouped nav */}
      <div ref={navRef} style={{ position: "relative" }}>
        {/* sliding active indicator */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ind.top,
            height: ind.height,
            borderRadius: 13,
            background: "var(--accent-muted)",
            opacity: ind.show ? 1 : 0,
            transition: "top .25s var(--ease-out-smooth), height .25s var(--ease-out-smooth), opacity .2s",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
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
                  ref={(el) => { if (el) linkRefs.current.set(item.href, el); }}
                  onClick={onNavigate}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 13px",
                    borderRadius: 13,
                    fontSize: 13.5,
                    fontWeight: on ? 600 : 500,
                    color: on ? "var(--blue)" : "var(--ink-2)",
                    background: "transparent",
                    textDecoration: "none",
                    transition: "color .15s",
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
                        background: on ? "var(--accent-muted)" : "var(--outer)",
                        color: on ? "var(--blue)" : "var(--muted)",
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
      </div>

      <div style={{ flex: 1 }} />

      {/* User card footer + account menu (opens upward) */}
      <Dropdown
        direction="up"
        fullWidth
        menuStyle={{ borderRadius: 14, padding: 6, border: "1px solid var(--line)" }}
        trigger={(open) => (
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 15, background: "var(--inner)", boxShadow: "var(--shadow-sm)", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 11, flex: "none", background: "var(--chip)", color: "var(--chip-fg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{userRole}</div>
            </div>
            <ChevronDown size={15} style={{ marginLeft: "auto", color: "var(--muted)", transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }} />
          </button>
        )}
      >
        {(close) => (
          <div role="menu">
            <div style={{ padding: "8px 11px 10px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
              {userEmail && (
                <div style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{userEmail}</div>
              )}
              <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".03em", color: "var(--chip-fg)", background: "var(--chip)", padding: "1px 8px", borderRadius: 20, marginTop: 6 }}>{userRole}</span>
            </div>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => { close(); onNavigate?.(); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, color: "var(--ink-2)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
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
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: "transparent", color: "var(--red)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--outer)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <LogOut size={15} strokeWidth={1.8} />
              Đăng xuất
            </button>
          </div>
        )}
      </Dropdown>
    </aside>
  );
}
