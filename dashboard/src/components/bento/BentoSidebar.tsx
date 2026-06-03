"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
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
  const userRole = isSuperUser ? "Super Admin" : (session?.user?.role || "Viewer");
  const initials = userName.split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

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

      {/* User card footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: 11,
          borderRadius: 15,
          background: "var(--inner)",
          boxShadow: "var(--shadow-sm)",
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
        <ChevronDown size={15} style={{ marginLeft: "auto", color: "var(--muted)" }} />
      </div>
    </aside>
  );
}
