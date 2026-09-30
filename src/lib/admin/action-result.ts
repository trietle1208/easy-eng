import { ActionError, toActionError } from "@/lib/errors/action";

export type AdminActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | {
      ok: false;
      message: string;
      fieldErrors: Record<string, string[]>;
    };

/**
 * Validation / conflict errors become a result the form can render next to
 * fields. Everything else (auth redirects, 404s, unexpected errors) rethrows.
 */
export function actionFailure(err: unknown): {
  ok: false;
  message: string;
  fieldErrors: Record<string, string[]>;
} | null {
  if (err instanceof ActionError) {
    if (err.code === "VALIDATION" || err.code === "NOT_FOUND" || err.code === "RATE_LIMIT") {
      return { ok: false, message: err.message, fieldErrors: err.fieldErrors };
    }
  }
  return null;
}

export { toActionError };
