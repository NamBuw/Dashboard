import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon?: LucideIcon;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}

export default function BentoHd({ icon: IconCmp, title, sub, right }: Props) {
  return (
    <div className="bento-ihd">
      {IconCmp && (
        <div className="bento-ichip">
          <IconCmp size={18} strokeWidth={1.8} />
        </div>
      )}
      <div>
        <div className="t">{title}</div>
        {sub && <div className="s">{sub}</div>}
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}
