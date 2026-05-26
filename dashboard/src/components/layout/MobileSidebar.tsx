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
  X,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quản lý User", href: "/users", icon: Users },
  { label: "Thiết bị", href: "/devices", icon: Monitor },
  { label: "Phân tích", href: "/analytics", icon: BarChart3 },
  { label: "Cảnh báo", href: "/alerts", icon: Bell },
  { label: "Cài đặt", href: "/settings", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar-bg text-sidebar-text flex flex-col">
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <span className="text-lg font-bold tracking-tight">
            CTS Dashboard
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-sidebar-hover transition-colors"
          >
            <X size={18} />
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
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                  isActive
                    ? "bg-sidebar-active text-white font-medium"
                    : "hover:bg-sidebar-hover text-sidebar-text"
                )}
              >
                <Icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-sidebar-text/60">YIRLODT Lab - PTIT</p>
        </div>
      </aside>
    </div>
  );
}
