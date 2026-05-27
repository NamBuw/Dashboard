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
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  admin: { label: "Admin", color: "text-red-400 border-red-500/30", bg: "bg-red-500", icon: Crown },
  ultra: { label: "Ultra", color: "text-purple-400 border-purple-500/30", bg: "bg-purple-500", icon: Sparkles },
  pro: { label: "Pro", color: "text-amber-400 border-amber-500/30", bg: "bg-amber-500", icon: Shield },
  basic: { label: "Basic", color: "text-sky-400 border-sky-500/30", bg: "bg-sky-500", icon: User },
};

// Mock alerts to fulfill OVR-05 (Critical Alerts)
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
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
        }
      })
      .catch(() => setError("Không kết nối được server"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <div className="text-muted text-sm font-medium animate-pulse">Đang nạp dữ liệu hệ sinh thái...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass-card max-w-md p-8 text-center rounded-2xl">
          <AlertTriangle className="mx-auto text-danger mb-4" size={48} />
          <p className="text-foreground text-lg font-semibold">{error || "Lỗi không xác định"}</p>
          <p className="text-muted text-sm mt-2 mb-6">
            Không kết nối được với PostgreSQL. Vui lòng kiểm tra trạng thái dịch vụ db.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Thử tải lại trang
          </button>
        </div>
      </div>
    );
  }

  const totalTierUsers = stats.tiers.reduce((sum, t) => sum + t.count, 0);

  // SVG Chart data path coordinates helper (Mocking 24h interactive trend)
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            {isSuperUser ? "Tổng quan Hệ sinh thái" : "Không gian của tôi"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {isSuperUser 
              ? "Giám sát thời gian thực & Phân tích tổng quan thiết bị, người dùng."
              : "Theo dõi robot thông minh, lịch sử chat và tiến trình học tập của con."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-success">Hệ thống đang hoạt động</span>
        </div>
      </div>

      {/* Stat Cards (Bento Grid tier 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isSuperUser ? "Tổng User Hệ Thống" : "Thiết bị của tôi"}
          value={isSuperUser ? stats.users.total.toLocaleString() : stats.devices.total.toString()}
          change={isSuperUser ? `${stats.users.active} active` : `${stats.devices.online} online`}
          changeType="neutral"
          icon={isSuperUser ? Users : Monitor}
          iconColor="bg-accent/20 text-accent border border-accent/30"
        />
        <StatCard
          title={isSuperUser ? "Người dùng mới hôm nay" : "Thiết bị Online"}
          value={isSuperUser ? stats.users.newToday.toString() : stats.devices.online.toString()}
          change={isSuperUser ? `+${stats.users.newThisWeek} tuần này` : "Đang kết nối"}
          changeType={isSuperUser && stats.users.newToday > 0 ? "positive" : "neutral"}
          icon={isSuperUser ? UserPlus : Activity}
          iconColor="bg-success/20 text-success border border-success/30"
        />
        <StatCard
          title={isSuperUser ? "Requests hôm nay" : "Tương tác hôm nay"}
          value={stats.requests.totalToday.toLocaleString()}
          change="Thời gian thực"
          changeType="neutral"
          icon={isSuperUser ? Activity : Zap}
          iconColor="bg-amber-500/20 text-amber-500 border border-amber-500/30"
        />
        <StatCard
          title={isSuperUser ? "Active Users 24h" : "Thành viên gia đình"}
          value={isSuperUser ? stats.requests.activeUsersToday.toString() : stats.users.total.toString()}
          change={isSuperUser 
            ? `Tỷ lệ ${(stats.users.total > 0 ? Math.round((stats.requests.activeUsersToday / stats.users.total) * 100) : 0)}%`
            : `${stats.users.active} hoạt động`}
          changeType="neutral"
          icon={isSuperUser ? Zap : Users}
          iconColor="bg-purple-500/20 text-purple-400 border border-purple-500/30"
        />
      </div>

      {/* Bento Grid layout tier 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Engagement Trend & Radar (Col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  Lưu lượng Tương tác (24h)
                </h2>
                <p className="text-xs text-muted">Tổng số phiên kết nối thời gian thực</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                Live
              </span>
            </div>

            {/* SVG Trend Line */}
            <div className="h-32 w-full mt-6 relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={fillData} fill="url(#chartGradient)" />
                <path d={pathData} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            
            <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>23:59</span>
            </div>
          </div>

          {/* User Tiers Distribution */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-4">Phân bổ Gói dịch vụ (Subscription Tier)</h2>
            <div className="space-y-4">
              {stats.tiers.map((tier) => {
                const config = tierConfig[tier.tier] || tierConfig.basic;
                const percentage = totalTierUsers > 0 ? Math.round((tier.count / totalTierUsers) * 100) : 0;
                const Icon = config.icon;

                return (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className={`p-1 rounded-md bg-opacity-20 ${config.bg.replace("bg-", "text-")} border border-opacity-30 border-current`}>
                          <Icon size={14} />
                        </span>
                        {config.label}
                      </span>
                      <span className="text-muted text-xs">
                        {tier.count} users ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full ${config.bg} transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      />
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

        {/* Live Status & Alerts (Col-span-1) */}
        <div className="space-y-6">
          {/* Radar Live Device Status */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Monitor size={18} className="text-accent" />
              Thiết bị PTalk Robot
            </h2>
            <p className="text-xs text-muted mb-4">Trạng thái kết nối phần cứng thời gian thực</p>
            
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {/* Radar Ring Visual */}
              <div className="relative w-28 h-28 flex items-center justify-center border border-white/10 rounded-full">
                <div className="absolute inset-2 border border-dashed border-accent/20 rounded-full" />
                <div className="absolute inset-6 border border-white/5 rounded-full" />
                <div className="absolute w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center glow-accent">
                  <Monitor size={14} className="text-accent" />
                </div>
                {/* Ping wave animation */}
                <div className="absolute w-full h-full rounded-full border border-accent/30 animate-ping opacity-30" />
              </div>

              {/* Status metrics */}
              <div className="grid grid-cols-3 w-full text-center gap-2 pt-2">
                <div className="p-2 rounded-lg bg-success/5 border border-success/10">
                  <p className="text-xs text-muted">Online</p>
                  <p className="text-sm font-bold text-success">{stats.devices.online}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-500/5 border border-white/5">
                  <p className="text-xs text-muted">Offline</p>
                  <p className="text-sm font-bold text-muted">{stats.devices.offline}</p>
                </div>
                <div className="p-2 rounded-lg bg-danger/5 border border-danger/10">
                  <p className="text-xs text-muted">Lỗi</p>
                  <p className="text-sm font-bold text-danger">{stats.devices.error}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts (OVR-05) */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                Cảnh báo Đáng chú ý
              </h2>
              <span className="text-[10px] bg-danger/10 text-danger border border-danger/20 font-semibold px-2 py-0.5 rounded">
                Cần xử lý
              </span>
            </div>

            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground leading-relaxed">{alert.message}</p>
                    <span className="text-[9px] text-muted shrink-0 font-mono">{alert.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      alert.severity === "high" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {alert.severity === "high" ? "Cấp bách" : "Cảnh giác"}
                    </span>
                    <button className="text-[10px] text-accent hover:underline flex items-center gap-1">
                      Xử lý <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bento Grid tier 3: Recent Registrations or Family Members list */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isSuperUser ? "Người dùng đăng ký gần đây" : "Thành viên trong Gia đình"}
            </h2>
            <p className="text-xs text-muted">
              {isSuperUser 
                ? "Danh sách tài khoản vừa khởi tạo trong hệ thống" 
                : "Danh sách tài khoản trẻ em / người nhà được liên kết"}
            </p>
          </div>
          {isSuperUser && (
            <Link href="/users" className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          {stats.recentUsers.map((user) => {
            const config = tierConfig[user.subscription_tier] || tierConfig.basic;
            const Icon = config.icon;

            return (
              <div 
                key={user.id} 
                className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-base font-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{user.username}</h3>
                    <p className="text-[11px] text-muted truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-success animate-pulse" : "bg-muted"}`} title={user.is_active ? "Đang hoạt động" : "Bị khoá"} />
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
