import { useId } from "react";

interface Props {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
}

export default function BentoSpark({ data, color = "var(--blue)", w = 120, h = 40, fill = true }: Props) {
  const id = useId().replace(/:/g, "");
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1 || 1)) * w,
    h - ((v - min) / range) * (h - 6) - 3,
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={"sp" + id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity=".22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#sp${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
