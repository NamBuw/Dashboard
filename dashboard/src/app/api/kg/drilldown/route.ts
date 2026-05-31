import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withReadSession } from "@/lib/neo4j";
import { getOrCompute, cacheKey } from "@/lib/kg-cache";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const subject = sp.get("subject");
  const grade = sp.get("grade");
  const bo_sach = sp.get("bo_sach") ?? "ALL";
  const limit = parseInt(sp.get("limit") ?? "20", 10);

  if (!subject || !grade) return NextResponse.json({ error: "Missing subject/grade" }, { status: 400 });

  const key = cacheKey({ route: "drilldown", subject, grade, bo_sach, limit });
  try {
    const { value, cached, cachedAt } = await getOrCompute(key, 60_000, async () => {
      return await withReadSession(async (s) => {
        const r = await s.run(`
          MATCH (k:KnowledgeChunk)
          WHERE coalesce(k.production_ready,false)=true
            AND k.subject_code=$subject
            AND toInteger(k.grade)=toInteger($grade)
            AND ($bo_sach='ALL' OR k.bo_sach=$bo_sach OR ($bo_sach='NONE' AND k.bo_sach IS NULL))
          RETURN k.uid AS uid, k.title AS title, k.lesson_no AS lesson_no, k.trang_no AS trang_no,
                 k.source_name AS source_name, k.source_url AS source_url,
                 size(coalesce(k.text,'')) AS text_length, k.production_ready AS production_ready
          ORDER BY (CASE WHEN k.source_name STARTS WITH 'vietjack' THEN 0 ELSE 1 END), k.lesson_no, k.trang_no
          LIMIT toInteger($limit)`,
          { subject, grade: parseInt(grade, 10), bo_sach, limit });
        return {
          cell: { subject, grade: parseInt(grade, 10), bo_sach },
          rows: r.records.map((rec) => ({
            uid: rec.get("uid"), title: rec.get("title"),
            lesson_no: rec.get("lesson_no"), trang_no: rec.get("trang_no"),
            source_name: rec.get("source_name"), source_url: rec.get("source_url"),
            text_length: rec.get("text_length"), production_ready: rec.get("production_ready"),
          })),
        };
      });
    });
    return NextResponse.json({ cached, cachedAt, ...value });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}
