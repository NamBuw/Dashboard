import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { getUserRole } from "./types";
import type { SessionUser } from "./types";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "authentik",
      name: "Authentik",
      type: "oidc",
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
    },
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.sub = profile.sub ?? undefined;
        token.roles = (profile as Record<string, unknown>).roles ?? [];
        token.user_type =
          (profile as Record<string, unknown>).user_type ?? "dashboard";
        token.assigned_products =
          (profile as Record<string, unknown>).assigned_products ?? [];
      }
      return token;
    },
    session({ session, token }) {
      const roles = (token.roles as string[]) ?? [];
      session.user = {
        ...session.user,
        id: token.sub ?? "",
        email: session.user?.email ?? "",
        name: session.user?.name ?? "",
        role: getUserRole(roles),
        roles,
        user_type: ((token.user_type as string) ?? "dashboard") as SessionUser["user_type"],
        assigned_products: (token.assigned_products as string[]) ?? [],
      };
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      const isOnUsers = request.nextUrl.pathname.startsWith("/users");
      const isProtected = isOnDashboard || isOnUsers;

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      if (request.nextUrl.pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
