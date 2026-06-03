import type { CSSProperties, ReactNode } from "react";

interface Props {
  title?: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export default function BentoOuter({ title, sub, right, children, style, className }: Props) {
  return (
    <div className={"bento-outer " + (className ?? "")} style={style}>
      {(title || sub || right) && (
        <div
          className="bento-outer-hd"
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}
        >
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
