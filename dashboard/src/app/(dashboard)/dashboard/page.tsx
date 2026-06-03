"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  Activity,
  Monitor,
  Zap,
  Crown,
  Shield,
  Sparkles,
  User,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Bell,
} from "lucide-react";
import {
  BentoShell,
  BentoOuter,
  BentoStat,
  BentoModule,
  BentoDonut,
  BentoLegend,
  BentoLineDrop,
  BentoHBars,
} from "@/components/bento";

interface Stats {
  users: { total: number; active: number; newToday: number; newThisWeek: number };
  tiers: { tier: string; count: number }[];
  requests: { totalToday: number; activeUsersToday: number };
  devices: { total: number; online: number; offline: number; error: number };
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

const tierMeta: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Admin", color: "var(--red)", icon: Crown },
  ultra: { label: "Ultra", color: "var(--purple)", icon: Sparkles },
  pro: { label: "Pro", color: "var(--amber)", icon: Shield },
  basic: { label: "Basic", color: "var(--blue)", icon: User },
};

// Preserved from prior implementation — no /api/traffic-24h endpoint yet.
// TODO: wire to a real endpoint when available.
const TRAFFIC_24H = [20, 32, 26, 18, 22, 30, 48, 62, 70, 66, 58, 74, 88, 80, 72, 90, 84, 96, 88, 78, 64, 52, 40, 30];

