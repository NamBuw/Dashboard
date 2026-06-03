import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

const RAG_SERVER_URL = process.env.RAG_SERVER_URL || "http://171.226.10.121:8888";

/**
 * Mobile (Bearer) banned-topics CRUD — mirrors /api/banned-topics but authenticates with
 * an Authentik JWT. Used by the P-Connect app. A topic is Gemma-expanded into banned_words
 * rows (enforced unchanged by CloudPTalk moderation.py).
 */

interface TopicRow {
  id: string;
  topic: string;
  description: string | null;
  set_by: string | null;
  set_by_role: string;
  parent_user_id: string | null;
  is_active: boolean;
  created_at: string;
  set_by_name?: string | null;
}
interface WordRow {
  id: string;
  word: string;
  category: string;
  is_active: boolean;
  topic_id: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get("parent_only") === "true";

    const topics: TopicRow[] =
      user.is_superuser && !parentOnly
        ? await query<TopicRow>(
            `SELECT bt.*, u.display_name as set_by_name
             FROM banned_topics bt LEFT JOIN users u ON bt.set_by = u.id
             ORDER BY bt.created_at DESC`
          )
        : await query<TopicRow>(
            `SELECT bt.*, u.display_name as set_by_name
             FROM banned_topics bt LEFT JOIN users u ON bt.set_by = u.id
             WHERE bt.set_by = $1 OR bt.parent_user_id = $1
             ORDER BY bt.created_at DESC`,
            [user.id]
          );

    const ids = topics.map((t) => t.id);
    let words: WordRow[] = [];
    if (ids.length > 0) {
      words = await query<WordRow>(
        `SELECT id, word, category, is_active, topic_id FROM banned_words
         WHERE topic_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
        [ids]
      );
    }
    const byTopic = new Map<string, WordRow[]>();
    for (const w of words) {
      if (!w.topic_id) continue;
      const list = byTopic.get(w.topic_id) ?? [];
      list.push(w);
      byTopic.set(w.topic_id, list);
    }

    return NextResponse.json({
      topics: topics.map((t) => ({ ...t, words: byTopic.get(t.id) ?? [] })),
    });
  } catch (error) {
    console.error("v1 banned-topics GET error:", error);
    return NextResponse.json({ error: "Failed to load banned topics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const { topic, category, setByRole, parentUserId } = await request.json();
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });
    }
    const topicText = topic.trim();
    const role = user.is_superuser && setByRole === "admin" ? "admin" : "parent";
    const parentId = role === "admin" ? null : (parentUserId || user.id);

    if (role === "parent" && parentId !== user.id) {
      const [dev] = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM devices WHERE owner_id = $1 AND assigned_user_id = $2`,
        [user.id, parentId]
      );
      if (!dev || Number(dev.count) === 0) {
        return NextResponse.json(
          { error: "Forbidden - You can only set banned topics for your own children" },
          { status: 403 }
        );
      }
    }

    let suggestedWords: string[] = [];
    let description = "";
    if (action === "suggest") {
      try {
        const res = await fetch(`${RAG_SERVER_URL}/v2/moderation/expand-topic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topicText, max_words: 5 }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const data = await res.json();
          description = data.description || "";
          suggestedWords = Array.isArray(data.words) ? data.words : [];
        }
      } catch (e) {
        console.error("v1 expand-topic call failed (continuing):", e);
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let topicId: string;
      try {
        const ins = await client.query(
          `INSERT INTO banned_topics (topic, description, set_by, set_by_role, parent_user_id)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [topicText, description || null, user.id, role, parentId]
        );
        topicId = ins.rows[0].id;
      } catch (e: unknown) {
        await client.query("ROLLBACK");
        if ((e as { code?: string })?.code === "23505") {
          return NextResponse.json({ error: "Chủ đề này đã tồn tại" }, { status: 409 });
        }
        throw e;
      }
      for (const raw of suggestedWords) {
        const w = String(raw).trim().toLowerCase();
        if (!w) continue;
        await client.query(
          `INSERT INTO banned_words (word, category, set_by, set_by_role, parent_user_id, topic_id)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [w, category || "general", user.id, role, parentId, topicId]
        );
      }
      await client.query("COMMIT");

      const [topicRow] = await query<TopicRow>(`SELECT * FROM banned_topics WHERE id = $1`, [topicId]);
      const wordsRows = await query<WordRow>(
        `SELECT id, word, category, is_active, topic_id FROM banned_words WHERE topic_id = $1 ORDER BY created_at ASC`,
        [topicId]
      );
      return NextResponse.json({ topic: topicRow, words: wordsRows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("v1 banned-topics POST error:", error);
    return NextResponse.json({ error: "Failed to create banned topic" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (is_active === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [topic] = await query<{ id: string; set_by: string }>(
      `SELECT id, set_by FROM banned_topics WHERE id = $1`,
      [id]
    );
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    if (!user.is_superuser && topic.set_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query(`UPDATE banned_topics SET is_active = $2 WHERE id = $1`, [id, is_active]);
    await query(`UPDATE banned_words SET is_active = $2 WHERE topic_id = $1`, [id, is_active]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("v1 banned-topics PUT error:", error);
    return NextResponse.json({ error: "Failed to update banned topic" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const words = searchParams.get("words") || "cascade";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const [topic] = await query<{ id: string; set_by: string }>(
      `SELECT id, set_by FROM banned_topics WHERE id = $1`,
      [id]
    );
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    if (!user.is_superuser && topic.set_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (words === "cascade") {
      await query(`DELETE FROM banned_words WHERE topic_id = $1`, [id]);
    }
    await query(`DELETE FROM banned_topics WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("v1 banned-topics DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete banned topic" }, { status: 500 });
  }
}
