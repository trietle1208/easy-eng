"use server";

import { z } from "zod";

import {
  actionFailure,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import { buildEntity } from "@/lib/admin/forms";
import { getGrammarTaxonomy } from "@/lib/admin/grammar";
import {
  deleteContent,
  getContentStatus,
  saveContent,
  setContentStatus,
} from "@/lib/admin/service";
import {
  CONTENT_KINDS,
  CONTENT_STATUSES,
  type ContentStatus,
} from "@/lib/admin/validate";
import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireAdmin } from "@/lib/auth/session";

const kindSchema = z.enum(CONTENT_KINDS);

const saveSchema = z.object({
  kind: kindSchema,
  mode: z.enum(["create", "update"]),
  /** Existing entity id when editing. */
  existingId: z.string().min(1).optional(),
  values: z.record(z.string(), z.string()),
  /** save = keep current status (new items start as draft). */
  intent: z.enum(["save", "publish", "draft"]),
});

export type SaveContentInput = z.input<typeof saveSchema>;

export async function saveContentAction(
  input: SaveContentInput,
): Promise<AdminActionResult<{ id: string; status: ContentStatus }>> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("mutations", admin.id);
    const parsed = parseActionInput(saveSchema, input);

    if (parsed.mode === "update" && !parsed.existingId) {
      return {
        ok: false,
        message: "Missing item id",
        fieldErrors: {},
      };
    }

    const { groups } = await loadGroups(parsed.kind);
    const entity = buildEntity(parsed.kind, parsed.values, {
      existingId: parsed.existingId,
      groups,
    });

    let status: ContentStatus;
    if (parsed.intent === "publish") status = "published";
    else if (parsed.intent === "draft") status = "draft";
    else {
      const id =
        parsed.existingId ??
        (parsed.values.slug ?? parsed.values.id ?? "").trim();
      status = (await getContentStatus(parsed.kind, id)) ?? "draft";
    }

    const saved = await saveContent({
      actor: { id: admin.id },
      kind: parsed.kind,
      mode: parsed.mode,
      entity,
      status,
    });
    return { ok: true, id: saved.id, status: saved.status };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}

async function loadGroups(kind: z.infer<typeof kindSchema>) {
  if (kind !== "grammar") return { groups: [] };
  const { families, groups } = await getGrammarTaxonomy();
  const familyTitle = new Map(families.map((f) => [f.id, f.title]));
  return {
    groups: groups.map((g) => ({
      id: g.id,
      familyId: g.familyId,
      title: g.title,
      familyTitle: familyTitle.get(g.familyId) ?? g.familyId,
    })),
  };
}

const statusSchema = z.object({
  kind: kindSchema,
  id: z.string().min(1),
  status: z.enum(CONTENT_STATUSES),
});

export async function setContentStatusAction(
  input: z.input<typeof statusSchema>,
): Promise<AdminActionResult> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("mutations", admin.id);
    const parsed = parseActionInput(statusSchema, input);
    await setContentStatus({ actor: { id: admin.id }, ...parsed });
    return { ok: true };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}

const deleteSchema = z.object({ kind: kindSchema, id: z.string().min(1) });

export async function deleteContentAction(
  input: z.input<typeof deleteSchema>,
): Promise<AdminActionResult> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("mutations", admin.id);
    const parsed = parseActionInput(deleteSchema, input);
    await deleteContent({ actor: { id: admin.id }, ...parsed });
    return { ok: true };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}
