"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Monitor,
  Settings,
  X,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";
import { useSession } from "next-auth/react";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quản lý User", href: "/users", icon: Users },
  { label: "Lịch sử Chat", href: "/chats", icon: MessageSquare },
  { label: "Thiết bị PTalk", href: "/devices", icon: Monitor },
  { label: "Cài đặt & Monitor", href: "/settings", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!open) return null;

  const isSuperUser = session?.user?.is_superuser;

  const filteredItems = navItems.filter((item) => {
    if ((item.href === "/users" || item.href === "/settings") && !isSuperUser) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up"
        onClick={onClose}
        style={{ animationDuration: "0.2s" }}
      />

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 w-72 flex flex-col animate-fade-in-left"
        style={{ background: "rgba(8, 12, 22, 0.98)", animationDuration: "0.3s" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg glow-indigo">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-lg font-bold text-gradient-primary">CTS Dashboard</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-all duration-200 hover:scale-105"
          >
            <X size={18} className="text-muted" />
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
                onClick={onClose}
                className={clsx(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm opacity-0 animate-fade-in-left",
                  isActive
                    ? "bg-gradient-primary text-white font-semibold shadow-lg glow-indigo"
                    : "text-sidebar-text hover:bg-white/5 hover:text-foreground hover:translate-x-1"
                )}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <Icon
                  size={20}
                  className={clsx(
                    "shrink-0 transition-transform duration-200",
                    isActive ? "text-white" : "text-muted group-hover:text-foreground",
                    "group-hover:scale-110"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-dot-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-200">
            <img src="/ptit-logo.png" alt="PTIT" className="h-7 w-auto" />
            <div className="w-px h-4 bg-white/10" />
            <img src="/cts-logo.png" alt="CTS Lab" className="h-7 w-auto" />
          </div>
        </div>
      </aside>
    </div>
  );
}