// Preserved from prior implementation — no /api/alerts endpoint yet.
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isSuperUser = !!session?.user?.is_superuser;

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStats(d);
      })
      .catch(() => setError("Không kết nối được server"))
      .finally(() => setLoading(false));
  }, []);

  const tierDonut = useMemo(() => {
    if (!stats) return [];
    return stats.tiers.map((t) => ({
      l: tierMeta[t.tier]?.label ?? t.tier,
      v: t.count,
      c: tierMeta[t.tier]?.color ?? "var(--slate)",
    }));
  }, [stats]);

  const deviceBars = useMemo(() => {
    if (!stats) return [];
    return [
      { l: "Online", v: stats.devices.online, c: "var(--green)" },
      { l: "Offline", v: stats.devices.offline, c: "var(--slate)" },
      { l: "Lỗi", v: stats.devices.error, c: "var(--red)" },
    ];
  }, [stats]);

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  if (loading) {
    return (
      <BentoShell title="Tổng quan" sub="Đang tải dữ liệu…">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
          <div
            style={{
              width: 22,
              height: 22,
              border: "2px solid var(--line)",
              borderTopColor: "var(--ink)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </BentoShell>
    );
  }

  if (error || !stats) {
    return (
      <BentoShell title="Tổng quan" sub="Không thể tải dữ liệu">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="bento-inner" style={{ maxWidth: 380, textAlign: "center", padding: 32 }}>
            <AlertTriangle size={32} strokeWidth={1.5} style={{ color: "var(--red)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>{error || "Lỗi không xác định"}</p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, marginBottom: 20 }}>
              Vui lòng kiểm tra trạng thái dịch vụ.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "9px 18px",
                background: "var(--chip)",
                color: "var(--chip-fg)",
                borderRadius: 12,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </BentoShell>
    );
  }

  const totalTierUsers = tierDonut.reduce((s, d) => s + d.v, 0);
  const activeRate = stats.users.total > 0 ? Math.round((stats.requests.activeUsersToday / stats.users.total) * 100) : 0;
  const onlineRate = stats.devices.total > 0 ? Math.round((stats.devices.online / stats.devices.total) * 100) : 0;

  return (
    <BentoShell
      title={isSuperUser ? "Tổng quan hệ sinh thái" : "Không gian của tôi"}
      sub={isSuperUser ? "Giám sát thiết bị, người dùng và lưu lượng theo thời gian thực" : "Theo dõi robot và lịch sử chat"}
    >
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
        <BentoStat
          icon={Users}
          label="Tổng người dùng"
          value={stats.users.total.toLocaleString("vi")}
          delta={`+${stats.users.newThisWeek}`}
          deltaLabel="tuần này"
        />
        <BentoStat
          icon={Activity}
          label="Hoạt động · 24h"
          value={stats.requests.activeUsersToday.toLocaleString("vi")}
          delta={`${activeRate}%`}
          deltaLabel="tỉ lệ"
          deltaTone="neutral"
        />
        <BentoStat
          icon={Monitor}
          label="Robot online"
          value={stats.devices.online.toLocaleString("vi")}
          delta={`/ ${stats.devices.total.toLocaleString("vi")}`}
          deltaLabel={`${onlineRate}% sẵn sàng`}
          deltaTone="neutral"
        />
        <BentoStat
          icon={Zap}
          label="Requests hôm nay"
          value={stats.requests.totalToday.toLocaleString("vi")}
          delta="Thời gian thực"
          deltaTone="neutral"
        />
      </div>

      {/* Bento grid — every panel is a BentoModule. .bento-mod.exp spans the full row. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 22, alignItems: "start" }}>
        <div style={{ gridColumn: "span 8", minWidth: 0 }}>
          <BentoModule
            id="traffic"
            title="Lưu lượng tương tác"
            sub="Tổng request theo giờ trong 24 giờ gần nhất"
            expandedId={expandedId}
            onToggle={toggle}
            detail={[
              { l: "Cao điểm", v: `${Math.max(...TRAFFIC_24H)}` },
              { l: "Trung bình / giờ", v: `${Math.round(TRAFFIC_24H.reduce((a, b) => a + b, 0) / TRAFFIC_24H.length)}` },
              { l: "Người dùng hoạt động", v: stats.requests.activeUsersToday.toLocaleString("vi") },
              { l: "Tổng requests", v: stats.requests.totalToday.toLocaleString("vi") },
            ]}
          >
            {(exp) => (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <TrendingUp size={14} style={{ color: "var(--blue)" }} strokeWidth={1.8} />
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                    24 giờ gần nhất · TODO: nối API thật khi sẵn sàng
                  </span>
                </div>
                <BentoLineDrop a={TRAFFIC_24H} tip={17} h={exp ? 280 : 200} w={exp ? 1100 : 580} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--faint)" }} className="mono">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
                </div>
              </>
            )}
          </BentoModule>
        </div>

        <div style={{ gridColumn: "span 4", minWidth: 0 }}>
          <BentoModule
            id="tiers"
            title="Phân bổ gói dịch vụ"
            sub={`${totalTierUsers.toLocaleString("vi")} tài khoản`}
            expandedId={expandedId}
            onToggle={toggle}
            detail={tierDonut.map((d) => ({ l: d.l, v: d.v.toLocaleString("vi") }))}
          >
            {(exp) => (
              <div style={{ display: "flex", alignItems: "center", gap: exp ? 32 : 18, justifyContent: exp ? "center" : "flex-start", flexWrap: "wrap" }}>
                <BentoDonut
                  data={tierDonut}
                  size={exp ? 220 : 168}
                  thick={exp ? 30 : 23}
                  center={totalTierUsers.toLocaleString("vi")}
                  centerSub="người dùng"
                />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <BentoLegend data={tierDonut} />
                </div>
              </div>
            )}
          </BentoModule>
        </div>

        <div style={{ gridColumn: "span 4", minWidth: 0 }}>
          <BentoModule
            id="devices"
            title="Trạng thái thiết bị PTalk"
            sub={`${stats.devices.total.toLocaleString("vi")} robot`}
            expandedId={expandedId}
            onToggle={toggle}
            detail={[
              { l: "Online", v: stats.devices.online.toLocaleString("vi") },
              { l: "Offline", v: stats.devices.offline.toLocaleString("vi") },
              { l: "Lỗi", v: stats.devices.error.toLocaleString("vi") },
              { l: "Tổng cộng", v: stats.devices.total.toLocaleString("vi") },
            ]}
          >
            {(exp) => (
              <div style={{ display: "flex", flexDirection: exp ? "row" : "column", gap: exp ? 32 : 18, alignItems: exp ? "center" : "stretch" }}>
                <div style={{ display: "flex", justifyContent: exp ? "flex-start" : "center" }}>
                  <BentoDonut
                    data={deviceBars}
                    size={exp ? 220 : 168}
                    thick={exp ? 30 : 22}
                    center={`${onlineRate}%`}
                    centerSub="sẵn sàng"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <BentoHBars data={deviceBars} max={stats.devices.total} />
                </div>
              </div>
            )}
          </BentoModule>
        </div>

        <div style={{ gridColumn: "span 4", minWidth: 0 }}>
          <BentoModule
            id="alerts"
            title="Cảnh báo"
            sub="Sự kiện cần chú ý"
            expandedId={expandedId}
            onToggle={toggle}
            detail={[
              { l: "Cấp bách", v: mockAlerts.filter((a) => a.severity === "high").length },
              { l: "Cảnh giác", v: mockAlerts.filter((a) => a.severity === "warning").length },
              { l: "Thông báo", v: mockAlerts.filter((a) => a.severity === "neutral").length },
              { l: "Tổng cộng", v: mockAlerts.length },
            ]}
          >
            {() => (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mockAlerts.map((alert) => {
                  const tone =
                    alert.severity === "high" ? "var(--red)" :
                    alert.severity === "warning" ? "var(--amber)" : "var(--slate)";
                  return (
                    <div
                      key={alert.id}
                      style={{ padding: 12, borderRadius: 12, background: "var(--inner-2)" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <Bell size={14} style={{ color: tone, marginTop: 2, flex: "none" }} strokeWidth={1.8} />
                        <p style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5, flex: 1 }}>{alert.message}</p>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span
                          className="bento-tag"
                          style={{
                            background: `color-mix(in srgb, ${tone} 18%, transparent)`,
                            color: tone,
                          }}
                        >
                          {alert.severity === "high" ? "Cấp bách" : alert.severity === "warning" ? "Cảnh giác" : "Thông báo"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{alert.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoModule>
        </div>

        <div style={{ gridColumn: "span 4", minWidth: 0 }}>
          <BentoModule
            id="recent"
            title="Người dùng gần đây"
            sub={isSuperUser ? "5 tài khoản mới nhất" : "Thành viên"}
            expandedId={expandedId}
            onToggle={toggle}
            detail={[
              { l: "Mới hôm nay", v: stats.users.newToday.toLocaleString("vi") },
              { l: "Mới tuần này", v: stats.users.newThisWeek.toLocaleString("vi") },
              { l: "Đang hoạt động", v: stats.users.active.toLocaleString("vi") },
              { l: "Tổng cộng", v: stats.users.total.toLocaleString("vi") },
            ]}
          >
            {(exp) => (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: exp ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
                  gap: 10,
                }}
              >
                {stats.recentUsers.map((u) => {
                  const meta = tierMeta[u.subscription_tier] ?? tierMeta.basic;
                  const TierIcon = meta.icon;
                  return (
                    <div
                      key={u.id}
                      style={{ padding: 12, borderRadius: 12, background: "var(--inner-2)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="bento-uav2">{u.username.charAt(0).toUpperCase()}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--ink)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {u.username}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 9,
                          paddingTop: 9,
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        <span
                          className="bento-tag"
                          style={{
                            background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
                            color: meta.color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <TierIcon size={10} strokeWidth={2} />
                          {meta.label}
                        </span>
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: u.is_active ? "var(--green)" : "var(--muted)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoModule>
        </div>
      </div>

      {isSuperUser && (
        <BentoOuter title="Xem chi tiết" sub="Truy cập trang quản trị">
          <div className="bento-inner" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/users"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--blue)",
                color: "#fff",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Quản lý người dùng <ArrowRight size={14} />
            </Link>
            <Link
              href="/devices"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--inner-2)",
                color: "var(--ink)",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Thiết bị PTalk <ArrowRight size={14} />
            </Link>
            <Link
              href="/chats"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--inner-2)",
                color: "var(--ink)",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Lịch sử chat <ArrowRight size={14} />
            </Link>
          </div>
        </BentoOuter>
      )}
    </BentoShell>
  );
}
