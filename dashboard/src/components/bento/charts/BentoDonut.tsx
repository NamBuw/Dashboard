import type { ReactNode, CSSProperties } from "react";

export interface DonutDatum {
  l: string;
  v: number;
  c: string;
}

interface Props {
  data: DonutDatum[];
  size?: number;
  thick?: number;
  center?: ReactNode;
  centerSub?: ReactNode;
}

export default function BentoDonut({ data, size = 190, thick = 26, center, centerSub }: Props) {
  const total = data.reduce((s, d) => s + d.v, 0) || 1;
  const r = (size - thick) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const gap = 0.012 * c;
  // Pre-compute cumulative offsets without mutation during render.
  const segments = data.reduce<{ start: number; frac: number }[]>((segs, d) => {
    const prev = segs.length > 0 ? segs[segs.length - 1] : { start: 0, frac: 0 };
    segs.push({ start: prev.start + prev.frac, frac: d.v / total });
    return segs;
  }, []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {data.map((d, i) => {
        const { start, frac } = segments[i];
        const dash = Math.max(frac * c - gap, 0.5);
        const off = -start * c;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={d.c}
            strokeWidth={thick}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${cx} ${cx})`}
            strokeLinecap="round"
            style={{
              animation: "bentoDonutGrow .8s var(--ease-out-smooth) both",
              animationDelay: `${i * 0.12}s`,
              "--circ": `${c}`,
              "--seg-dash": `${dash}`,
              "--seg-rest": `${c - dash}`,
            } as CSSProperties}
          />
        );
      })}
      {center && (
        <text
          x={cx}
          y={cx - 2}
          textAnchor="middle"
          fontSize={size * 0.17}
          fontWeight={800}
          fill="var(--ink)"
          style={{ letterSpacing: "-.03em" }}
        >
          {center}
        </text>
      )}
      {centerSub && (
        <text x={cx} y={cx + size * 0.12} textAnchor="middle" fontSize="12" fill="var(--muted)">
          {centerSub}
        </text>
      )}
    </svg>
  );
}
