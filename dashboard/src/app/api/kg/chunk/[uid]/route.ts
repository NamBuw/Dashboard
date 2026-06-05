import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withReadSession } from "@/lib/neo4j";

export const runtime = "nodejs";

// Bỏ tên/link nguồn khỏi text hiển thị (giữ nguyên kiến thức, chỉ xoá token nguồn)
function sanitize(t: string | null | undefined): string {
  if (!t) return "";
  return t
    .replace(/(https?:\/\/)?(www\.)?(vietjack|loigiaihay)\.(com|vn)\S*/gi, "") // URL nguồn
    .replace(/vietjack/gi, "")
    .replace(/loigiaihay/gi, "")
    .replace(/[ \t]{2,}/g, " ")   // gộp khoảng trắng dư
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  try {
    const result = await withReadSession(async (s) => {
      // Bản đọc nguyên văn (LiteratureText) — uid dạng "recite:<work>"
      if (uid.startsWith("recite:")) {
        const work = uid.slice("recite:".length);
        const rr = await s.run(`
          MATCH (lt:LiteratureText)-[:VERBATIM_OF]->(w:LiteraryWork {name:$work})
          RETURN lt.title AS title, lt.full_text AS text, lt.grade AS grade ORDER BY lt.title LIMIT 1`,
          { work });
        if (rr.records.length === 0) return null;
        const rec0 = rr.records[0];
        return {
          uid, title: `📜 ${rec0.get("title") ?? work}`, text: sanitize(rec0.get("text")),
          grade: rec0.get("grade"), work,
          text_length: (rec0.get("text") ?? "").length,
        };
      }
      const r = await s.run(`
        MATCH (k:KnowledgeChunk {uid: $uid})
        OPTIONAL MATCH (lg:LessonGuide)-[:HAS_CHUNK]->(k)
        OPTIONAL MATCH (k)-[:COVERS]->(c:Concept)
        OPTIONAL MATCH (k)-[:ABOUT_WORK]->(w:LiteraryWork)
        RETURN k, lg.title AS parent_lesson_guide_title, lg.url AS parent_lesson_guide_url,
               collect(DISTINCT c.name) AS concepts, w.name AS work`,
        { uid });
      if (r.records.length === 0) return null;
      const rec = r.records[0];
      const k = rec.get("k").properties;
      return {
        uid: k.uid, title: k.title, text: sanitize(k.text),
        subject_code: k.subject_code, grade: k.grade, bo_sach: k.bo_sach,
        lesson_no: k.lesson_no, trang_no: k.trang_no,
        source_name: k.source_name, source_url: k.source_url,
        production_ready: k.production_ready, demote_reason: k.demote_reason,
        content_class: k.content_class, section_type: k.section_type, variant: k.variant,
        concepts: (rec.get("concepts") as string[] | null)?.filter(Boolean) ?? [],
        work: rec.get("work"),
        text_length: (k.text ?? "").length,
        parent_lesson_guide_title: rec.get("parent_lesson_guide_title"),
        parent_lesson_guide_url: rec.get("parent_lesson_guide_url"),
      };
    });
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}
