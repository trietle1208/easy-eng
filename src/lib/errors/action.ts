import { ZodError, type ZodType } from "zod";

/**
 * Consistent Server Action errors.
 * - `fieldErrors`: RHF / form field map
 * - `message`: general (toast / form banner)
 */
export class ActionError extends Error {
  readonly code: "VALIDATION" | "RATE_LIMIT" | "FORBIDDEN" | "NOT_FOUND" | "GENERAL";
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    options?: {
      code?: ActionError["code"];
      fieldErrors?: Record<string, string[]>;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "ActionError";
    this.code = options?.code ?? "GENERAL";
    this.fieldErrors = options?.fieldErrors ?? {};
  }

  static fromZod(err: ZodError, fallback = "Invalid input"): ActionError {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    const first = err.issues[0]?.message ?? fallback;
    return new ActionError(first, { code: "VALIDATION", fieldErrors });
  }
}

/** Parse with Zod; throw ActionError (field + general) on failure. */
export function parseActionInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw ActionError.fromZod(result.error);
  return result.data;
}

export function toActionError(err: unknown, fallback = "Something went wrong"): ActionError {
  if (err instanceof ActionError) return err;
  if (err instanceof ZodError) return ActionError.fromZod(err);
  if (err instanceof Error) {
    return new ActionError(err.message || fallback, { code: "GENERAL", cause: err });
  }
  return new ActionError(fallback);
}
