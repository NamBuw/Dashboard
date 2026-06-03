interface Props {
  data: number[];
  labels: string[];
  highlight?: number;
  callout?: string;
  h?: number;
}

export default function BentoPillBars({ data, labels, highlight, callout, h = 210 }: Props) {
  const max = Math.max(...data) || 1;
  const hi = highlight ?? data.indexOf(max);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: h }}>
      {data.map((v, i) => {
        const on = i === hi;
        const bh = (v / max) * (h - 28);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {on && callout && <div className="bento-callout" style={{ marginBottom: 2 }}>{callout}</div>}
            <div
              style={{
                width: "74%",
                maxWidth: 30,
                height: bh,
                borderRadius: 20,
                background: on ? "var(--blue)" : "var(--btn)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: on ? "rgba(255,255,255,.7)" : "var(--faint)",
                }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
