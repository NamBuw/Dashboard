import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/banned-words
 * List banned words. Admin sees all, parents see only their own.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get("parent_only") === "true";

    let words;
    if (isSuperUser && !parentOnly) {
      words = await query(
        `SELECT bw.*, u.display_name as set_by_name
         FROM banned_words bw
         LEFT JOIN users u ON bw.set_by = u.id
         ORDER BY bw.created_at DESC`
      );
    } else {
      words = await query(
        `SELECT bw.*, u.display_name as set_by_name
         FROM banned_words bw
         LEFT JOIN users u ON bw.set_by = u.id
         WHERE bw.set_by = $1 OR bw.parent_user_id = $1
         ORDER BY bw.created_at DESC`,
        [currentUserId]
      );
    }

    return NextResponse.json({ words });
  } catch (error) {
    console.error("Banned words GET error:", error);
    return NextResponse.json({ error: "Failed to load banned words" }, { status: 500 });
  }
}

/**
 * POST /api/banned-words
 * Add a banned word. Admin can set globally, parents set for their children.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;
    const { word, category, setByRole, parentUserId } = await request.json();

    if (!word || !word.trim()) {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const normalizedWord = word.trim().toLowerCase();
    const role = isSuperUser && setByRole === "admin" ? "admin" : "parent";
    const parentId = role === "admin" ? null : (parentUserId || currentUserId);

    // Check duplicate
    const [existing] = await query<{ id: string }>(
      `SELECT id FROM banned_words WHERE word = $1 AND set_by_role = $2 AND (parent_user_id = $3 OR (parent_user_id IS NULL AND $3 IS NULL))`,
      [normalizedWord, role, parentId]
    );

    if (existing) {
      return NextResponse.json({ error: "Từ này đã bị cấm trước đó" }, { status: 409 });
    }

    await query(
      `INSERT INTO banned_words (word, category, set_by, set_by_role, parent_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [normalizedWord, category || "general", currentUserId, role, parentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banned words POST error:", error);
    return NextResponse.json({ error: "Failed to add banned word" }, { status: 500 });
  }
}

/**
 * DELETE /api/banned-words?id=xxx
 * Remove a banned word.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get("id");

    if (!wordId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const [word] = await query<{ id: string; set_by: string }>(
      `SELECT id, set_by FROM banned_words WHERE id = $1`,
      [wordId]
    );

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    if (!isSuperUser && word.set_by !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query(`DELETE FROM banned_words WHERE id = $1`, [wordId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banned words DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete banned word" }, { status: 500 });
  }
}
