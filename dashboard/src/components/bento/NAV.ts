import {
  LayoutDashboard,
  Users,
  Monitor,
  Settings,
  MessageSquare,
  BarChart3,
  BookOpen,
  ScrollText,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavGroupId = "main" | "kg" | "sys";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroupId;
  badge?: string;
}

export interface NavGroup {
  id: NavGroupId;
  label: string;
}

export const NAV: NavItem[] = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Tài khoản", href: "/account", icon: User, group: "main" },
  { label: "Quản lý User", href: "/users", icon: Users, group: "main" },
  { label: "Lịch sử Chat", href: "/chats", icon: MessageSquare, group: "main" },
  { label: "Thiết bị PTalk", href: "/devices", icon: Monitor, group: "main" },
  { label: "Phân tích KG", href: "/kg-analytics", icon: BarChart3, group: "kg" },
  { label: "Kho tri thức", href: "/kg-browse", icon: BookOpen, group: "kg" },
  { label: "Nhật ký hệ thống", href: "/logs", icon: ScrollText, group: "sys" },
  { label: "Cài đặt", href: "/settings", icon: Settings, group: "sys" },
];

export const NAV_GROUPS: NavGroup[] = [
  { id: "main", label: "Quản lý" },
  { id: "kg", label: "Tri thức" },
  { id: "sys", label: "Hệ thống" },
];

// Admin (SuperAdmin)-only nav entries — hidden from the User View. Normal accounts
// (parents) only see "Tài khoản" (/account) + "Lịch sử Chat" (/chats).
export const ADMIN_ONLY_HREFS = [
  "/dashboard",
  "/users",
  "/settings",
  "/devices",
  "/kg-analytics",
  "/kg-browse",
  "/logs",
];
