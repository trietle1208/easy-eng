import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { isProtectedPath, signInUrl } from "@/lib/auth/paths";

/**
 * Optimistic cookie check only — not a security boundary.
 * Every protected page / Server Action must still call `requireUser()` /
 * `requireAdmin()`. Role checks happen in `requireAdmin()` (404 for non-admins).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = new URL(
      signInUrl(`${pathname}${request.nextUrl.search}`),
      request.url,
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile",
    "/profile/:path*",
    "/vocabulary",
    "/vocabulary/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
