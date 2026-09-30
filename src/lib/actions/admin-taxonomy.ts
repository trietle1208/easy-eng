"use server";

import { z } from "zod";

import {
  actionFailure,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import { saveGrammarFamily, saveGrammarGroup } from "@/lib/admin/service";
import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireAdmin } from "@/lib/auth/session";

const idField = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes");

const familySchema = z.object({
  id: idField,
  title: z.string().trim().min(1),
  sortOrder: z.number().int(),
});

const groupSchema = familySchema.extend({ familyId: z.string().min(1) });

export async function saveGrammarFamilyAction(
  input: z.input<typeof familySchema>,
): Promise<AdminActionResult> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("mutations", admin.id);
    const family = parseActionInput(familySchema, input);
    await saveGrammarFamily({ actor: { id: admin.id }, family });
    return { ok: true };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}

export async function saveGrammarGroupAction(
  input: z.input<typeof groupSchema>,
): Promise<AdminActionResult> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("mutations", admin.id);
    const group = parseActionInput(groupSchema, input);
    await saveGrammarGroup({ actor: { id: admin.id }, group });
    return { ok: true };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}
