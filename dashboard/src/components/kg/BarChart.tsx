"use client";

interface Bar { bo_sach: string; count: number }
interface Props {
  data?: Bar[];
  title?: string;
}

const BOOK_LABELS: Record<string, string> = {
  KNTT: "Kết nối tri thức", CTST: "Chân trời sáng tạo", CD: "Cánh diều", NONE: "Chưa gắn bộ",
};

export function BarChart({ data, title = "Phân bố theo bộ sách" }: Props) {
  if (!data?.length) {
    return <div className="bg-card border border-border rounded-2xl p-6 text-muted text-sm">Không có dữ liệu</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h2 className="text-sm font-bold text-foreground mb-4">{title}</h2>
      <div className="space-y-3">
        {data.map((d) => {
          const pct = (d.count / max) * 100;
          return (
            <div key={d.bo_sach}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">{BOOK_LABELS[d.bo_sach] ?? d.bo_sach}</span>
                <span className="text-muted">{d.count.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
