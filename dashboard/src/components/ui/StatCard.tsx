import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-accent",
}: StatCardProps) {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={clsx(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-danger",
                changeType === "neutral" && "text-muted"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div
          className={clsx(
            "p-2.5 rounded-lg",
            iconColor
          )}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
