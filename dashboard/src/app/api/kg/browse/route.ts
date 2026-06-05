import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withReadSession } from "@/lib/neo4j";
import { getOrCompute, cacheKey } from "@/lib/kg-cache";
import type { Session } from "neo4j-driver";
import type { BrowseLevel, BrowseResponse, BrowseItem, GraphNode, GraphEdge, BreadcrumbCrumb } from "@/lib/kg-types";

export const runtime = "nodejs";

interface P {
  bo_sach: string | null;
  subject: string | null;
  grade: string | null;
  lesson: string | null;
  concept_id: string | null;
  work: string | null;
  content_class: string | null;
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
const CONCEPT_SUBJECTS = new Set(["khtn", "lich_su", "dia_li", "gdcd", "vat_li", "hoa_hoc", "sinh_hoc"]);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const p: P = {
    bo_sach: sp.get("bo_sach"),
    subject: sp.get("subject"),
    grade: sp.get("grade"),
    lesson: sp.get("lesson_no"),
    concept_id: sp.get("concept_id"),
    work: sp.get("work"),
    content_class: sp.get("content_class"),
    status: sp.get("status") ?? "prod",
  };
  const level = detectLevel(p);
  const key = cacheKey({ level, ...p });

  try {
    const { value, cached, cachedAt } = await getOrCompute(key, 60_000, async () => {
      return await withReadSession(async (s) => {
        const items = await queryItems(s, level, p);
        const graph = await itemsToGraph(s, level, items, p);
        const breadcrumb = buildBreadcrumb(p);
        return { level, subject: p.subject, items, graph, breadcrumb };
      });
    });
    return NextResponse.json({ cached, cachedAt, ...value } satisfies BrowseResponse);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}

// ── level detection: sau Lớp thì rẽ theo môn ──────────────────────────
function detectLevel(p: P): BrowseLevel {
  if (!p.bo_sach) return "L0_book";
  if (!p.subject) return "L1_subject";
  if (!p.grade) return "L2_grade";
  if (p.subject === "ngu_van") return p.work ? "L4b_section" : "L4a_work";
  if (p.subject === "toan") {
    if (p.concept_id) return "L5_chunk";
    if (p.lesson) return "L4_concept";
    return "L3_lesson";
  }
  if (p.subject === "tieng_viet") return p.lesson ? "L5_chunk" : "L3_lesson";
  if (CONCEPT_SUBJECTS.has(p.subject)) return p.concept_id ? "L5_chunk" : "L4_concept";
  return "L4_chunk"; // fallback
}

// gradeWhere / bookWhere dùng chung
const BOOK = "(($bo_sach='NONE' AND k.bo_sach IS NULL) OR k.bo_sach=$bo_sach)";
const GRADE = "toInteger(k.grade)=toInteger($grade)";
const CC = "($content_class IS NULL OR k.content_class=$content_class)";

async function queryItems(s: Session, level: BrowseLevel, p: P): Promise<BrowseItem[]> {
  // ── L0: Bộ sách ──
  if (level === "L0_book") {
    const r = await s.run(`
      MATCH (k:KnowledgeChunk)
      WHERE ($status='all') OR ($status='prod' AND coalesce(k.production_ready,false)=true)
         OR ($status='demoted' AND coalesce(k.production_ready,false)=false)
      RETURN coalesce(k.bo_sach,'NONE') AS id, count(*) AS cnt ORDER BY cnt DESC`, { status: p.status });
    return r.records.map((rec) => ({
      kind: "L0_book" as const, id: rec.get("id"),
      label: BOOK_LABELS[rec.get("id") as string] ?? rec.get("id"), count: rec.get("cnt"),
    }));
  }
  // ── L1: Môn ──
  if (level === "L1_subject") {
    const r = await s.run(`
      MATCH (k:KnowledgeChunk) WHERE ${BOOK} AND coalesce(k.production_ready,false)=true
      RETURN k.subject_code AS id, count(*) AS cnt ORDER BY cnt DESC`, { bo_sach: p.bo_sach });
    return r.records.map((rec) => ({
      kind: "L1_subject" as const, id: rec.get("id"),
      label: SUBJECT_LABELS[rec.get("id") as string] ?? rec.get("id"), count: rec.get("cnt"),
    }));
  }
  // ── L2: Lớp ──
  if (level === "L2_grade") {
    const r = await s.run(`
      MATCH (k:KnowledgeChunk)
      WHERE ${BOOK} AND k.subject_code=$subject AND coalesce(k.production_ready,false)=true
      RETURN toInteger(k.grade) AS id, count(*) AS cnt ORDER BY id`, { bo_sach: p.bo_sach, subject: p.subject });
    return r.records.map((rec) => ({
      kind: "L2_grade" as const, id: String(rec.get("id")),
      label: `Lớp ${rec.get("id")}`, count: rec.get("cnt"),
    }));
  }
  // ── L3: Bài (Toán + Tiếng Việt) ──
  if (level === "L3_lesson") {
    const r = await s.run(`
      MATCH (k:KnowledgeChunk)
      WHERE ${BOOK} AND k.subject_code=$subject AND ${GRADE} AND ${CC}
        AND coalesce(k.production_ready,false)=true AND k.lesson_no IS NOT NULL
      WITH k.lesson_no AS lesson_no, collect(DISTINCT k.title)[..1] AS st,
           collect(DISTINCT k.concept_name)[..3] AS reading_texts, count(*) AS chunks,
           sum(CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 1 ELSE 0 END) > 0 AS hv
      RETURN lesson_no, st[0] AS title, reading_texts, chunks, hv ORDER BY toInteger(lesson_no)`,
      { bo_sach: p.bo_sach, subject: p.subject, grade: parseInt(p.grade as string, 10), content_class: p.content_class });
    return r.records.map((rec) => ({
      kind: "L3_lesson" as const, id: String(rec.get("lesson_no")),
      label: `Bài ${rec.get("lesson_no")}`, count: rec.get("chunks"),
      meta: {
        title: rec.get("title"), lesson_no: rec.get("lesson_no"), has_vietjack: rec.get("hv"),
        reading_texts: (rec.get("reading_texts") as string[] | null)?.filter(Boolean) ?? [],
      },
    }));
  }
  // ── L4_concept: Concept (Toán dưới Bài; KHTN/Sử/Địa/GDCD dưới Lớp) ──
  if (level === "L4_concept") {
    const lessonFilter = p.subject === "toan" && p.lesson ? "AND k.lesson_no=toInteger($lesson)" : "";
    const r = await s.run(`
      MATCH (k:KnowledgeChunk)-[:COVERS]->(c:Concept)
      WHERE ${BOOK} AND k.subject_code=$subject AND ${GRADE} AND ${CC}
        AND coalesce(k.production_ready,false)=true ${lessonFilter}
      RETURN c.concept_id AS id, c.name AS concept, c.strand AS strand, count(k) AS chunks
      ORDER BY chunks DESC`,
      { bo_sach: p.bo_sach, subject: p.subject, grade: parseInt(p.grade as string, 10), lesson: p.lesson ? parseInt(p.lesson, 10) : null, content_class: p.content_class });
    return r.records.map((rec) => ({
      kind: "L4_concept" as const, id: rec.get("id"),
      label: rec.get("concept") ?? rec.get("id"), count: rec.get("chunks"),
      meta: { concept: rec.get("concept"), strand: rec.get("strand") },
    }));
  }
  // ── L4a_work: Tác phẩm (Văn) ──
  if (level === "L4a_work") {
    const r = await s.run(`
      MATCH (k:KnowledgeChunk)
      WHERE k.subject_code='ngu_van' AND ${BOOK} AND ${GRADE}
        AND coalesce(k.production_ready,false)=true AND k.work_name IS NOT NULL
      RETURN k.work_name AS work, count(*) AS chunks,
             collect(DISTINCT k.section_type) AS sections, collect(DISTINCT k.variant) AS variants
      ORDER BY work`,
      { bo_sach: p.bo_sach, grade: parseInt(p.grade as string, 10) });
    const recite = await s.run(`MATCH (:LiteratureText)-[:VERBATIM_OF]->(w:LiteraryWork) RETURN collect(DISTINCT w.name) AS works`);
    const reciteSet = new Set((recite.records[0]?.get("works") as string[] | null) ?? []);
    return r.records.map((rec) => ({
      kind: "L4a_work" as const, id: rec.get("work"),
      label: rec.get("work"), count: rec.get("chunks"),
      meta: {
        work: rec.get("work"),
        sections: (rec.get("sections") as string[] | null)?.filter(Boolean) ?? [],
        variants: (rec.get("variants") as string[] | null)?.filter(Boolean) ?? [],
        has_recitation: reciteSet.has(rec.get("work")),
      },
    }));
  }
  // ── L4b_section: Section × Variant của 1 tác phẩm (= chunks) ──
  if (level === "L4b_section") {
    const r = await s.run(`
      MATCH (k:KnowledgeChunk)
      WHERE k.subject_code='ngu_van' AND ${BOOK} AND ${GRADE}
        AND coalesce(k.production_ready,false)=true AND k.work_name=$work
      RETURN k.uid AS uid, k.title AS title, k.section_type AS section, k.variant AS variant,
             size(coalesce(k.text,'')) AS len
      ORDER BY section, variant`,
      { bo_sach: p.bo_sach, grade: parseInt(p.grade as string, 10), work: p.work });
    const items: BrowseItem[] = r.records.map((rec) => ({
      kind: "L4b_section" as const, id: rec.get("uid"),
      label: rec.get("title") ?? rec.get("uid"), count: rec.get("len"),
      meta: { title: rec.get("title"), section_type: rec.get("section"), variant: rec.get("variant"), is_chunk: true },
    }));
    // prepend bản đọc nguyên văn nếu có (VERBATIM_OF)
    const lt = await s.run(`MATCH (lt:LiteratureText)-[:VERBATIM_OF]->(w:LiteraryWork {name:$work})
      RETURN lt.title AS title LIMIT 1`, { work: p.work });
    if (lt.records.length) {
      items.unshift({
        kind: "L4b_section", id: `recite:${p.work}`, label: "📜 Đọc nguyên văn", count: 0,
        meta: { is_chunk: true, recitation: true, title: `📜 Đọc nguyên văn: ${lt.records[0].get("title") ?? p.work}` },
      });
    }
    return items;
  }
  // ── L5_chunk: Chunks dưới Concept (Toán/KHTN/Sử/Địa/GDCD) hoặc dưới Bài (TV) ──
  if (level === "L5_chunk") {
    let r;
    if (p.subject === "tieng_viet") {
      r = await s.run(`
        MATCH (k:KnowledgeChunk)
        WHERE k.subject_code='tieng_viet' AND ${BOOK} AND ${GRADE} AND ${CC}
          AND coalesce(k.production_ready,false)=true AND k.lesson_no=toInteger($lesson)
        RETURN k.uid AS uid, k.title AS title, k.trang_no AS trang_no, k.source_name AS sn,
               k.content_class AS cc, size(coalesce(k.text,'')) AS len ORDER BY k.trang_no`,
        { bo_sach: p.bo_sach, grade: parseInt(p.grade as string, 10), lesson: parseInt(p.lesson as string, 10), content_class: p.content_class });
    } else {
      r = await s.run(`
        MATCH (k:KnowledgeChunk)-[:COVERS]->(c:Concept {concept_id:$concept_id})
        WHERE ${BOOK} AND k.subject_code=$subject AND ${GRADE} AND ${CC} AND coalesce(k.production_ready,false)=true
        RETURN k.uid AS uid, k.title AS title, k.trang_no AS trang_no, k.source_name AS sn,
               k.content_class AS cc, size(coalesce(k.text,'')) AS len
        ORDER BY (CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 0 ELSE 1 END)`,
        { bo_sach: p.bo_sach, subject: p.subject, grade: parseInt(p.grade as string, 10), concept_id: p.concept_id, content_class: p.content_class });
    }
    return r.records.map((rec) => ({
      kind: "L5_chunk" as const, id: rec.get("uid"),
      label: (rec.get("title") as string)?.slice(0, 80) ?? rec.get("uid"), count: rec.get("len"),
      meta: { title: rec.get("title"), trang_no: rec.get("trang_no"), source_name: rec.get("sn"), content_class: rec.get("cc"), is_chunk: true },
    }));
  }
  // ── L4_chunk fallback: chunks trực tiếp (môn không concept/lesson) ──
  const r = await s.run(`
    MATCH (k:KnowledgeChunk)
    WHERE ${BOOK} AND k.subject_code=$subject AND ${GRADE} AND ${CC} AND coalesce(k.production_ready,false)=true
    RETURN k.uid AS uid, k.title AS title, k.trang_no AS trang_no, k.source_name AS sn,
           k.content_class AS cc, size(coalesce(k.text,'')) AS len
    ORDER BY (CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 0 ELSE 1 END) LIMIT 300`,
    { bo_sach: p.bo_sach, subject: p.subject, grade: parseInt(p.grade as string, 10), content_class: p.content_class });
  return r.records.map((rec) => ({
    kind: "L4_chunk" as const, id: rec.get("uid"),
    label: (rec.get("title") as string)?.slice(0, 80) ?? rec.get("uid"), count: rec.get("len"),
    meta: { title: rec.get("title"), trang_no: rec.get("trang_no"), source_name: rec.get("sn"), content_class: rec.get("cc"), is_chunk: true },
  }));
}

// ── Graph: root + children; Toán concept-level thêm PREREQ (nét đứt) ──
async function itemsToGraph(s: Session, level: BrowseLevel, items: BrowseItem[], p: P): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const rootId = makeRootId(p);
  const childGroup = childGroupForLevel(level);
  const nodes: GraphNode[] = [{ id: rootId, label: makeRootLabel(p, level), group: "root", size: 25 }];
  const edges: GraphEdge[] = [];
  const idToNode = new Map<string, string>();
  for (const it of items) {
    const nid = `${rootId}/${it.id}`;
    idToNode.set(it.id, nid);
    nodes.push({ id: nid, label: `${it.label}${it.meta?.is_chunk ? "" : ` (${it.count})`}`, group: childGroup, size: Math.min(8 + Math.log2(it.count + 1) * 2, 20) });
    edges.push({ from: rootId, to: nid, label: level === "L4_concept" ? "COVERS" : undefined });
  }
  // PREREQ giữa các concept Toán đang hiển thị
  if (level === "L4_concept" && p.subject === "toan" && items.length > 1) {
    try {
      const ids = items.map((i) => i.id);
      const r = await s.run(`
        MATCH (a:Concept)-[:PREREQ]->(b:Concept)
        WHERE a.concept_id IN $ids AND b.concept_id IN $ids
        RETURN a.concept_id AS from, b.concept_id AS to`, { ids });
      for (const rec of r.records) {
        const f = idToNode.get(rec.get("from")), t = idToNode.get(rec.get("to"));
        if (f && t) edges.push({ from: f, to: t, label: "PREREQ", dashes: true });
      }
    } catch { /* PREREQ optional */ }
  }
  return { nodes, edges };
}

