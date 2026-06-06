import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { query } from "./db";

const AUTHENTIK_JWKS_URI =
  process.env.AUTHENTIK_JWKS_URI ||
  "https://auth.ctslab.net/application/o/p-assistant/jwks/";

// Authentik userinfo endpoint — used as a fallback to validate a Bearer token when
// local JWT verification can't (e.g. opaque access tokens, signing/issuer edge cases).
// Authentik validates the token server-side and returns the claims.
const AUTHENTIK_USERINFO_URL =
  process.env.AUTHENTIK_USERINFO_URL ||
  "https://auth.ctslab.net/application/o/userinfo/";

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

interface TokenClaims {
  sub?: string;
  email?: string;
  groups?: string[];
  user_type?: string;
  name?: string;
  preferred_username?: string;
}

/**
 * Resolve the identity claims of a Bearer token.
 * 1) Fast path: verify the JWT signature against Authentik's JWKS (any mobile-app issuer).
 * 2) Fallback: if that fails, introspect via Authentik's userinfo endpoint — this accepts
 *    opaque access tokens and tolerates signing/issuer mismatches that jose can't verify.
 * Returns null (and logs the reason) only when the token is genuinely invalid.
 */
async function resolveTokenClaims(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJWKS(), { issuer: MOBILE_ISSUERS });
    return {
      sub: payload.sub,
      email: payload.email as string | undefined,
      groups: payload.groups as string[] | undefined,
      user_type: payload.user_type as string | undefined,
      name: payload.name as string | undefined,
      preferred_username: payload.preferred_username as string | undefined,
    };
  } catch (jwtErr) {
    const jwtMsg = jwtErr instanceof Error ? jwtErr.message : String(jwtErr);
    try {
      const res = await fetch(AUTHENTIK_USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[auth] bearer rejected — jwtVerify("${jwtMsg}") + userinfo ${res.status}`);
        return null;
      }
      const info = (await res.json()) as Record<string, unknown>;
      return {
        sub: info.sub as string | undefined,
        email: info.email as string | undefined,
        groups: info.groups as string[] | undefined,
        user_type: info.user_type as string | undefined,
        name: info.name as string | undefined,
        preferred_username: info.preferred_username as string | undefined,
      };
    } catch (uiErr) {
      const uiMsg = uiErr instanceof Error ? uiErr.message : String(uiErr);
      console.warn(`[auth] bearer rejected — jwtVerify("${jwtMsg}") + userinfo error("${uiMsg}")`);
      return null;
    }
  }
}

/**
 * Verify a Bearer token from the mobile apps and resolve it to a Dashboard user.
 * JIT-provisions the user on first SSO login. Returns null if the token is invalid.
 */
export async function verifyBearerToken(
  authHeader: string | null
): Promise<{ id: string; email: string; is_superuser: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const claims = await resolveTokenClaims(token);
    if (!claims) return null;

    const authentikUserId = claims.sub;
    const email = claims.email;
    if (!authentikUserId) {
      console.warn("[auth] bearer rejected — token has no `sub`");
      return null;
    }

    // Look up user in our DB by authentik_user_id or email.
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
    if (!email) {
      console.warn("[auth] cannot JIT-provision — token has no `email`");
      return null;
    }

    // JIT provisioning: create the user on first SSO login.
    // ptalk_auth requires username + password_hash (NOT NULL) and has NO `role`
    // column (that lived in the abandoned ptalk_business schema). So: synthetic
    // username, a non-login password_hash, email_verified=true (Authentik already
    // verified it), and never overwrite an existing authentik binding.
    const groups = claims.groups || [];
    const isSuperUser = groups.includes("SuperAdmin");
    const userType = claims.user_type || "account_owner";
    const displayName = claims.name || claims.preferred_username || email;

    const usernameBase =
      (email.split("@")[0] || claims.preferred_username || "user")
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
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[auth] verifyBearerToken error: ${msg}`);
    return null;
  }
}
