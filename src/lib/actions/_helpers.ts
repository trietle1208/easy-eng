import { isRedirectError } from "next/dist/client/components/redirect-error";

import { toActionError } from "@/lib/errors/action";
import { logger } from "@/lib/logger";

export { ActionError, parseActionInput } from "@/lib/errors/action";
export { enforceRateLimit } from "@/lib/rate-limit";

function isNavigationControl(err: unknown): boolean {
  if (isRedirectError(err)) return true;
  // Vitest mocks `redirect()` as a plain Error with this prefix.
  if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT")) return true;
  return false;
}

/** Re-throw as Error so client components keep `err.message` (Next serializes Error). */
export function throwActionError(err: unknown): never {
  if (isNavigationControl(err)) throw err;
  const actionErr = toActionError(err);
  if (actionErr.code !== "VALIDATION" && actionErr.code !== "RATE_LIMIT") {
    logger.error("action_failed", {
      code: actionErr.code,
      message: actionErr.message,
    });
  }
  throw new Error(actionErr.message);
}
