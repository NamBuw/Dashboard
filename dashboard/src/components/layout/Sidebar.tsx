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
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quản lý User", href: "/users", icon: Users },
  { label: "Thiết bị", href: "/devices", icon: Monitor },
  { label: "Phân tích", href: "/analytics", icon: BarChart3 },
  { label: "Cảnh báo", href: "/alerts", icon: Bell },
  { label: "Cài đặt", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
        {navItems.map((item) => {
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
          <p className="text-xs text-sidebar-text/60">YIRLODT Lab - PTIT</p>
        )}
      </div>
    </aside>
  );
}
