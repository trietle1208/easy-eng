import "server-only";

export { auth, isGoogleAuthEnabled } from "@/lib/auth/auth";
export {
  getCurrentUser,
  requireUser,
  type CurrentUser,
} from "@/lib/auth/session";
export {
  AUTH_PATHS,
  PROTECTED_PATH_PREFIXES,
  isAuthPath,
  isProtectedPath,
  signInUrl,
} from "@/lib/auth/paths";
export { ensureUserDefaults } from "@/lib/auth/ensure-user-defaults";
