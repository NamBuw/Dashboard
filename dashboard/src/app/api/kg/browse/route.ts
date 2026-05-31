import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withReadSession } from "@/lib/neo4j";
import { getOrCompute, cacheKey } from "@/lib/kg-cache";
import type { Session } from "neo4j-driver";
import type { BrowseLevel, BrowseResponse, BrowseItem, GraphNode, GraphEdge, BreadcrumbCrumb } from "@/lib/kg-types";

export const runtime = "nodejs";

interface BrowseParams {
  bo_sach: string | null;
  subject: string | null;
  grade: string | null;
  lesson: string | null;
  status: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  toan: "Toán", ngu_van: "Ngữ văn", khtn: "KHTN", tieng_viet: "Tiếng Việt",
  lich_su: "Lịch sử", dia_li: "Địa lí", gdcd: "GDCD", tieng_anh: "Tiếng Anh",
  vat_li: "Vật lí", hoa_hoc: "Hóa học", sinh_hoc: "Sinh học",
  lich_su_dia_li: "Lịch sử & Địa lí", tnxh: "TNXH",
};
const BOOK_LABELS: Record<string, string> = {
  KNTT: "Kết nối tri thức", CTST: "Chân trời sáng tạo", CD: "Cánh diều", NONE: "Chưa gắn bộ",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const bo_sach = sp.get("bo_sach");
  const subject = sp.get("subject");
  const grade = sp.get("grade");
  const lesson = sp.get("lesson_no");
  const status = sp.get("status") ?? "prod";

  let level: BrowseLevel = "L0_book";
  if (bo_sach && subject && grade && lesson) level = "L4_chunk";
  else if (bo_sach && subject && grade) level = "L3_lesson";
  else if (bo_sach && subject) level = "L2_grade";
  else if (bo_sach) level = "L1_subject";

  const key = cacheKey({ level, bo_sach, subject, grade, lesson, status });

  try {
    const { value, cached, cachedAt } = await getOrCompute(key, 60_000, async () => {
      return await withReadSession(async (s) => {
        const params: BrowseParams = { bo_sach, subject, grade, lesson, status };
        const items = await queryItems(s, level, params);
        const graph = itemsToGraph(level, items, params);
        const breadcrumb = buildBreadcrumb(params);
        return { level, items, graph, breadcrumb };
      });
    });
    return NextResponse.json({ cached, cachedAt, ...value } satisfies BrowseResponse);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}

// ====================================================================
// queryItems — Cypher per level
// ====================================================================
async function queryItems(s: Session, level: BrowseLevel, p: BrowseParams): Promise<BrowseItem[]> {
  if (level === "L0_book") {
    const q = `
      MATCH (k:KnowledgeChunk)
      WHERE ($status='all')
         OR ($status='prod' AND coalesce(k.production_ready,false)=true)
         OR ($status='demoted' AND coalesce(k.production_ready,false)=false)
      RETURN coalesce(k.bo_sach,'NONE') AS id, count(*) AS cnt
      ORDER BY cnt DESC`;
    const r = await s.run(q, { status: p.status });
    return r.records.map((rec) => ({
      kind: "L0_book" as const,
      id: rec.get("id"),
      label: BOOK_LABELS[rec.get("id") as string] ?? rec.get("id"),
      count: rec.get("cnt"),
    }));
  }
  if (level === "L1_subject") {
    const q = `
      MATCH (k:KnowledgeChunk)
      WHERE (($bo_sach='NONE' AND k.bo_sach IS NULL) OR k.bo_sach=$bo_sach)
        AND coalesce(k.production_ready,false)=true
      RETURN k.subject_code AS id, count(*) AS cnt,
             sum(CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 1 ELSE 0 END) > 0 AS has_vietjack
      ORDER BY cnt DESC`;
    const r = await s.run(q, { bo_sach: p.bo_sach });
    return r.records.map((rec) => ({
      kind: "L1_subject" as const,
      id: rec.get("id"),
      label: SUBJECT_LABELS[rec.get("id") as string] ?? rec.get("id"),
      count: rec.get("cnt"),
      meta: { has_vietjack: rec.get("has_vietjack") },
    }));
  }
  if (level === "L2_grade") {
    const q = `
      MATCH (k:KnowledgeChunk)
      WHERE (($bo_sach='NONE' AND k.bo_sach IS NULL) OR k.bo_sach=$bo_sach)
        AND k.subject_code=$subject
        AND coalesce(k.production_ready,false)=true
      RETURN toInteger(k.grade) AS id, count(*) AS cnt
      ORDER BY id`;
    const r = await s.run(q, { bo_sach: p.bo_sach, subject: p.subject });
    return r.records.map((rec) => ({
      kind: "L2_grade" as const,
      id: String(rec.get("id")),
      label: `Lớp ${rec.get("id")}`,
      count: rec.get("cnt"),
    }));
  }
  if (level === "L3_lesson") {
    const q = `
      MATCH (k:KnowledgeChunk)
      WHERE (($bo_sach='NONE' AND k.bo_sach IS NULL) OR k.bo_sach=$bo_sach)
        AND k.subject_code=$subject
        AND toInteger(k.grade)=toInteger($grade)
        AND coalesce(k.production_ready,false)=true
        AND k.lesson_no IS NOT NULL
      WITH k.lesson_no AS lesson_no,
           collect(DISTINCT k.title)[..1] AS sample_title,
           count(*) AS chunk_count,
           sum(CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 1 ELSE 0 END) > 0 AS has_vietjack
      RETURN lesson_no, sample_title[0] AS title, chunk_count, has_vietjack
      ORDER BY lesson_no`;
    const r = await s.run(q, { bo_sach: p.bo_sach, subject: p.subject, grade: parseInt(p.grade as string, 10) });
    return r.records.map((rec) => ({
      kind: "L3_lesson" as const,
      id: String(rec.get("lesson_no")),
      label: `Bài ${rec.get("lesson_no")}`,
      count: rec.get("chunk_count"),
      meta: { title: rec.get("title"), lesson_no: rec.get("lesson_no"), has_vietjack: rec.get("has_vietjack") },
    }));
  }
  // L4_chunk
  const q = `
    MATCH (k:KnowledgeChunk)
    WHERE (($bo_sach='NONE' AND k.bo_sach IS NULL) OR k.bo_sach=$bo_sach)
      AND k.subject_code=$subject
      AND toInteger(k.grade)=toInteger($grade)
      AND k.lesson_no=toInteger($lesson_no)
      AND coalesce(k.production_ready,false)=true
    OPTIONAL MATCH (lg:LessonGuide)-[:HAS_CHUNK]->(k)
    RETURN k.uid AS uid, k.title AS title, k.trang_no AS trang_no,
           k.source_name AS source_name, k.source_url AS source_url,
           size(coalesce(k.text,'')) AS text_length,
           substring(coalesce(k.text,''), 0, 300) AS text_preview,
           lg.title AS parent_lesson_guide
    ORDER BY (CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 0 ELSE 1 END)`;
  const r = await s.run(q, {
    bo_sach: p.bo_sach, subject: p.subject,
    grade: parseInt(p.grade as string, 10), lesson_no: parseInt(p.lesson as string, 10),
  });
  return r.records.map((rec) => ({
    kind: "L4_chunk" as const,
    id: rec.get("uid"),
    label: (rec.get("title") as string)?.slice(0, 80) ?? rec.get("uid"),
    count: rec.get("text_length"),
    meta: {
      title: rec.get("title"),
      trang_no: rec.get("trang_no"),
      source_name: rec.get("source_name"),
    },
  }));
}

// ====================================================================
// itemsToGraph — server-side build vis-network nodes/edges
// ====================================================================
function itemsToGraph(level: BrowseLevel, items: BrowseItem[], parent: BrowseParams): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const rootId = makeRootId(parent);
  const rootLabel = makeRootLabel(parent, level);
  const childGroup = childGroupForLevel(level);

  const nodes: GraphNode[] = [{ id: rootId, label: rootLabel, group: "root", size: 25 }];
  const edges: GraphEdge[] = [];
  for (const it of items) {
    const id = `${rootId}/${it.id}`;
    nodes.push({
      id, label: `${it.label} (${it.count})`,
      group: childGroup, size: Math.min(8 + Math.log2(it.count + 1) * 2, 20),
    });
    edges.push({ from: rootId, to: id });
  }
  return { nodes, edges };
}

