"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Activity,
  UserPlus,
  Zap,
  Crown,
  Shield,
  Sparkles,
  User,
  Monitor,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Stats {
  users: { total: number; active: number; newToday: number; newThisWeek: number };
  tiers: { tier: string; count: number }[];
  requests: { totalToday: number; activeUsersToday: number };
  devices: { total: number; online: number; offline: number; error: number };
  recentUsers: {
    id: string; username: string; email: string;
    subscription_tier: string; is_superuser: boolean; is_active: boolean; created_at: string;
  }[];
}

const tierConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Admin", color: "text-danger bg-danger-muted", icon: Crown },
  ultra: { label: "Ultra", color: "text-purple bg-purple-muted", icon: Sparkles },
  pro: { label: "Pro", color: "text-warning bg-warning-muted", icon: Shield },
  basic: { label: "Basic", color: "text-accent bg-accent-muted", icon: User },
};

const tierBarColors: Record<string, string> = {
  admin: "bg-danger",
  ultra: "bg-purple",
  pro: "bg-warning",
  basic: "bg-accent",
};

const mockAlerts = [
  { id: 1, message: "Robot PTalk-7729 mất kết nối > 15 phút", severity: "high" as const, time: "5 phút trước" },
  { id: 2, message: "Robot PTalk-1823 pin yếu < 10%", severity: "warning" as const, time: "45 phút trước" },
  { id: 3, message: "Auth Service API latency cao (420ms)", severity: "neutral" as const, time: "2 giờ trước" },
];

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Không kết nối được server"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-5 h-5 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card max-w-sm p-8 text-center">
          <AlertTriangle className="mx-auto text-danger mb-3" size={32} strokeWidth={1.5} />
          <p className="text-foreground text-[15px] font-medium">{error || "Lỗi không xác định"}</p>
          <p className="text-muted-foreground text-[13px] mt-1.5 mb-5">
            Vui lòng kiểm tra trạng thái dịch vụ.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-surface hover:bg-surface/80 text-foreground text-[13px] font-medium rounded-md transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const totalTierUsers = stats.tiers.reduce((sum, t) => sum + t.count, 0);
  const isSuperUser = !!session?.user?.is_superuser;

  const chartPoints = [20, 45, 28, 60, 55, 85, 70, 95, 110, 80, 90, 120];
  const maxVal = 130;
  const w = 500;
  const h = 120;
  const path = chartPoints.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (chartPoints.length - 1)) * w} ${h - (v / maxVal) * h}`).join(" ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
            {isSuperUser ? "Tổng quan" : "Không gian của tôi"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {isSuperUser ? "Giám sát hệ sinh thái thiết bị và người dùng." : "Theo dõi robot và lịch sử chat."}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-success font-medium">
          <span className="w-1.5 h-1.5 bg-success rounded-full" />
          Hoạt động
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={isSuperUser ? "Tổng User" : "Thiết bị"}
          value={isSuperUser ? stats.users.total.toLocaleString() : stats.devices.total.toString()}
          change={isSuperUser ? `${stats.users.active} active` : `${stats.devices.online} online`}
          icon={isSuperUser ? Users : Monitor}
          iconColor="text-accent bg-accent-muted"
        />
        <StatCard
          title={isSuperUser ? "Mới hôm nay" : "Online"}
          value={isSuperUser ? stats.users.newToday.toString() : stats.devices.online.toString()}
          change={isSuperUser ? `+${stats.users.newThisWeek} tuần` : "Đang kết nối"}
          changeType={isSuperUser && stats.users.newToday > 0 ? "positive" : "neutral"}
          icon={isSuperUser ? UserPlus : Activity}
          iconColor="text-success bg-success-muted"
        />
        <StatCard
          title={isSuperUser ? "Requests" : "Tương tác"}
          value={stats.requests.totalToday.toLocaleString()}
          change="Thời gian thực"
          icon={isSuperUser ? Activity : Zap}
          iconColor="text-warning bg-warning-muted"
        />
        <StatCard
          title={isSuperUser ? "Active 24h" : "Gia đình"}
          value={isSuperUser ? stats.requests.activeUsersToday.toString() : stats.users.total.toString()}
          change={isSuperUser
            ? `${stats.users.total > 0 ? Math.round((stats.requests.activeUsersToday / stats.users.total) * 100) : 0}%`
            : `${stats.users.active} hoạt động`}
          icon={isSuperUser ? Zap : Users}
          iconColor="text-purple bg-purple-muted"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left — Chart + Tiers */}
        <div className="lg:col-span-2 space-y-3">
          {/* Chart */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-accent" strokeWidth={1.8} />
                  Lưu lượng Tương tác
                </h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">24h gần nhất</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-accent-muted text-accent">
                Live
              </span>
            </div>
            <div className="h-28 w-full">
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#cg)" />
                <path d={path} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1.5">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
            </div>
          </div>

          {/* Tiers */}
          <div className="card p-4">
            <h2 className="text-[14px] font-semibold text-foreground mb-3">Phân bổ Gói dịch vụ</h2>
            <div className="space-y-3">
              {stats.tiers.map((tier) => {
                const config = tierConfig[tier.tier] || tierConfig.basic;
                const pct = totalTierUsers > 0 ? Math.round((tier.count / totalTierUsers) * 100) : 0;
                return (
                  <div key={tier.tier} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-foreground font-medium">{config.label}</span>
                      <span className="text-muted-foreground text-[12px]">{tier.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tierBarColors[tier.tier] || "bg-accent"} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Device + Alerts */}
        <div className="space-y-3">
          {/* Device Status */}
          <div className="card p-4">
            <h2 className="text-[14px] font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Monitor size={14} className="text-accent" strokeWidth={1.8} />
              Thiết bị PTalk
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-success-muted text-center">
                <p className="text-[11px] text-muted-foreground">Online</p>
                <p className="text-[18px] font-semibold text-success">{stats.devices.online}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface text-center">
                <p className="text-[11px] text-muted-foreground">Offline</p>
                <p className="text-[18px] font-semibold text-muted-foreground">{stats.devices.offline}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-danger-muted text-center">
                <p className="text-[11px] text-muted-foreground">Lỗi</p>
                <p className="text-[18px] font-semibold text-danger">{stats.devices.error}</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-danger" strokeWidth={1.8} />
                Cảnh báo
              </h2>
            </div>
            <div className="space-y-2">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="p-2.5 rounded-lg bg-surface/50 hover:bg-surface transition-colors">
                  <p className="text-[12px] text-foreground leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      alert.severity === "high" ? "bg-danger-muted text-danger" : "bg-warning-muted text-warning"
                    }`}>
                      {alert.severity === "high" ? "Cấp bách" : "Cảnh giác"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-foreground">
            {isSuperUser ? "Người dùng gần đây" : "Thành viên"}
          </h2>
          {isSuperUser && (
            <Link href="/users" className="text-[12px] text-accent hover:text-accent-hover font-medium flex items-center gap-0.5">
              Xem tất cả <ArrowRight size={10} />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          {stats.recentUsers.map((user) => {
            const config = tierConfig[user.subscription_tier] || tierConfig.basic;
            return (
              <div key={user.id} className="p-3 rounded-lg bg-surface/30 hover:bg-surface transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-[13px] font-semibold text-foreground">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{user.username}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-success" : "bg-muted"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
