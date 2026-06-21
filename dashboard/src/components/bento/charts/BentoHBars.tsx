import type { CSSProperties } from "react";

export interface HBarDatum {
  l: string;
  v: number;
  c?: string;
}

interface Props {
  data: HBarDatum[];
  max?: number;
  format?: (v: number) => string;
}

export default function BentoHBars({ data, max, format }: Props) {
  const m = max ?? Math.max(...data.map((d) => d.v)) ?? 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
            <span className="mono" style={{ color: "var(--ink-2)", fontWeight: 600 }}>{d.l}</span>
            <span style={{ color: "var(--muted)", fontWeight: 700 }}>
              {format ? format(d.v) : d.v.toLocaleString("vi")}
            </span>
          </div>
          <div style={{ height: 9, borderRadius: 6, background: "var(--inner-2)", overflow: "hidden" }}>
            <div
              style={{
                width: `${(d.v / m) * 100}%`,
                height: "100%",
                borderRadius: 6,
                background: d.c ?? "var(--blue)",
                animation: "bentoBarGrow .7s var(--ease-out-smooth) both",
                animationDelay: `${i * 0.08}s`,
                "--bw": `${(d.v / m) * 100}%`,
              } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
