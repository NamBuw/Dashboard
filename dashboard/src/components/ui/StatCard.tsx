import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-gradient-primary",
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        "glass-card-hover rounded-2xl p-5 opacity-0 animate-fade-in-up",
        delay <= 0.4 && `stagger-${Math.floor(delay / 0.05) + 1}`
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
          {change && (
            <p
              className={clsx(
                "text-xs font-semibold flex items-center gap-1",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-danger",
                changeType === "neutral" && "text-muted"
              )}
            >
              {changeType === "positive" && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {changeType === "negative" && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change}
            </p>
          )}
        </div>
        <div
          className={clsx(
            "p-3 rounded-xl text-white shadow-lg",
            iconColor
          )}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
