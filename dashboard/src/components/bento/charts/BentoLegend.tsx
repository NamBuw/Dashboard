interface Datum {
  l: string;
  v: number;
  c: string;
}

export default function BentoLegend({ data, format }: { data: Datum[]; format?: (v: number) => string }) {
  return (
    <div className="bento-legend">
      {data.map((d, i) => (
        <div key={i} className="r">
          <span className="k" style={{ background: d.c }} />
          <span className="nm">{d.l}</span>
          <span className="v">{format ? format(d.v) : d.v.toLocaleString("vi")}</span>
        </div>
      ))}
    </div>
  );
}
