"use server";

import {
  actionFailure,
  type AdminActionResult,
} from "@/lib/admin/action-result";
import { uploadListeningAudio } from "@/lib/admin/service";
import { ActionError, enforceRateLimit, throwActionError } from "@/lib/actions/_helpers";
import { requireAdmin } from "@/lib/auth/session";

/** Upload lesson audio; returns the storage key to paste into `audioPath`. */
export async function uploadListeningAudioAction(
  formData: FormData,
): Promise<AdminActionResult<{ key: string }>> {
  // Outside try: signed-out → redirect, non-admin → notFound() propagate as-is.
  const admin = await requireAdmin();
  try {
    await enforceRateLimit("uploads", admin.id);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new ActionError("Choose an audio file", {
        code: "VALIDATION",
        fieldErrors: { audioPath: ["Choose an audio file"] },
      });
    }
    const { key } = await uploadListeningAudio({
      actor: { id: admin.id },
      filename: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
    });
    return { ok: true, key };
  } catch (err) {
    const failure = actionFailure(err);
    if (failure) return failure;
    throwActionError(err);
  }
}
