"use server";

import { z } from "zod";

import {
  actionFailure,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import { importContentFile } from "@/lib/admin/service";
import { CONTENT_KINDS } from "@/lib/admin/validate";
import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireAdmin } from "@/lib/auth/session";

const MAX_IMPORT_CHARS = 5_000_000;

const importSchema = z.object({
  kind: z.enum(CONTENT_KINDS),
  json: z.string().min(2, "Paste or upload a JSON document").max(MAX_IMPORT_CHARS),
  status: z.enum(["keep", "draft", "published"]),
});

export async function importContentAction(
  input: z.input<typeof importSchema>,
): Promise<AdminActionResult<{ counts: Record<string, number> }>> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("mutations", admin.id);
    const parsed = parseActionInput(importSchema, input);
    const result = await importContentFile({
      actor: { id: admin.id },
      ...parsed,
    });
    return { ok: true, counts: result.counts };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}
