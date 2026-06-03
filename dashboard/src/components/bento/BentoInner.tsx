import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export default function BentoInner({ children, style, className }: Props) {
  return (
    <div className={"bento-inner " + (className ?? "")} style={style}>
      {children}
    </div>
  );
}
