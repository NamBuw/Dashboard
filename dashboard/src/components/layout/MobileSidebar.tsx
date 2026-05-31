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
  BarChart3,
  BookOpen,
} from "lucide-react";
import { clsx } from "clsx";
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
    if (ADMIN_ONLY_HREFS.includes(item.href) && !isSuperUser) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <aside className="fixed inset-y-0 left-0 w-[260px] bg-background border-r border-border flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between h-[52px] px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <a href="https://ptit.edu.vn/" target="_blank" rel="noopener noreferrer">
              <img src="/ptit-logo.png" alt="PTIT" className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
            <div className="w-px h-4 bg-border" />
            <a href="https://ctslab.net/" target="_blank" rel="noopener noreferrer">
              <img src="/cts-logo.png" alt="CTS Lab" className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                )}
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
