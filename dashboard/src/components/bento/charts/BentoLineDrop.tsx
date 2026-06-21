interface Props {
  a: number[];
  b?: number[];
  tip?: number;
  w?: number;
  h?: number;
  colorA?: string;
  colorB?: string;
  labels?: string[];
}

export default function BentoLineDrop({
  a,
  b,
  tip,
  w = 460,
  h = 210,
  colorA = "var(--red)",
  colorB = "var(--amber)",
  labels,
}: Props) {
  if (a.length === 0) return null;
  const all = b ? [...a, ...b] : a;
  const max = Math.max(...all) * 1.15 || 1;
  const X = (i: number) => 30 + (i / (a.length - 1 || 1)) * (w - 50);
  const Y = (v: number) => h - 30 - (v / max) * (h - 60);
  const path = (s: number[]) =>
    s.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const ti = tip ?? Math.floor(a.length / 2);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      {a.map((_, i) => (
        <line
          key={i}
          x1={X(i)}
          x2={X(i)}
          y1={20}
          y2={h - 30}
          stroke="var(--line)"
          strokeWidth={i === ti ? 9 : 1.4}
          strokeLinecap="round"
          opacity={i === ti ? 1 : 0.9}
        />
      ))}
      {b && <path d={path(b)} fill="none" stroke={colorB} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} style={{ animation: "bentoLineDraw 1s var(--ease-out-smooth) both" }} />}
      <path d={path(a)} fill="none" stroke={colorA} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} style={{ animation: "bentoLineDraw 1s var(--ease-out-smooth) both" }} />
      {a.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r="3" fill="var(--inner)" stroke={colorA} strokeWidth="2" style={{ animation: "fadeIn .4s ease both", animationDelay: `${0.5 + i * 0.03}s` }} />
      ))}
      <g transform={`translate(${X(ti) + 12}, ${Y(a[ti]) - 26})`} style={{ animation: "fadeIn .5s ease both", animationDelay: ".7s" }}>
        <rect
          width={b ? 78 : 58}
          height={b ? 44 : 28}
          rx="11"
          fill="var(--inner)"
          stroke="var(--line)"
          style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,.12))" }}
        />
        <circle cx="14" cy="16" r="3.5" fill={colorA} />
        <text x="24" y="20" fontSize="12" fontWeight={700} fill="var(--ink)">{a[ti]}</text>
        {b && (
          <>
            <circle cx="14" cy="32" r="3.5" fill={colorB} />
            <text x="24" y="36" fontSize="12" fontWeight={700} fill="var(--ink)">{b[ti]}</text>
          </>
        )}
      </g>
      {labels && (
        <g>
          {labels.map((lab, i) => (
            <text
              key={i}
              x={X(i)}
              y={h - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={700}
              fill={i === ti ? "var(--ink)" : "var(--muted)"}
            >
              {lab}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
