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
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  tiers: { tier: string; count: number }[];
  requests: {
    totalToday: number;
    activeUsersToday: number;
  };
  devices: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  recentUsers: {
    id: string;
    username: string;
    email: string;
    subscription_tier: string;
    is_superuser: boolean;
    is_active: boolean;
    created_at: string;
  }[];
}

const tierConfig: Record<
  string,
  { label: string; color: string; gradient: string; icon: React.ElementType }
> = {
  admin: { label: "Admin", color: "text-red-400 border-red-500/30", gradient: "from-red-500 to-pink-500", icon: Crown },
  ultra: { label: "Ultra", color: "text-purple-400 border-purple-500/30", gradient: "from-purple-500 to-violet-500", icon: Sparkles },
  pro: { label: "Pro", color: "text-amber-400 border-amber-500/30", gradient: "from-amber-500 to-orange-500", icon: Shield },
  basic: { label: "Basic", color: "text-sky-400 border-sky-500/30", gradient: "from-sky-500 to-cyan-500", icon: User },
};

const mockAlerts = [
  { id: 1, type: "device", message: "Robot PTalk-7729 mất kết nối > 15 phút", severity: "high", time: "5 phút trước" },
  { id: 2, type: "device", message: "Robot PTalk-1823 pin yếu < 10% (Cần sạc)", severity: "warning", time: "45 phút trước" },
  { id: 3, type: "system", message: "Auth Service API latency tăng cao (420ms)", severity: "neutral", time: "2 giờ trước" },
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
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-foreground font-semibold">Đang nạp dữ liệu</p>
          <p className="text-muted text-sm animate-pulse">Hệ sinh thái CTS Lab...</p>
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-2 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass-card max-w-md p-8 text-center rounded-2xl animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-danger" size={32} />
          </div>
          <p className="text-foreground text-lg font-bold">{error || "Lỗi không xác định"}</p>
          <p className="text-muted text-sm mt-2 mb-6">
            Không kết nối được với PostgreSQL. Vui lòng kiểm tra trạng thái dịch vụ.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gradient-primary text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-lg glow-indigo cursor-pointer"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  const totalTierUsers = stats.tiers.reduce((sum, t) => sum + t.count, 0);
  const chartPoints = [20, 45, 28, 60, 55, 85, 70, 95, 110, 80, 90, 120];
  const maxVal = 130;
  const width = 500;
  const height = 120;
  const pathData = chartPoints
    .map((val, idx) => {
      const x = (idx / (chartPoints.length - 1)) * width;
      const y = height - (val / maxVal) * height;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const fillData = `${pathData} L ${width} ${height} L 0 ${height} Z`;
  const isSuperUser = !!session?.user?.is_superuser;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-primary">
            {isSuperUser ? "Tổng quan Hệ sinh thái" : "Không gian của tôi"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {isSuperUser
              ? "Giám sát thời gian thực & Phân tích tổng quan thiết bị, người dùng."
              : "Theo dõi robot thông minh, lịch sử chat và tiến trình học tập."}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
          <span className="w-2.5 h-2.5 bg-success rounded-full animate-dot-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-success">Hệ thống hoạt động</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isSuperUser ? "Tổng User" : "Thiết bị"}
          value={isSuperUser ? stats.users.total.toLocaleString() : stats.devices.total.toString()}
          change={isSuperUser ? `${stats.users.active} active` : `${stats.devices.online} online`}
          changeType="neutral"
          icon={isSuperUser ? Users : Monitor}
          iconColor="bg-gradient-primary"
          delay={0.05}
        />
        <StatCard
          title={isSuperUser ? "Mới hôm nay" : "Online"}
          value={isSuperUser ? stats.users.newToday.toString() : stats.devices.online.toString()}
          change={isSuperUser ? `+${stats.users.newThisWeek} tuần này` : "Đang kết nối"}
          changeType={isSuperUser && stats.users.newToday > 0 ? "positive" : "neutral"}
          icon={isSuperUser ? UserPlus : Activity}
          iconColor="bg-gradient-emerald"
          delay={0.1}
        />
        <StatCard
          title={isSuperUser ? "Requests" : "Tương tác"}
          value={stats.requests.totalToday.toLocaleString()}
          change="Thời gian thực"
          changeType="neutral"
          icon={isSuperUser ? Activity : Zap}
          iconColor="bg-gradient-amber"
          delay={0.15}
        />
        <StatCard
          title={isSuperUser ? "Active 24h" : "Gia đình"}
          value={isSuperUser ? stats.requests.activeUsersToday.toString() : stats.users.total.toString()}
          change={isSuperUser
            ? `Tỷ lệ ${stats.users.total > 0 ? Math.round((stats.requests.activeUsersToday / stats.users.total) * 100) : 0}%`
            : `${stats.users.active} hoạt động`}
          changeType="neutral"
          icon={isSuperUser ? Zap : Users}
          iconColor="bg-gradient-purple"
          delay={0.2}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden opacity-0 animate-fade-in-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  Lưu lượng Tương tác (24h)
                </h2>
                <p className="text-xs text-muted">Tổng số phiên kết nối thời gian thực</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-primary text-white shadow-lg">
                Live
              </span>
            </div>
            <div className="h-32 w-full mt-6 relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={fillData} fill="url(#chartGradient)" />
                <path d={pathData} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
              <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>23:59</span>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="glass-card rounded-2xl p-5 opacity-0 animate-fade-in-up stagger-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Phân bổ Gói dịch vụ</h2>
            <div className="space-y-4">
              {stats.tiers.map((tier) => {
                const config = tierConfig[tier.tier] || tierConfig.basic;
                const percentage = totalTierUsers > 0 ? Math.round((tier.count / totalTierUsers) * 100) : 0;
                const Icon = config.icon;
                return (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className={`p-1 rounded-lg bg-gradient-to-r ${config.gradient} text-white`}>
                          <Icon size={14} />
                        </span>
                        {config.label}
                      </span>
                      <span className="text-muted text-xs font-mono">{tier.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              {stats.tiers.length === 0 && (
                <p className="text-sm text-muted text-center py-4">Chưa có thông tin gói cước.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Device Radar */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden opacity-0 animate-fade-in-up stagger-7">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Monitor size={18} className="text-accent" />
              Thiết bị PTalk Robot
            </h2>
            <p className="text-xs text-muted mb-4">Trạng thái kết nối thời gian thực</p>
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-accent/20 animate-pulse-glow" />
                <div className="absolute inset-2 rounded-full border border-dashed border-accent/20" />
                <div className="absolute inset-6 rounded-full border border-white/5" />
                <div className="absolute w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg glow-indigo">
                  <Monitor size={16} className="text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 w-full text-center gap-2 pt-2">
                <div className="p-2 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-[10px] text-muted uppercase">Online</p>
                  <p className="text-lg font-bold text-success">{stats.devices.online}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-muted uppercase">Offline</p>
                  <p className="text-lg font-bold text-muted">{stats.devices.offline}</p>
                </div>
                <div className="p-2 rounded-xl bg-danger/10 border border-danger/20">
                  <p className="text-[10px] text-muted uppercase">Lỗi</p>
                  <p className="text-lg font-bold text-danger">{stats.devices.error}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="glass-card rounded-2xl p-5 opacity-0 animate-fade-in-up stagger-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                Cảnh báo
              </h2>
              <span className="text-[10px] bg-danger/10 text-danger border border-danger/20 font-semibold px-2 py-0.5 rounded-full">
                Cần xử lý
              </span>
            </div>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200 hover:bg-white/[0.03]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground leading-relaxed">{alert.message}</p>
                    <span className="text-[9px] text-muted shrink-0 font-mono">{alert.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                      alert.severity === "high"
                        ? "bg-danger/10 text-danger border border-danger/20"
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}>
                      {alert.severity === "high" ? "Cấp bách" : "Cảnh giác"}
                    </span>
                    <button className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 font-semibold transition-colors">
                      Xử lý <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="glass-card rounded-2xl p-5 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isSuperUser ? "Người dùng gần đây" : "Thành viên Gia đình"}
            </h2>
            <p className="text-xs text-muted">
              {isSuperUser ? "Tài khoản vừa khởi tạo trong hệ thống" : "Tài khoản liên kết"}
            </p>
          </div>
          {isSuperUser && (
            <Link href="/users" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 font-semibold transition-colors">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          {stats.recentUsers.map((user, i) => {
            const config = tierConfig[user.subscription_tier] || tierConfig.basic;
            return (
              <div
                key={user.id}
                className="glass-card-hover p-4 rounded-xl opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.45 + i * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{user.username}</h3>
                    <p className="text-[11px] text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-success animate-dot-pulse" : "bg-muted"}`} />
                </div>
              </div>
            );
          })}
          {stats.recentUsers.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted text-sm">Chưa có thành viên nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}
