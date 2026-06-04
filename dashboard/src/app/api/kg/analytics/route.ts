import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withReadSession } from "@/lib/neo4j";
import { getOrCompute, cacheKey } from "@/lib/kg-cache";

export const runtime = "nodejs";

interface Cell { subject: string; grade: number; count: number }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.is_superuser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bo_sach = req.nextUrl.searchParams.get("bo_sach") ?? "ALL";
  const key = cacheKey({ route: "analytics", bo_sach });

  try {
    const { value, cached, cachedAt } = await getOrCompute(key, 60_000, async () => {
      return await withReadSession(async (s) => {
        // Chạy TUẦN TỰ trên cùng 1 session — Neo4j session không cho phép nhiều
        // query đồng thời (Promise.all gây lỗi "open transaction").
        const totals = await s.run(`
            MATCH (k:KnowledgeChunk)
            WITH count(k) AS total_kc,
                 sum(CASE WHEN coalesce(k.production_ready,false)=true THEN 1 ELSE 0 END) AS total_prod,
                 sum(CASE WHEN k.lesson_no IS NOT NULL THEN 1 ELSE 0 END) AS with_lesson_no,
                 sum(CASE WHEN k.trang_no  IS NOT NULL THEN 1 ELSE 0 END) AS with_trang_no
            RETURN total_kc, total_prod, with_lesson_no, with_trang_no`);
        const heatmap = await s.run(`
            MATCH (k:KnowledgeChunk)
            WHERE coalesce(k.production_ready,false)=true
              AND ($bo_sach='ALL' OR k.bo_sach=$bo_sach OR ($bo_sach='NONE' AND k.bo_sach IS NULL))
            RETURN k.subject_code AS subject, toInteger(k.grade) AS grade, count(*) AS cnt
            ORDER BY subject, grade`, { bo_sach });
        const demote = await s.run(`
            MATCH (k:KnowledgeChunk) WHERE coalesce(k.production_ready,false)=false
            RETURN coalesce(k.demote_reason,'other') AS reason, count(*) AS cnt
            ORDER BY cnt DESC LIMIT 12`);
        const books = await s.run(`
            MATCH (k:KnowledgeChunk) WHERE coalesce(k.production_ready,false)=true
            RETURN coalesce(k.bo_sach,'NONE') AS bo_sach, count(*) AS cnt ORDER BY cnt DESC`);
        const ftIdx = await s.run(`SHOW INDEXES YIELD name, type, state WHERE type='FULLTEXT' AND state='ONLINE' RETURN collect(name) AS indexes`);
        // schema v3 metrics (tuần tự)
        const conceptCount = await s.run(`MATCH (c:Concept) RETURN count(c) AS n`);
        const workCount = await s.run(`MATCH (w:LiteraryWork) RETURN count(w) AS n`);
        const coversCount = await s.run(`MATCH (:KnowledgeChunk)-[:COVERS]->() RETURN count(*) AS n`);
        const conceptCov = await s.run(`MATCH (k:KnowledgeChunk) WHERE coalesce(k.production_ready,false)=true
          RETURN count(k) AS total, sum(CASE WHEN (k)-[:COVERS]->() THEN 1 ELSE 0 END) AS with_c`);
        const conceptsBySubj = await s.run(`MATCH (c:Concept) WHERE c.subject IS NOT NULL
          RETURN c.subject AS subject, count(*) AS concepts ORDER BY concepts DESC`);

        const t = totals.records[0];
        const total_kc = t.get("total_kc");
        const total_prod = t.get("total_prod");
        const with_lesson_no = t.get("with_lesson_no");
        const with_trang_no = t.get("with_trang_no");
        const cov = conceptCov.records[0];
        const cov_total = cov.get("total"); const cov_with = cov.get("with_c");

        const cells: Cell[] = heatmap.records.map((r) => ({
          subject: r.get("subject"), grade: r.get("grade"), count: r.get("cnt"),
        }));
        const subjects = [...new Set(cells.map((c) => c.subject))].sort();
        const grades = [...new Set(cells.map((c) => c.grade))].sort((a, b) => a - b);

        return {
          totals: {
            total_kc, total_production_kc: total_prod,
            lesson_no_coverage_pct: total_prod ? Math.round((with_lesson_no / total_prod) * 1000) / 10 : 0,
            trang_no_coverage_pct: total_prod ? Math.round((with_trang_no / total_prod) * 1000) / 10 : 0,
            fulltext_indexes_online: ftIdx.records[0].get("indexes"),
            concepts: conceptCount.records[0].get("n"),
            works: workCount.records[0].get("n"),
            covers_edges: coversCount.records[0].get("n"),
            concept_coverage_pct: cov_total ? Math.round((cov_with / cov_total) * 1000) / 10 : 0,
          },
          heatmap: { subjects, grades, cells },
          demoteReasons: demote.records.map((r) => ({ reason: r.get("reason"), count: r.get("cnt") })),
          boSachDistribution: books.records.map((r) => ({ bo_sach: r.get("bo_sach"), count: r.get("cnt") })),
          conceptsBySubject: conceptsBySubj.records.map((r) => ({ subject: r.get("subject"), concepts: r.get("concepts") })),
        };
      });
    });
    return NextResponse.json({ cached, cachedAt, ...value });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}