function makeRootId(p: P): string {
  const parts = ["root"];
  for (const v of [p.bo_sach, p.subject, p.grade, p.lesson, p.concept_id, p.work]) if (v) parts.push(v);
  return parts.join("/");
}
function makeRootLabel(p: P, level: BrowseLevel): string {
  if (level === "L0_book") return "Tất cả";
  if (level === "L1_subject") return BOOK_LABELS[p.bo_sach as string] ?? (p.bo_sach as string);
  if (level === "L2_grade") return `${BOOK_LABELS[p.bo_sach as string]} · ${SUBJECT_LABELS[p.subject as string]}`;
  if (p.work) return p.work;
  if (p.concept_id) return "Concept";
  if (p.lesson) return `Bài ${p.lesson}`;
  return `${SUBJECT_LABELS[p.subject as string] ?? p.subject} lớp ${p.grade}`;
}
function childGroupForLevel(level: BrowseLevel): string {
  return ({
    L0_book: "bo_sach", L1_subject: "subject", L2_grade: "grade", L3_lesson: "lesson",
    L4_concept: "concept", L4a_work: "work", L4b_section: "section", L5_chunk: "chunk", L4_chunk: "chunk",
  } as Record<BrowseLevel, string>)[level];
}

function buildBreadcrumb(p: P): BreadcrumbCrumb[] {
  const base = "/kg-browse";
  const c: BreadcrumbCrumb[] = [{ label: "Tất cả", href: base }];
  const qs: string[] = [];
  if (p.bo_sach) { qs.push(`bo_sach=${encodeURIComponent(p.bo_sach)}`); c.push({ label: BOOK_LABELS[p.bo_sach] ?? p.bo_sach, href: `${base}?${qs.join("&")}` }); }
  if (p.subject) { qs.push(`subject=${encodeURIComponent(p.subject)}`); c.push({ label: SUBJECT_LABELS[p.subject] ?? p.subject, href: `${base}?${qs.join("&")}` }); }
  if (p.grade) { qs.push(`grade=${encodeURIComponent(p.grade)}`); c.push({ label: `Lớp ${p.grade}`, href: `${base}?${qs.join("&")}` }); }
  if (p.lesson) { qs.push(`lesson_no=${encodeURIComponent(p.lesson)}`); c.push({ label: `Bài ${p.lesson}`, href: `${base}?${qs.join("&")}` }); }
  if (p.work) { qs.push(`work=${encodeURIComponent(p.work)}`); c.push({ label: p.work, href: `${base}?${qs.join("&")}` }); }
  if (p.concept_id) { qs.push(`concept_id=${encodeURIComponent(p.concept_id)}`); c.push({ label: "Concept", href: `${base}?${qs.join("&")}` }); }
  return c;
}
