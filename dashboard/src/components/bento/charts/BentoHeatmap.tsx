interface Props {
  grid: number[][];
  rowLabels: string[];
  colLabels?: string[];
  cols?: number;
  legendLeft?: string;
  legendRight?: string;
  onCellClick?: (rowIdx: number, colIdx: number, value: number) => void;
  cellTitle?: (rowIdx: number, colIdx: number, value: number) => string;
}

const PALETTE = [
  "var(--inner-2)",
  "color-mix(in srgb, var(--blue) 22%, var(--inner))",
  "color-mix(in srgb, var(--blue) 40%, var(--inner))",
  "color-mix(in srgb, var(--blue) 58%, var(--inner))",
  "color-mix(in srgb, var(--blue) 78%, var(--inner))",
  "var(--blue)",
];

export default function BentoHeatmap({
  grid,
  rowLabels,
  colLabels,
  cols,
  legendLeft = "Ít",
  legendRight = "Nhiều",
  onCellClick,
  cellTitle,
}: Props) {
  const colCount = cols ?? (grid[0]?.length ?? 0);

  // Compute bucket using max so we map raw counts → 0..5
  const maxV = grid.reduce((m, row) => row.reduce((mm, v) => Math.max(mm, v), m), 0) || 1;
  const bucket = (v: number) => {
    if (v <= 0) return 0;
    return Math.max(1, Math.min(PALETTE.length - 1, Math.ceil((v / maxV) * (PALETTE.length - 1))));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {colLabels && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 46 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount},1fr)`, gap: 6, flex: 1 }}>
            {colLabels.map((l, i) => (
              <span key={i} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--faint)", textAlign: "center" }}>{l}</span>
            ))}
          </div>
        </div>
      )}
      {grid.map((row, r) => (
        <div key={r} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 40, fontSize: 11, fontWeight: 700, color: "var(--muted)", flex: "none" }}>
            {rowLabels[r]}
          </span>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount},1fr)`, gap: 6, flex: 1 }}>
            {row.map((v, c) => (
              <div
                key={c}
                role={onCellClick ? "button" : undefined}
                tabIndex={onCellClick ? 0 : undefined}
                onClick={onCellClick ? () => onCellClick(r, c, v) : undefined}
                onKeyDown={onCellClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCellClick(r, c, v); } } : undefined}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: PALETTE[bucket(v)],
                  cursor: onCellClick ? "pointer" : "default",
                }}
                title={cellTitle ? cellTitle(r, c, v) : `${rowLabels[r]} · ${v}`}
              />
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginLeft: 46, marginTop: 4, fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
        <span>{legendLeft}</span>
        {PALETTE.map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: c }} />)}
        <span>{legendRight}</span>
      </div>
    </div>
  );
}
