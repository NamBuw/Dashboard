import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { query } from "./db";

const AUTHENTIK_JWKS_URI =
  process.env.AUTHENTIK_JWKS_URI ||
  "https://auth.ctslab.net/application/o/p-assistant/jwks/";

// Mobile apps authenticate against their OWN Authentik applications, so a mobile token's
// `iss` is the app issuer (.../o/p-assistant/, .../o/kid-mentor/) — NOT the Dashboard
// web-login issuer in process.env.AUTHENTIK_ISSUER (.../o/dashboard/). Verifying mobile
// Bearer tokens against that web issuer rejects every one with "unexpected iss". Accept
// the known mobile-app issuers instead (override via AUTHENTIK_MOBILE_ISSUERS, comma-sep).
const MOBILE_ISSUERS = (
  process.env.AUTHENTIK_MOBILE_ISSUERS ||
  "https://auth.ctslab.net/application/o/p-assistant/,https://auth.ctslab.net/application/o/kid-mentor/"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Cache the JWKS to avoid fetching on every request.
// jose handles cache-control headers and refreshes automatically.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(AUTHENTIK_JWKS_URI));
  }
  return jwks;
}

/**
 * Verify Bearer token from mobile apps.
 * Returns user info if valid, null if invalid.
 *
 * Mobile apps send Authentik JWT as Bearer token.
 * We verify the JWT signature against Authentik's JWKS,
 * then look up the user in our DB.
 */
export async function verifyBearerToken(
  authHeader: string | null
): Promise<{ id: string; email: string; is_superuser: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Verify signature against Authentik's JWKS and accept any known mobile-app issuer.
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: MOBILE_ISSUERS,
    });

    const authentikUserId = payload.sub;
    const email = payload.email as string | undefined;

    if (!authentikUserId) return null;

    // Look up user in our business DB by authentik_user_id or email
    const [user] = await query<{
      id: string;
      email: string;
      is_superuser: boolean;
    }>(
      `SELECT id, email, is_superuser FROM users
       WHERE authentik_user_id = $1 OR email = $2
       LIMIT 1`,
      [authentikUserId, email]
    );

    if (user) return user;

    // No email claim → can't provision (email is NOT NULL + the account key).
    if (!email) return null;

    // JIT provisioning: create the user on first SSO login.
    // ptalk_auth requires username + password_hash (NOT NULL) and has NO `role`
    // column (that lived in the abandoned ptalk_business schema). So: synthetic
    // username, a non-login password_hash, email_verified=true (Authentik already
    // verified it), and never overwrite an existing authentik binding.
    const groups = (payload.groups as string[]) || [];
    const isSuperUser = groups.includes("SuperAdmin");
    const userType = (payload.user_type as string) || "account_owner";
    const displayName =
      (payload.name as string) ||
      (payload.preferred_username as string) ||
      email;

    const usernameBase =
      (email.split("@")[0] || (payload.preferred_username as string) || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 40) || "user";
    const username = `${usernameBase}_${String(authentikUserId)
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 8)}`.slice(0, 64);

    const [newUser] = await query<{
      id: string;
      email: string;
      is_superuser: boolean;
    }>(
      `INSERT INTO users
         (id, username, email, password_hash, display_name, full_name, user_type,
          authentik_user_id, subscription_tier, is_active, is_superuser, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, true)
       ON CONFLICT (email) DO UPDATE
         SET authentik_user_id = COALESCE(users.authentik_user_id, EXCLUDED.authentik_user_id)
       RETURNING id, email, is_superuser`,
      [
        randomUUID(),
        username,
        email,
        "!sso-no-local-login", // SSO accounts never authenticate via bcrypt locally
        displayName,
        displayName,
        userType,
        authentikUserId,
        isSuperUser ? "pro" : "basic",
        isSuperUser,
      ]
    );

    return newUser;
  } catch (err) {
    // Invalid/expired token or provisioning error → treat as unauthenticated.
    if (process.env.NODE_ENV === "development") {
      console.error("Bearer token verification failed:", err);
    }
    return null;
  }
}