function makeRootId(p: BrowseParams): string {
  const parts: string[] = ["root"];
  if (p.bo_sach) parts.push(p.bo_sach);
  if (p.subject) parts.push(p.subject);
  if (p.grade) parts.push(p.grade);
  if (p.lesson) parts.push(p.lesson);
  return parts.join("/");
}

function makeRootLabel(p: BrowseParams, level: BrowseLevel): string {
  if (level === "L0_book") return "Tất cả";
  if (level === "L1_subject") return BOOK_LABELS[p.bo_sach as string] ?? (p.bo_sach as string);
  if (level === "L2_grade") return `${BOOK_LABELS[p.bo_sach as string]} · ${SUBJECT_LABELS[p.subject as string]}`;
  if (level === "L3_lesson") return `${SUBJECT_LABELS[p.subject as string]} lớp ${p.grade}`;
  return `Bài ${p.lesson}`;
}

function childGroupForLevel(level: BrowseLevel): string {
  return ({ L0_book: "bo_sach", L1_subject: "subject", L2_grade: "grade", L3_lesson: "lesson", L4_chunk: "chunk" })[level];
}

function buildBreadcrumb(p: BrowseParams): BreadcrumbCrumb[] {
  const c: BreadcrumbCrumb[] = [{ label: "Tất cả", href: "/kg-browse" }];
  if (p.bo_sach) c.push({ label: BOOK_LABELS[p.bo_sach] ?? p.bo_sach, href: `/kg-browse?bo_sach=${p.bo_sach}` });
  if (p.subject) c.push({ label: SUBJECT_LABELS[p.subject] ?? p.subject, href: `/kg-browse?bo_sach=${p.bo_sach}&subject=${p.subject}` });
  if (p.grade) c.push({ label: `Lớp ${p.grade}`, href: `/kg-browse?bo_sach=${p.bo_sach}&subject=${p.subject}&grade=${p.grade}` });
  if (p.lesson) c.push({ label: `Bài ${p.lesson}`, href: `/kg-browse?bo_sach=${p.bo_sach}&subject=${p.subject}&grade=${p.grade}&lesson_no=${p.lesson}` });
  return c;
}
