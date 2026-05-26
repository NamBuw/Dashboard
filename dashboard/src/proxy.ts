import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/users"];
const publicPaths = ["/login"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie =
    req.cookies.get("authjs.session-token")?.value ??
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthenticated = !!sessionCookie;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (pathname === "/") {
    const target = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(target, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
