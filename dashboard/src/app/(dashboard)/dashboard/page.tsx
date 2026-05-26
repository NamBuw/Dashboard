import {
  Users,
  Monitor,
  Activity,
  AlertTriangle,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

const stats = [
  {
    title: "Tổng User",
    value: "2,847",
    change: "+12% so với tháng trước",
    changeType: "positive" as const,
    icon: Users,
    iconColor: "bg-accent",
  },
  {
    title: "User mới hôm nay",
    value: "24",
    change: "+3 so với hôm qua",
    changeType: "positive" as const,
    icon: UserPlus,
    iconColor: "bg-success",
  },
  {
    title: "Thiết bị Online",
    value: "156",
    change: "/ 203 tổng thiết bị",
    changeType: "neutral" as const,
    icon: Monitor,
    iconColor: "bg-purple-500",
  },
  {
    title: "Phiên tương tác hôm nay",
    value: "1,203",
    change: "TB 8.5 phút/phiên",
    changeType: "neutral" as const,
    icon: Activity,
    iconColor: "bg-amber-500",
  },
];

const alerts = [
  {
    id: 1,
    type: "warning" as const,
    message: "3 thiết bị mất kết nối > 30 phút",
    time: "5 phút trước",
  },
  {
    id: 2,
    type: "error" as const,
    message: "OTA update thất bại cho Robot PTK-0142",
    time: "15 phút trước",
  },
  {
    id: 3,
    type: "info" as const,
    message: '12 user không hoạt động > 7 ngày trên Kid Mentor',
    time: "1 giờ trước",
  },
];

const products = [
  { name: "PTalk Assistant", users: 1245, percentage: 44, color: "bg-accent" },
  { name: "Kid Mentor", users: 892, percentage: 31, color: "bg-success" },
  { name: "Elder Kare", users: 710, percentage: 25, color: "bg-purple-500" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted text-sm mt-1">
          Theo dõi toàn bộ hệ sinh thái sản phẩm
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Distribution */}
        <div className="lg:col-span-2 bg-card-bg rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Phân bổ User theo Sản phẩm
          </h2>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="text-muted">
                    {product.users.toLocaleString()} users ({product.percentage}
                    %)
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${product.color}`}
                    style={{ width: `${product.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-success" />
              <span className="text-muted">
                <strong className="text-foreground">18%</strong> user sử dụng
                nhiều hơn 1 sản phẩm
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-card-bg rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Cảnh báo
            </h2>
            <span className="text-xs font-medium bg-danger/10 text-danger px-2 py-1 rounded-full">
              {alerts.length} active
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <AlertTriangle
                  size={16}
                  className={
                    alert.type === "error"
                      ? "text-danger mt-0.5"
                      : alert.type === "warning"
                        ? "text-warning mt-0.5"
                        : "text-accent mt-0.5"
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Users Chart Placeholder */}
      <div className="bg-card-bg rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          User Active (7 ngày gần nhất)
        </h2>
        <div className="h-64 flex items-center justify-center text-muted border-2 border-dashed border-border rounded-lg">
          <div className="text-center">
            <Activity size={40} className="mx-auto mb-2 text-muted/40" />
            <p className="text-sm">
              Biểu đồ sẽ được tích hợp khi kết nối API backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
