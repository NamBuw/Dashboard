"use client";

interface Slice { reason: string; count: number }
interface Props {
  data?: Slice[];
  title?: string;
}

const PALETTE = ["#38bdf8", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#22d3ee", "#facc15", "#4ade80", "#c084fc", "#fca5a5", "#60a5fa"];

export function Donut({ data, title = "Lý do bị loại" }: Props) {
  if (!data?.length) {
    return <div className="bg-card border border-border rounded-2xl p-6 text-muted text-sm">Không có dữ liệu</div>;
  }
  const total = data.reduce((a, b) => a + b.count, 0) || 1;
  const R = 70, C = 90, STROKE = 28;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h2 className="text-sm font-bold text-foreground mb-4">{title}</h2>
      <div className="flex items-center gap-6 flex-wrap">
        <svg width={C * 2} height={C * 2} viewBox={`0 0 ${C * 2} ${C * 2}`} className="shrink-0">
          <g transform={`rotate(-90 ${C} ${C})`}>
            {data.map((d, i) => {
              const frac = d.count / total;
              const dash = frac * circ;
              const seg = (
                <circle
                  key={d.reason}
                  cx={C} cy={C} r={R}
                  fill="none"
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${d.reason}: ${d.count.toLocaleString()} (${Math.round(frac * 100)}%)`}</title>
                </circle>
              );
              offset += dash;
              return seg;
            })}
          </g>
          <text x={C} y={C - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700 }}>
            {total.toLocaleString()}
          </text>
          <text x={C} y={C + 14} textAnchor="middle" className="fill-current text-muted" style={{ fontSize: 11 }}>
            tổng
          </text>
        </svg>
        <ul className="text-xs space-y-1 min-w-0">
          {data.map((d, i) => (
            <li key={d.reason} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
              <span className="text-foreground truncate max-w-[200px]" title={d.reason}>{d.reason}</span>
              <span className="text-muted ml-auto">{d.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
