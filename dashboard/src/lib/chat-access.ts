import { query } from "@/lib/db";

/**
 * Whether `viewerId` may read/write `targetId`'s chat history.
 *
 * Allowed when the viewer IS the target, OR owns a device the target is assigned
 * to (`devices.owner_id` → `assigned_user_id`), OR is the target's parent
 * (`user_relationships.parent_id` → `child_id`). SuperAdmin should bypass this
 * check at the call site. Unifies the two linkage models so a parent can see a
 * child via EITHER a device assignment or a family relationship.
 */
export async function canViewUserChat(viewerId: string, targetId: string): Promise<boolean> {
  if (viewerId === targetId) return true;
  const [row] = await query<{ count: string }>(
    `SELECT (
       (SELECT COUNT(*) FROM devices WHERE owner_id = $1 AND assigned_user_id = $2)
       + (SELECT COUNT(*) FROM user_relationships WHERE parent_id = $1 AND child_id = $2)
     ) AS count`,
    [viewerId, targetId],
  );
  return parseInt(row?.count || "0", 10) > 0;
}
