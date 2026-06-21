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
    // Optional: scope to a single child (a child IS a users row; its per-child rules
    // live as banned_words rows with parent_user_id = <child id>). Accepts either name.
    const childId = searchParams.get("child_id") || searchParams.get("parent_user_id");

    let words;
    if (childId) {
      // Object-level auth: caller must own this child (admin bypasses) — a child is
      // theirs when linked via a device assignment OR user_relationships.
      if (!isSuperUser) {
        const [link] = await query<{ count: string }>(
          `SELECT (
             (SELECT COUNT(*) FROM devices WHERE owner_id = $1 AND assigned_user_id = $2)
             + (SELECT COUNT(*) FROM user_relationships WHERE parent_id = $1 AND child_id = $2)
           ) AS count`,
          [currentUserId, childId]
        );
        if (!link || Number(link.count) === 0) {
          return NextResponse.json(
            { error: "Forbidden - You can only view banned words for your own children" },
            { status: 403 }
          );
        }
      }
      words = await query(
        `SELECT bw.*, u.display_name as set_by_name
         FROM banned_words bw
         LEFT JOIN users u ON bw.set_by = u.id
         WHERE bw.parent_user_id = $1
         ORDER BY bw.created_at DESC`,
        [childId]
      );
    } else if (isSuperUser && !parentOnly) {
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
    const { word, category, setByRole, parentUserId, topicId } = await request.json();

    if (!word || !word.trim()) {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const normalizedWord = word.trim().toLowerCase();
    const role = isSuperUser && setByRole === "admin" ? "admin" : "parent";
    const parentId = role === "admin" ? null : (parentUserId || currentUserId);

    // Object-level authorization: a parent may only scope a rule to themselves or to a
    // child of their own — either assigned to one of their devices OR linked via
    // user_relationships(parent_id, child_id). The relationship link is the canonical
    // path now that a child is a full users row used as the app's session identity.
    // Without this, a crafted parentUserId would let one parent plant banned words on any
    // victim's account — and CloudPTalk (moderation.py) would actually enforce them.
    if (role === "parent" && parentId !== currentUserId) {
      const [link] = await query<{ count: string }>(
        `SELECT (
           (SELECT COUNT(*) FROM devices WHERE owner_id = $1 AND assigned_user_id = $2)
           + (SELECT COUNT(*) FROM user_relationships WHERE parent_id = $1 AND child_id = $2)
         ) AS count`,
        [currentUserId, parentId]
      );
      if (!link || Number(link.count) === 0) {
        return NextResponse.json(
          { error: "Forbidden - You can only set banned words for your own children" },
          { status: 403 }
        );
      }
    }

    // Check duplicate
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
      [normalizedWord, category || "general", currentUserId, role, parentId, topicId || null]
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

/**
 * PUT /api/banned-words
 * Update a banned word: toggle is_active and/or change its category.
 * Body: { id, is_active?, category? }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperUser = !!session.user.is_superuser;
    const currentUserId = session.user.id;
    const { id, is_active, category } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    if (is_active === undefined && category === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [word] = await query<{ id: string; set_by: string }>(
      `SELECT id, set_by FROM banned_words WHERE id = $1`,
      [id]
    );

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    if (!isSuperUser && word.set_by !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // COALESCE keeps the existing value when a field is not provided (null).
    await query(
      `UPDATE banned_words
         SET is_active = COALESCE($2, is_active),
             category  = COALESCE($3, category)
       WHERE id = $1`,
      [id, is_active ?? null, category ?? null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banned words PUT error:", error);
    return NextResponse.json({ error: "Failed to update banned word" }, { status: 500 });
  }
}
