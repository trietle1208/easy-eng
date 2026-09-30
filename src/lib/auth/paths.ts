/**
 * Route protection policy (Phase 3 + Phase 5 + Phase 9).
 *
 * Public: home, grammar/reading/listening/quiz content, auth pages, health, dev.
 * Protected (middleware + requireUser): profile, vocabulary (personal word bank).
 * Admin (`/admin`): middleware cookie check + `requireAdmin()` on every page/action.
 * Learning check/submit actions allow anonymous scoring (no progress writes);
 * personal mutations (words, settings) still call requireUser.
 */
export const PROTECTED_PATH_PREFIXES = ["/profile", "/vocabulary", "/admin"] as const;

export const ADMIN_PATH_PREFIX = "/admin";

export const AUTH_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAdminPath(pathname: string): boolean {
  return (
    pathname === ADMIN_PATH_PREFIX ||
    pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function signInUrl(callbackUrl?: string): string {
  if (!callbackUrl || callbackUrl === "/") return "/sign-in";
  const params = new URLSearchParams({ callbackUrl });
  return `/sign-in?${params.toString()}`;
}
