import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { getUserRole } from "./types";
import type { SessionUser } from "./types";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    accessToken?: string;
  }
}

const AUTHENTIK_ISSUER = process.env.AUTHENTIK_ISSUER || "https://auth.ctslab.net/application/o/dashboard/";
const AUTHENTIK_CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID || "dashboard-client";
const AUTHENTIK_CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET || "dashboard-secret-key";

export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    // --- Authentik OIDC Provider (single auth source) ---
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
