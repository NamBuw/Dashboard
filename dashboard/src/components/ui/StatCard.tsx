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
  iconColor = "text-accent",
}: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[12px] text-muted-foreground font-medium">{title}</p>
          <p className="text-[24px] font-semibold text-foreground tracking-tight">{value}</p>
          {change && (
            <p
              className={clsx(
                "text-[12px]",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-danger",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={clsx("p-2 rounded-lg", iconColor)}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
