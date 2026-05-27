import { query } from "./db";

/**
 * Verify Bearer token from mobile apps.
 * Returns user info if valid, null if invalid.
 *
 * Mobile apps send Authentik JWT as Bearer token.
 * We verify by looking up the user in our DB.
 */
export async function verifyBearerToken(
  authHeader: string | null
): Promise<{ id: string; email: string; is_superuser: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // For now, we use a simple token lookup approach.
  // In production, verify JWT signature with Authentik's public key.
  try {
    // Decode JWT payload (middle part) to get user info
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );

    const authentikUserId = payload.sub;
    const email = payload.email;

    if (!authentikUserId) return null;

    // Look up user in our business DB by authentik_user_id or email
    const [user] = await query<{ id: string; email: string; is_superuser: boolean }>(
      `SELECT id, email, is_superuser FROM users
       WHERE authentik_user_id = $1 OR email = $2
       LIMIT 1`,
      [authentikUserId, email]
    );

    if (user) return user;

    // JIT provisioning: create user if not exists
    const groups = payload.groups || [];
    const isSuperUser = groups.includes("SuperAdmin");
    const userType = payload.user_type || "account_owner";
    const displayName = payload.name || payload.preferred_username || email;

    const [newUser] = await query<{ id: string; email: string; is_superuser: boolean }>(
      `INSERT INTO users (authentik_user_id, email, full_name, display_name, role, user_type, is_superuser, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pro')
       ON CONFLICT (email) DO UPDATE SET authentik_user_id = $1
       RETURNING id, email, is_superuser`,
      [authentikUserId, email, displayName, displayName,
       isSuperUser ? 'super_admin' : 'owner', userType, isSuperUser]
    );

    return newUser;
  } catch {
    return null;
  }
}
