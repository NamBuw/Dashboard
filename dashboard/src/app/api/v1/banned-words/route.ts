import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyBearerToken } from "@/lib/api-auth";

/**
 * Mobile (Bearer) banned-words CRUD — mirrors /api/banned-words but authenticates with
 * an Authentik JWT instead of a NextAuth session. Used by the P-Connect app.
 */

/** GET /api/v1/banned-words — list (admin: all; parent: own/their children). */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get("parent_only") === "true";

    const words =
      user.is_superuser && !parentOnly
        ? await query(
            `SELECT bw.*, u.display_name as set_by_name
             FROM banned_words bw LEFT JOIN users u ON bw.set_by = u.id
             ORDER BY bw.created_at DESC`
          )
        : await query(
            `SELECT bw.*, u.display_name as set_by_name
             FROM banned_words bw LEFT JOIN users u ON bw.set_by = u.id
             WHERE bw.set_by = $1 OR bw.parent_user_id = $1
             ORDER BY bw.created_at DESC`,
            [user.id]
          );

    return NextResponse.json({ words });
  } catch (error) {
    console.error("v1 banned-words GET error:", error);
    return NextResponse.json({ error: "Failed to load banned words" }, { status: 500 });
  }
}

/** POST /api/v1/banned-words — add a word. Body: { word, category?, setByRole?, parentUserId?, topicId? } */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { word, category, setByRole, parentUserId, topicId } = await request.json();
    if (!word || !word.trim()) {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const normalizedWord = word.trim().toLowerCase();
    const role = user.is_superuser && setByRole === "admin" ? "admin" : "parent";
    const parentId = role === "admin" ? null : (parentUserId || user.id);

    // IDOR guard: a parent may only scope to themselves or a child on their own device.
    if (role === "parent" && parentId !== user.id) {
      const [dev] = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM devices WHERE owner_id = $1 AND assigned_user_id = $2`,
        [user.id, parentId]
      );
      if (!dev || Number(dev.count) === 0) {
        return NextResponse.json(
          { error: "Forbidden - You can only set banned words for your own children" },
          { status: 403 }
        );
      }
    }

    const [existing] = await query<{ id: string }>(
      `SELECT id FROM banned_words WHERE word = $1 AND set_by_role = $2 AND (parent_user_id = $3 OR (parent_user_id IS NULL AND $3 IS NULL))`,
      [normalizedWord, role, parentId]
    );
    if (existing) {
      return NextResponse.json({ error: "Từ này đã bị cấm trước đó" }, { status: 409 });
    }

    await query(
      `INSERT INTO banned_words (word, category, set_by, set_by_role, parent_user_id, topic_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [normalizedWord, category || "general", user.id, role, parentId, topicId || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("v1 banned-words POST error:", error);
    return NextResponse.json({ error: "Failed to add banned word" }, { status: 500 });
  }
}

/** PUT /api/v1/banned-words — Body: { id, is_active?, category? } */
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, is_active, category } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (is_active === undefined && category === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [word] = await query<{ id: string; set_by: string }>(
      `SELECT id, set_by FROM banned_words WHERE id = $1`,
      [id]
    );
    if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });
    if (!user.is_superuser && word.set_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query(
      `UPDATE banned_words SET is_active = COALESCE($2, is_active), category = COALESCE($3, category) WHERE id = $1`,
      [id, is_active ?? null, category ?? null]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("v1 banned-words PUT error:", error);
    return NextResponse.json({ error: "Failed to update banned word" }, { status: 500 });
  }
}

/** DELETE /api/v1/banned-words?id=xxx */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get("Authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get("id");
    if (!wordId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const [word] = await query<{ id: string; set_by: string }>(
      `SELECT id, set_by FROM banned_words WHERE id = $1`,
      [wordId]
    );
    if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });
    if (!user.is_superuser && word.set_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query(`DELETE FROM banned_words WHERE id = $1`, [wordId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("v1 banned-words DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete banned word" }, { status: 500 });
  }
}
