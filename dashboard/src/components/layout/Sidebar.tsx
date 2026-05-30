"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Monitor,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quản lý User", href: "/users", icon: Users },
  { label: "Lịch sử Chat", href: "/chats", icon: MessageSquare },
  { label: "Thiết bị PTalk", href: "/devices", icon: Monitor },
  { label: "Cài đặt & Monitor", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const isSuperUser = session?.user?.is_superuser;

  const filteredItems = navItems.filter((item) => {
    if ((item.href === "/users" || item.href === "/settings") && !isSuperUser) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={clsx(
        "hidden lg:flex flex-col border-r border-white/5 transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
      style={{ background: "rgba(8, 12, 22, 0.95)" }}
    >
      {/* Logo Header */}
      <div
        className={clsx(
          "flex flex-col border-b border-white/5",
          collapsed ? "items-center py-3 px-2" : "px-4 pt-4 pb-3"
        )}
      >
        {!collapsed ? (
          <div className="w-full space-y-3">
            <a href="https://ptit.edu.vn/" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <img src="/ptit-logo.png" alt="PTIT" className="h-12 w-auto" />
            </a>
            <a href="https://ctslab.net/" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <img src="/cts-logo.png" alt="CTS Lab" className="h-10 w-auto" />
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <a href="https://ptit.edu.vn/" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <img src="/ptit-logo.png" alt="PTIT" className="h-8 w-auto mx-auto" />
            </a>
            <a href="https://ctslab.net/" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
              <img src="/cts-logo.png" alt="CTS" className="h-7 w-auto mx-auto" />
            </a>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 hover:scale-105"
        >
          {collapsed ? (
            <ChevronRight size={18} className="text-muted" />
          ) : (
            <ChevronLeft size={18} className="text-muted" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-3">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm opacity-0 animate-fade-in-left",
                isActive
                  ? "bg-gradient-primary text-white font-semibold shadow-lg glow-indigo"
                  : "text-sidebar-text hover:bg-white/5 hover:text-foreground hover:translate-x-1"
              )}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={20}
                className={clsx(
                  "shrink-0 transition-transform duration-200",
                  isActive ? "text-white" : "text-muted group-hover:text-foreground",
                  !collapsed && "group-hover:scale-110"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-dot-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        {!collapsed && (
          <p className="text-[10px] text-white/20 text-center">Powered by CTS Lab</p>
        )}
      </div>
    </aside>
  );
}
