import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withReadSession } from "@/lib/neo4j";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  try {
    const result = await withReadSession(async (s) => {
      const r = await s.run(`
        MATCH (k:KnowledgeChunk {uid: $uid})
        OPTIONAL MATCH (lg:LessonGuide)-[:HAS_CHUNK]->(k)
        RETURN k, lg.title AS parent_lesson_guide_title, lg.url AS parent_lesson_guide_url`,
        { uid });
      if (r.records.length === 0) return null;
      const k = r.records[0].get("k").properties;
      return {
        uid: k.uid, title: k.title, text: k.text,
        subject_code: k.subject_code, grade: k.grade, bo_sach: k.bo_sach,
        lesson_no: k.lesson_no, trang_no: k.trang_no,
        source_name: k.source_name, source_url: k.source_url,
        production_ready: k.production_ready, demote_reason: k.demote_reason,
        text_length: (k.text ?? "").length,
        parent_lesson_guide_title: r.records[0].get("parent_lesson_guide_title"),
        parent_lesson_guide_url: r.records[0].get("parent_lesson_guide_url"),
      };
    });
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}
