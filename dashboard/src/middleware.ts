import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth protection for dashboard routes
  const sessionCookie =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;
  const isAuthenticated = !!sessionCookie;

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/users") || pathname.startsWith("/devices") || pathname.startsWith("/chats") || pathname.startsWith("/products") || pathname.startsWith("/settings") || pathname.startsWith("/kg-analytics") || pathname.startsWith("/kg-browse")) &&
    !isAuthenticated
  ) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (pathname === "/") {
    const target = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(target, request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // App routes (exclude api, static files)
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
