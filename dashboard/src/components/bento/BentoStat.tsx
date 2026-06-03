import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaLabel?: ReactNode;
  deltaTone?: "success" | "neutral" | "warn" | "danger";
}

export default function BentoStat({ icon: IconCmp, label, value, delta, deltaLabel, deltaTone = "success" }: Props) {
  return (
    <div className="bento-stat">
      <div className="l">
        <span className="ic"><IconCmp size={15} strokeWidth={1.8} /></span>
        {label}
      </div>
      <div className="v">{value}</div>
      {(delta || deltaLabel) && (
        <div className={"d " + (deltaTone === "success" ? "" : deltaTone)}>
          {delta}
          {deltaLabel && <span style={{ color: "var(--muted)", fontWeight: 500, marginLeft: 6 }}>{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
