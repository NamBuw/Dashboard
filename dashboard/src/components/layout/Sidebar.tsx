"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Monitor,
  Settings,
  MessageSquare,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quản lý User", href: "/users", icon: Users },
  { label: "Lịch sử Chat", href: "/chats", icon: MessageSquare },
  { label: "Thiết bị PTalk", href: "/devices", icon: Monitor },
  { label: "Phân tích KG", href: "/kg-analytics", icon: BarChart3 },
  { label: "Kho tri thức", href: "/kg-browse", icon: BookOpen },
  { label: "Cài đặt", href: "/settings", icon: Settings },
];

const ADMIN_ONLY_HREFS = ["/users", "/settings", "/kg-analytics", "/kg-browse"];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const isSuperUser = session?.user?.is_superuser;

  const filteredItems = navItems.filter((item) => {
    if (ADMIN_ONLY_HREFS.includes(item.href) && !isSuperUser) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={clsx(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-border transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Header — Logo */}
      <div className={clsx(
        "flex items-center h-[52px] shrink-0",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <a href="https://ptit.edu.vn/" target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src="/ptit-logo.png" alt="PTIT" className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
            <div className="w-px h-4 bg-border" />
            <a href="https://ctslab.net/" target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src="/cts-logo.png" alt="CTS Lab" className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
          </div>
        ) : (
          <a href="https://ctslab.net/" target="_blank" rel="noopener noreferrer">
            <img src="/cts-logo.png" alt="CTS" className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity" />
          </a>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className="shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors w-full",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
