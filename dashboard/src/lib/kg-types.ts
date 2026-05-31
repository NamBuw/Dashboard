export type BrowseLevel = "L0_book" | "L1_subject" | "L2_grade" | "L3_lesson" | "L4_chunk";

export interface BrowseItem {
  kind: BrowseLevel;
  id: string;          // e.g. "KNTT" hoặc "5" cho bài 5
  label: string;       // display name
  count: number;       // child count or chunk count
  meta?: {
    title?: string;
    lesson_no?: number;
    trang_no?: number;
    source_name?: string;
    has_vietjack?: boolean;
    production_ready?: boolean;
  };
}

export interface BreadcrumbCrumb {
  label: string;
  href: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;       // "root" | "bo_sach" | "subject" | "grade" | "lesson" | "chunk"
  size?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export interface BrowseResponse {
  cached: boolean;
  cachedAt: string;
  level: BrowseLevel;
  breadcrumb: BreadcrumbCrumb[];
  items: BrowseItem[];                              // for List view
  graph: { nodes: GraphNode[]; edges: GraphEdge[] }; // for Graph view (same scope)
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
  };
  heatmap: {
    subjects: string[];
    grades: number[];
    cells: { subject: string; grade: number; count: number }[];
  };
  demoteReasons: { reason: string; count: number }[];
  boSachDistribution: { bo_sach: string; count: number }[];
}
