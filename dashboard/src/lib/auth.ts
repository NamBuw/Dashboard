import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserRole } from "./types";
import type { SessionUser } from "./types";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    accessToken?: string;
  }
}

const AUTH_API_URL = process.env.AUTH_API_URL || "https://auth.ctslab.net";
const AUTHENTIK_ISSUER = process.env.AUTHENTIK_ISSUER || "http://localhost:9090/application/o/dashboard/";
const AUTHENTIK_CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID || "dashboard-client";
const AUTHENTIK_CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET || "dashboard-secret-key";

export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    // --- Authentik OIDC Provider (primary SSO) ---
    {
      id: "authentik",
      name: "Authentik",
      type: "oidc",
      issuer: AUTHENTIK_ISSUER,
      clientId: AUTHENTIK_CLIENT_ID,
      clientSecret: AUTHENTIK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile roles user_type assigned_products",
        },
      },
    },
    // --- Legacy Credentials Provider (FastAPI auth) ---
    Credentials({
      name: "PTalk Auth",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const loginRes = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!loginRes.ok) {
            return null;
          }

          const tokens = await loginRes.json();

          const meRes = await fetch(`${AUTH_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });

          if (!meRes.ok) {
            return null;
          }

          const user = await meRes.json();

          const roles: string[] = [];
          if (user.is_superuser) {
            roles.push("SuperAdmin");
          }
          if (user.user_type === "admin") {
            roles.push("ProductAdmin");
          }
          if (user.user_type === "support") {
            roles.push("Support");
          }

          return {
            id: user.id,
            name: user.display_name || user.username,
            email: user.email,
            roles,
            user_type: user.user_type,
            subscription_tier: user.subscription_tier,
            is_superuser: user.is_superuser,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Authentik OIDC login
      if (account?.provider === "authentik" && profile) {
        const authentikProfile = profile as Record<string, unknown>;
        const groups = (authentikProfile.groups as string[]) ?? [];

        const roles: string[] = [];
        if (groups.includes("SuperAdmin")) {
          roles.push("SuperAdmin");
          token.is_superuser = true;
        }
        if (groups.includes("ProductAdmin")) roles.push("ProductAdmin");
        if (groups.includes("Support")) roles.push("Support");
        if (groups.includes("Viewer")) roles.push("Viewer");

        token.sub = authentikProfile.sub as string;
        token.name = (authentikProfile.name as string) ?? (authentikProfile.preferred_username as string);
        token.email = authentikProfile.email as string;
        token.roles = roles;
        token.user_type = (authentikProfile.user_type as string) ?? "dashboard";
        token.subscription_tier = "pro";
        token.accessToken = account.access_token;
        token.authentikUserId = authentikProfile.sub as string;
      }

      // Credentials login (legacy)
      if (user && !account) {
        token.sub = (user as Record<string, unknown>).id as string;
        token.name = (user as Record<string, unknown>).name as string;
        token.email = (user as Record<string, unknown>).email as string;
        token.roles = (user as Record<string, unknown>).roles as string[];
        token.user_type = (user as Record<string, unknown>).user_type as string;
        token.subscription_tier = (user as Record<string, unknown>).subscription_tier as string;
        token.is_superuser = (user as Record<string, unknown>).is_superuser as boolean;
        token.accessToken = (user as Record<string, unknown>).accessToken as string;
      }

      return token;
    },
    session({ session, token }) {
      const roles = (token.roles as string[]) ?? [];
      session.user = {
        ...session.user,
        id: token.sub ?? "",
        email: (token.email as string) ?? "",
        name: (token.name as string) ?? "",
        role: getUserRole(roles),
        roles,
        user_type: ((token.user_type as string) ?? "dashboard") as SessionUser["user_type"],
        assigned_products: [],
        subscription_tier: (token.subscription_tier as string) ?? "basic",
        is_superuser: (token.is_superuser as boolean) ?? false,
      };
      session.accessToken = token.accessToken as string;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const subscriptionTier = auth?.user?.subscription_tier;
      const isSuperUser = auth?.user?.is_superuser;
      const { pathname } = request.nextUrl;

      const isOnDashboard = pathname.startsWith("/dashboard") ||
                          pathname.startsWith("/chats") ||
                          pathname.startsWith("/devices") ||
                          pathname.startsWith("/products");
      const isOnAdminOnly = pathname.startsWith("/users") || pathname.startsWith("/settings");
      const isProtected = isOnDashboard || isOnAdminOnly;

      if (isProtected) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", request.nextUrl));
        }

        if (subscriptionTier === "basic" && !isSuperUser) {
          return Response.redirect(new URL("/unauthorized", request.nextUrl));
        }

        if (isOnAdminOnly && !isSuperUser) {
          return Response.redirect(new URL("/unauthorized", request.nextUrl));
        }
      }

      if (pathname === "/login" && isLoggedIn) {
        if (subscriptionTier === "basic" && !isSuperUser) {
          return Response.redirect(new URL("/unauthorized", request.nextUrl));
        }
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
