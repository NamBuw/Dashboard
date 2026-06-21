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
  { value: "gdcd", label: "GDCD" }, { value: "vat_li", label: "Vật lí" },
  { value: "hoa_hoc", label: "Hóa học" }, { value: "sinh_hoc", label: "Sinh học" },
];
const GRADES: Opt[] = [{ value: null, label: "Tất cả" }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => ({ value: String(g), label: `Lớp ${g}` }))];
const STATUSES: Opt[] = [
  { value: "prod", label: "Đang dùng" }, { value: "demoted", label: "Bị loại" }, { value: "all", label: "Tất cả" },
];

// content_class theo môn (guide §2)
const CONTENT_CLASS: Record<string, Opt[]> = {
  toan: [{ value: "vietjack_lesson", label: "Bài giảng" }, { value: "vietjack_exercise", label: "Bài tập" }, { value: "lgh_qa", label: "Hỏi đáp" }],
  tieng_viet: [{ value: "tv_lesson", label: "Bài học" }, { value: "tv_vbt", label: "Vở bài tập" }, { value: "tv_assessment", label: "Đánh giá" }],
  lich_su: [{ value: "vietjack_lesson", label: "Bài giảng" }, { value: "lgh_solution", label: "Lời giải" }, { value: "lgh_qa", label: "Hỏi đáp" }],
  dia_li: [{ value: "vietjack_lesson", label: "Bài giảng" }, { value: "lgh_solution", label: "Lời giải" }, { value: "lgh_qa", label: "Hỏi đáp" }],
  gdcd: [{ value: "vietjack_lesson", label: "Bài giảng" }, { value: "lgh_solution", label: "Lời giải" }, { value: "lgh_qa", label: "Hỏi đáp" }],
  khtn: ["lesson", "exercise", "quiz", "exam", "qa_fragment", "index", "other"].map((v) => ({ value: v, label: v })),
};
const CC_LABEL: Record<string, string> = { lesson: "Bài học", exercise: "Bài tập", quiz: "Trắc nghiệm", exam: "Kiểm tra", qa_fragment: "Hỏi đáp", index: "Mục lục", other: "Khác" };

export function FilterSidebar({ filter, onChange }: Props) {
  const reset = () => onChange({ bo_sach: null, subject: null, grade: null, lesson_no: null, concept_id: null, work: null, content_class: null, status: "prod" });
  const ccOpts = filter.subject ? CONTENT_CLASS[filter.subject] : undefined;
  return (
    <aside className="w-full lg:w-[240px] border-b lg:border-b-0 lg:border-r border-border p-4 space-y-4 shrink-0">
      <h3 className="text-sm font-semibold text-muted">Bộ lọc</h3>
      <Select label="Bộ sách" value={filter.bo_sach} options={BOOKS}
        onChange={(v) => onChange({ ...filter, bo_sach: v, subject: null, grade: null, lesson_no: null, concept_id: null, work: null, content_class: null })} />
      <Select label="Môn" value={filter.subject} options={SUBJECTS}
        onChange={(v) => onChange({ ...filter, subject: v, grade: null, lesson_no: null, concept_id: null, work: null, content_class: null })} />
      <Select label="Lớp" value={filter.grade} options={GRADES}
        onChange={(v) => onChange({ ...filter, grade: v, lesson_no: null, concept_id: null, work: null })} />
      {ccOpts && (
        <Select label="Loại nội dung" value={filter.content_class}
          options={[{ value: null, label: "Tất cả" }, ...ccOpts.map((o) => ({ value: o.value, label: CC_LABEL[o.value as string] ?? o.label }))]}
          onChange={(v) => onChange({ ...filter, content_class: v })} />
      )}
      <Select label="Trạng thái" value={filter.status} options={STATUSES}
        onChange={(v) => onChange({ ...filter, status: (v ?? "prod") as FilterState["status"] })} />
      <button onClick={reset} className="w-full text-sm text-muted hover:text-foreground py-2 border border-border rounded-md transition-colors">
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
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground">
        {options.map((o) => (<option key={String(o.value)} value={o.value ?? ""}>{o.label}</option>))}
      </select>
    </div>
  );
}
