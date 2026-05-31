"use client";

const SUBJECT_LABELS: Record<string, string> = {
  toan: "Toán", ngu_van: "Ngữ văn", khtn: "KHTN", tieng_viet: "Tiếng Việt",
  lich_su: "Lịch sử", dia_li: "Địa lí", gdcd: "GDCD", tieng_anh: "Tiếng Anh",
  vat_li: "Vật lí", hoa_hoc: "Hóa học", sinh_hoc: "Sinh học",
  lich_su_dia_li: "LS & ĐL", tnxh: "TNXH",
};

interface Cell { subject: string; grade: number; count: number }
interface Props {
  subjects?: string[];
  grades?: number[];
  cells?: Cell[];
  onCellClick?: (cell: { subject: string; grade: number }) => void;
}

export function Heatmap({ subjects, grades, cells, onCellClick }: Props) {
  if (!subjects?.length || !grades?.length || !cells) {
    return <div className="bg-card border border-border rounded-2xl p-6 text-muted text-sm">Chưa có dữ liệu heatmap</div>;
  }
  const map = new Map<string, number>();
  for (const c of cells) map.set(`${c.subject}|${c.grade}`, c.count);
  const max = Math.max(1, ...cells.map((c) => c.count));

  const color = (v: number) => {
    if (v <= 0) return "transparent";
    const t = Math.log(v + 1) / Math.log(max + 1); // log scale
    const alpha = 0.12 + t * 0.78;
    return `rgba(56, 189, 248, ${alpha.toFixed(3)})`; // sky/accent
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 overflow-auto">
      <h2 className="text-sm font-bold text-foreground mb-4">Phân bố theo Môn × Lớp (chunk đang dùng)</h2>
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card p-2 text-left text-muted font-medium">Môn \ Lớp</th>
            {grades.map((g) => (
              <th key={g} className="p-2 text-muted font-medium text-center min-w-[44px]">{g}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s}>
              <td className="sticky left-0 bg-card p-2 text-foreground whitespace-nowrap font-medium">
                {SUBJECT_LABELS[s] ?? s}
              </td>
              {grades.map((g) => {
                const v = map.get(`${s}|${g}`) ?? 0;
                return (
                  <td key={g} className="p-1 text-center">
                    <button
                      disabled={v <= 0}
                      onClick={() => onCellClick?.({ subject: s, grade: g })}
                      title={`${SUBJECT_LABELS[s] ?? s} · Lớp ${g}: ${v.toLocaleString()}`}
                      style={{ backgroundColor: color(v) }}
                      className="w-full h-8 rounded flex items-center justify-center text-[11px] text-foreground hover:ring-2 hover:ring-accent disabled:cursor-default transition-all"
                    >
                      {v > 0 ? v.toLocaleString() : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted mt-3">Bấm vào ô để xem 20 chunk mẫu.</p>
    </div>
  );
}
