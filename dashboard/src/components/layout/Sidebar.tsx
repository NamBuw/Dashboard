"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Monitor,
  BarChart3,
  Bell,
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
        "hidden lg:flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={clsx(
          "flex items-center h-16 px-4 border-b border-white/10",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">CTS Dashboard</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-hover transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                isActive
                  ? "bg-sidebar-active text-white font-medium"
                  : "hover:bg-sidebar-hover text-sidebar-text"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/ptit-logo.png" alt="PTIT" className="h-6 w-auto" />
            <img src="/cts-logo.png" alt="CTS Lab" className="h-6 w-auto" />
          </div>
        )}
      </div>
    </aside>
  );
}
