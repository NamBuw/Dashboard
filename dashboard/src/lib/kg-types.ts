// Browse levels — schema v3 (per-subject hierarchy)
//   chung:   L0_book → L1_subject → L2_grade
//   Toán:    → L3_lesson → L4_concept → L5_chunk
//   T.Việt:  → L3_lesson → L5_chunk
//   Văn:     → L4a_work → L4b_section (= chunks)
//   KHTN/Sử/Địa/GDCD: → L4_concept → L5_chunk
//   (L4_chunk giữ cho fallback môn không có concept/lesson)
export type BrowseLevel =
  | "L0_book" | "L1_subject" | "L2_grade"
  | "L3_lesson" | "L4_concept" | "L4a_work" | "L4b_section"
  | "L5_chunk" | "L4_chunk";

export interface BrowseItem {
  kind: BrowseLevel;
  id: string;          // book code / subject code / grade / lesson_no / concept_id / work / chunk uid
  label: string;       // display name
  count: number;       // child count or chunk count or char length
  meta?: {
    title?: string;
    lesson_no?: number;
    trang_no?: number;
    source_name?: string;
    has_vietjack?: boolean;
    production_ready?: boolean;
    // schema v3
    concept?: string;          // tên concept
    strand?: string;           // mạch kiến thức (Toán)
    work?: string;             // tác phẩm (Văn)
    section_type?: string;     // loại section (Văn/TV)
    variant?: string;          // biến thể (chi_tiet/sieu_ngan…)
    content_class?: string;
    reading_texts?: string[];  // TV: bài đọc
    sections?: string[];       // Văn: các section_type của 1 tác phẩm
    variants?: string[];       // Văn: các variant
    prereq?: string[];         // Toán: chuỗi tiên quyết
    is_chunk?: boolean;        // true → click mở ChunkDetailPanel thay vì drill
  };
}

export interface BreadcrumbCrumb {
  label: string;
  href: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;       // root | bo_sach | subject | grade | lesson | concept | work | section | chunk
  size?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  dashes?: boolean;    // PREREQ vẽ nét đứt
}

export interface BrowseResponse {
  cached: boolean;
  cachedAt: string;
  level: BrowseLevel;
  subject?: string | null;
  breadcrumb: BreadcrumbCrumb[];
  items: BrowseItem[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
}

export interface AnalyticsResponse {
  cached: boolean;
  cachedAt: string;
  totals: {
    total_kc: number;
    total_production_kc: number;
    lesson_no_coverage_pct: number;
    trang_no_coverage_pct: number;
    fulltext_indexes_online: string[];
    // schema v3
    concepts: number;
    works: number;
    covers_edges: number;
    concept_coverage_pct: number;
  };
  heatmap: {
    subjects: string[];
    grades: number[];
    cells: { subject: string; grade: number; count: number }[];
  };
  demoteReasons: { reason: string; count: number }[];
  boSachDistribution: { bo_sach: string; count: number }[];
  conceptsBySubject: { subject: string; concepts: number }[];
}
