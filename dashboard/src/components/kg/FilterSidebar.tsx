"use client";
import type { FilterState } from "@/app/(dashboard)/kg-browse/page";

interface Props {
  filter: FilterState;
  onChange: (next: FilterState) => void;
}

interface Opt { value: string | null; label: string }

const BOOKS: Opt[] = [
  { value: null, label: "Tất cả" },
  { value: "KNTT", label: "Kết nối tri thức" },
  { value: "CTST", label: "Chân trời sáng tạo" },
  { value: "CD", label: "Cánh diều" },
  { value: "NONE", label: "Chưa gắn bộ" },
];
const SUBJECTS: Opt[] = [
  { value: null, label: "Tất cả" },
  { value: "toan", label: "Toán" }, { value: "ngu_van", label: "Ngữ văn" },
  { value: "tieng_viet", label: "Tiếng Việt" }, { value: "khtn", label: "KHTN" },
  { value: "lich_su", label: "Lịch sử" }, { value: "dia_li", label: "Địa lí" },
  { value: "gdcd", label: "GDCD" }, { value: "tieng_anh", label: "Tiếng Anh" },
  { value: "vat_li", label: "Vật lí" }, { value: "hoa_hoc", label: "Hóa học" },
  { value: "sinh_hoc", label: "Sinh học" }, { value: "lich_su_dia_li", label: "Lịch sử & Địa lí" },
  { value: "tnxh", label: "TNXH" },
];
const GRADES: Opt[] = [{ value: null, label: "Tất cả" }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => ({ value: String(g), label: `Lớp ${g}` }))];
const STATUSES: Opt[] = [
  { value: "prod", label: "Đang dùng" },
  { value: "demoted", label: "Bị loại" },
  { value: "all", label: "Tất cả" },
];

export function FilterSidebar({ filter, onChange }: Props) {
  const reset = () => onChange({ bo_sach: null, subject: null, grade: null, lesson_no: null, status: "prod" });
  return (
    <aside className="w-[240px] border-r border-border p-4 space-y-4 shrink-0">
      <h3 className="text-sm font-semibold text-muted">Bộ lọc</h3>
      <Select label="Bộ sách" value={filter.bo_sach} options={BOOKS}
        onChange={(v) => onChange({ ...filter, bo_sach: v, subject: null, grade: null, lesson_no: null })} />
      <Select label="Môn" value={filter.subject} options={SUBJECTS}
        onChange={(v) => onChange({ ...filter, subject: v, grade: null, lesson_no: null })} />
      <Select label="Lớp" value={filter.grade} options={GRADES}
        onChange={(v) => onChange({ ...filter, grade: v, lesson_no: null })} />
      <Select label="Trạng thái" value={filter.status} options={STATUSES}
        onChange={(v) => onChange({ ...filter, status: (v ?? "prod") as FilterState["status"] })} />
      <button onClick={reset}
        className="w-full text-sm text-muted hover:text-foreground py-2 border border-border rounded-md transition-colors">
        Xóa bộ lọc
      </button>
    </aside>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string | null; options: Opt[]; onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value ?? ""}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
