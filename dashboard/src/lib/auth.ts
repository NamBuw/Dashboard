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

export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV === "development",
  providers: [
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
          // Login to auth service
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

          // Get user info
          const meRes = await fetch(`${AUTH_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });

          if (!meRes.ok) {
            return null;
          }

          const user = await meRes.json();

          // Map roles based on user properties
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
    jwt({ token, user }) {
      if (user) {
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
        subscription_tier: token.subscription_tier as string,
        is_superuser: token.is_superuser as boolean,
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

        // Basic tier (Demo User) is restricted from Web Dashboard (unless superuser)
        if (subscriptionTier === "basic" && !isSuperUser) {
          return Response.redirect(new URL("/unauthorized", request.nextUrl));
        }

        // Normal users (non-superusers) are restricted from Admin-only pages
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
