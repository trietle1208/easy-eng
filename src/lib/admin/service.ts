import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  grammarLessons,
  listeningLessons,
  quizzes,
  readingPassages,
  wordSets,
} from "@/db/schema";
import {
  writeAuditLog,
  type AuditEntityType,
} from "@/lib/admin/audit";
import {
  asStatus,
  conflictError,
  isUniqueViolation,
  type Tx,
  type WriteStatus,
} from "@/lib/admin/common";
import { zodToFieldErrors } from "@/lib/admin/forms";
import {
  exportGrammar,
  getGrammar,
  importGrammar,
  removeGrammarLesson,
  setGrammarStatus,
  upsertGrammarFamily,
  upsertGrammarGroup,
  upsertGrammarLesson,
} from "@/lib/admin/grammar";
import {
  exportListening,
  getListening,
  importListening,
  removeListeningLesson,
  setListeningStatus,
  upsertListeningLesson,
} from "@/lib/admin/listening";
import {
  exportQuizzes,
  getQuizForAdmin,
  importQuizzes,
  removeQuiz,
  setQuizStatus,
  upsertQuiz,
} from "@/lib/admin/quiz";
import {
  exportReading,
  getReading,
  importReading,
  removeReadingPassage,
  setReadingStatus,
  upsertReadingPassage,
} from "@/lib/admin/reading";
import { revalidateContent } from "@/lib/admin/revalidate";
import {
  CONTENT_FILE_SCHEMAS,
  publishBlockers,
  validateImportedEntities,
  type ContentKind,
  type ContentStatus,
  type GrammarLessonEntity,
  type ListeningLessonEntity,
  type QuizEntity,
  type ReadingPassageEntity,
  type WordSetBundle,
} from "@/lib/admin/validate";
import {
  exportVocabulary,
  getWordSetBundle,
  importVocabulary,
  removeWordSet,
  setWordSetStatus,
  upsertWordSet,
} from "@/lib/admin/vocabulary";
import { ActionError } from "@/lib/errors/action";
import { getStorage } from "@/lib/storage";

export type Actor = { id: string };

export type ContentEntity =
  | GrammarLessonEntity
  | ReadingPassageEntity
  | ListeningLessonEntity
  | QuizEntity
  | WordSetBundle;

const ENTITY_TYPE: Record<ContentKind, AuditEntityType> = {
  grammar: "grammar_lesson",
  reading: "reading_passage",
  listening: "listening_lesson",
  quiz: "quiz",
  vocabulary: "word_set",
};

function entityKey(kind: ContentKind, entity: ContentEntity): {
  id: string;
  title: string;
} {
  if (kind === "vocabulary") {
    const b = entity as WordSetBundle;
    return { id: b.set.id, title: b.set.title };
  }
  const e = entity as { id: string; title: string };
  return { id: e.id, title: e.title };
}

async function existingStatus(
  tx: Tx,
  kind: ContentKind,
  id: string,
): Promise<ContentStatus | null> {
  const pick = async () => {
    switch (kind) {
      case "grammar":
        return tx
          .select({ status: grammarLessons.status })
          .from(grammarLessons)
          .where(eq(grammarLessons.id, id))
          .limit(1);
      case "reading":
        return tx
          .select({ status: readingPassages.status })
          .from(readingPassages)
          .where(eq(readingPassages.id, id))
          .limit(1);
      case "listening":
        return tx
          .select({ status: listeningLessons.status })
          .from(listeningLessons)
          .where(eq(listeningLessons.id, id))
          .limit(1);
      case "quiz":
        return tx
          .select({ status: quizzes.status })
          .from(quizzes)
          .where(eq(quizzes.id, id))
          .limit(1);
      case "vocabulary":
        return tx
          .select({ status: wordSets.status })
          .from(wordSets)
          .where(eq(wordSets.id, id))
          .limit(1);
    }
  };
  const [row] = await pick();
  return row ? asStatus(row.status) : null;
}

/** Current status of an item, or null when it does not exist. */
export async function getContentStatus(
  kind: ContentKind,
  id: string,
): Promise<ContentStatus | null> {
  if (!id) return null;
  return existingStatus(db as unknown as Tx, kind, id);
}

async function upsertByKind(
  tx: Tx,
  kind: ContentKind,
  entity: ContentEntity,
  status: WriteStatus,
) {
  switch (kind) {
    case "grammar":
      return upsertGrammarLesson(tx, entity as GrammarLessonEntity, status);
    case "reading":
      return upsertReadingPassage(tx, entity as ReadingPassageEntity, status);
    case "listening":
      return upsertListeningLesson(tx, entity as ListeningLessonEntity, status);
    case "quiz":
      return upsertQuiz(tx, entity as QuizEntity, status);
    case "vocabulary":
      return upsertWordSet(tx, entity as WordSetBundle, status);
  }
}

/** Load the stored entity (for publish gating). */
async function loadEntity(
  kind: ContentKind,
  id: string,
): Promise<ContentEntity | null> {
  switch (kind) {
    case "grammar":
      return (await getGrammar(id))?.entity ?? null;
    case "reading":
      return (await getReading(id))?.entity ?? null;
    case "listening":
      return (await getListening(id))?.entity ?? null;
    case "quiz":
      return (await getQuizForAdmin(id))?.entity ?? null;
    case "vocabulary":
      return (await getWordSetBundle(id))?.bundle ?? null;
  }
}

function assertPublishable(kind: ContentKind, entity: ContentEntity) {
  const blockers = publishBlockers(kind, entity);
  if (blockers.length) {
    throw new ActionError(`Cannot publish: ${blockers.join("; ")}`, {
      code: "VALIDATION",
      fieldErrors: { _form: blockers },
    });
  }
}

export type SaveResult = {
  id: string;
  title: string;
  status: ContentStatus;
};

/**
 * Create or update one item. Writes the audit log in the same transaction and
 * revalidates content cache tags after commit.
 */
export async function saveContent(input: {
  actor: Actor;
  kind: ContentKind;
  mode: "create" | "update";
  entity: ContentEntity;
  status: ContentStatus;
}): Promise<SaveResult> {
  const { actor, kind, mode, entity, status } = input;
  const { id, title } = entityKey(kind, entity);
  if (status === "published") assertPublishable(kind, entity);

  try {
    await db.transaction(async (tx) => {
      const before = await existingStatus(tx, kind, id);
      if (mode === "create" && before) {
        throw conflictError(`"${id}" already exists`, "slug");
      }
      if (mode === "update" && !before) {
        throw new ActionError("Item not found", { code: "NOT_FOUND" });
      }

      await upsertByKind(tx, kind, entity, status);

      await writeAuditLog(tx, {
        actorUserId: actor.id,
        action: mode,
        entityType: ENTITY_TYPE[kind],
        entityId: id,
        summary: `${mode === "create" ? "Created" : "Updated"} "${title}" (${status})`,
        payload: { status, previousStatus: before },
      });
      if (before && before !== status) {
        await writeAuditLog(tx, {
          actorUserId: actor.id,
          action: status === "published" ? "publish" : "unpublish",
          entityType: ENTITY_TYPE[kind],
          entityId: id,
          summary: `${status === "published" ? "Published" : "Unpublished"} "${title}"`,
        });
      } else if (!before && status === "published") {
        await writeAuditLog(tx, {
          actorUserId: actor.id,
          action: "publish",
          entityType: ENTITY_TYPE[kind],
          entityId: id,
          summary: `Published "${title}"`,
        });
      }
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw conflictError(
        "That slug is already used by another item",
        "slug",
      );
    }
    throw err;
  }

  revalidateContent(kind);
  return { id, title, status };
}

async function setStatusByKind(
  tx: Tx,
  kind: ContentKind,
  id: string,
  status: ContentStatus,
): Promise<boolean> {
  switch (kind) {
    case "grammar":
      return setGrammarStatus(tx, id, status);
    case "reading":
      return setReadingStatus(tx, id, status);
    case "listening":
      return setListeningStatus(tx, id, status);
    case "quiz":
      return setQuizStatus(tx, id, status);
    case "vocabulary":
      return setWordSetStatus(tx, id, status);
  }
}

/** Publish / unpublish without touching the content itself. */
export async function setContentStatus(input: {
  actor: Actor;
  kind: ContentKind;
  id: string;
  status: ContentStatus;
}): Promise<void> {
  const { actor, kind, id, status } = input;

  if (status === "published") {
    const entity = await loadEntity(kind, id);
    if (!entity) throw new ActionError("Item not found", { code: "NOT_FOUND" });
    assertPublishable(kind, entity);
  }

  await db.transaction(async (tx) => {
    const before = await existingStatus(tx, kind, id);
    if (!before) throw new ActionError("Item not found", { code: "NOT_FOUND" });
    if (before === status) return;
    await setStatusByKind(tx, kind, id, status);
    await writeAuditLog(tx, {
      actorUserId: actor.id,
      action: status === "published" ? "publish" : "unpublish",
      entityType: ENTITY_TYPE[kind],
      entityId: id,
      summary: `${status === "published" ? "Published" : "Unpublished"} ${id}`,
      payload: { previousStatus: before },
    });
  });

  revalidateContent(kind);
}

async function removeByKind(tx: Tx, kind: ContentKind, id: string) {
  switch (kind) {
    case "grammar":
      return removeGrammarLesson(tx, id);
    case "reading":
      return removeReadingPassage(tx, id);
    case "listening":
      return removeListeningLesson(tx, id);
    case "quiz":
      return removeQuiz(tx, id);
    case "vocabulary":
      return removeWordSet(tx, id);
  }
}

/** Delete a *draft* item (published content must be unpublished first). */
export async function deleteContent(input: {
  actor: Actor;
  kind: ContentKind;
  id: string;
}): Promise<void> {
  const { actor, kind, id } = input;
  await db.transaction(async (tx) => {
    const before = await existingStatus(tx, kind, id);
    if (!before) throw new ActionError("Item not found", { code: "NOT_FOUND" });
    if (before === "published") {
      throw new ActionError("Unpublish this item before deleting it.", {
        code: "VALIDATION",
      });
    }
    await removeByKind(tx, kind, id);
    await writeAuditLog(tx, {
      actorUserId: actor.id,
      action: "delete",
      entityType: ENTITY_TYPE[kind],
      entityId: id,
      summary: `Deleted ${id}`,
    });
  });
  revalidateContent(kind);
}

/* ── Grammar taxonomy ────────────────────────────────────────── */

export async function saveGrammarFamily(input: {
  actor: Actor;
  family: { id: string; title: string; sortOrder: number };
}): Promise<void> {
  await db.transaction(async (tx) => {
    await upsertGrammarFamily(tx, input.family);
    await writeAuditLog(tx, {
      actorUserId: input.actor.id,
      action: "update",
      entityType: "grammar_family",
      entityId: input.family.id,
      summary: `Saved family "${input.family.title}"`,
    });
  });
  revalidateContent("grammar");
}

export async function saveGrammarGroup(input: {
  actor: Actor;
  group: { id: string; familyId: string; title: string; sortOrder: number };
}): Promise<void> {
  await db.transaction(async (tx) => {
    await upsertGrammarGroup(tx, input.group);
    await writeAuditLog(tx, {
      actorUserId: input.actor.id,
      action: "update",
      entityType: "grammar_group",
      entityId: input.group.id,
      summary: `Saved group "${input.group.title}"`,
    });
  });
  revalidateContent("grammar");
}

/* ── Import / export ─────────────────────────────────────────── */

export type ImportResult = {
  kind: ContentKind;
  counts: Record<string, number>;
  status: WriteStatus;
};

/**
 * Import a JSON document in the exact `content/<kind>.json` format.
 * `keep` (default) leaves existing items' status alone; new items start as draft.
 */
export async function importContentFile(input: {
  actor: Actor;
  kind: ContentKind;
  json: string;
  status: WriteStatus;
}): Promise<ImportResult> {
  const { actor, kind, json, status } = input;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new ActionError(`Invalid JSON: ${(err as Error).message}`, {
      code: "VALIDATION",
      fieldErrors: { json: [`Invalid JSON: ${(err as Error).message}`] },
    });
  }

  const parsed = CONTENT_FILE_SCHEMAS[kind].safeParse(raw);
  if (!parsed.success) throw zodToFieldErrors(parsed.error);
  const extra = validateImportedEntities(kind, parsed.data);
  if (extra) throw zodToFieldErrors(extra);

  let counts: Record<string, number> = {};
  let ids: string[] = [];
  try {
    await db.transaction(async (tx) => {
      switch (kind) {
        case "grammar": {
          const d = parsed.data as Parameters<typeof importGrammar>[1];
          counts = await importGrammar(tx, d, status);
          ids = d.lessons.map((l) => l.id);
          break;
        }
        case "reading": {
          const d = parsed.data as Parameters<typeof importReading>[1];
          counts = await importReading(tx, d, status);
          ids = d.passages.map((p) => p.id);
          break;
        }
        case "listening": {
          const d = parsed.data as Parameters<typeof importListening>[1];
          counts = await importListening(tx, d, status);
          ids = d.lessons.map((l) => l.id);
          break;
        }
        case "quiz": {
          const d = parsed.data as Parameters<typeof importQuizzes>[1];
          counts = await importQuizzes(tx, d, status);
          ids = d.quizzes.map((q) => q.id);
          break;
        }
        case "vocabulary": {
          const d = parsed.data as Parameters<typeof importVocabulary>[1];
          counts = await importVocabulary(tx, d, status);
          ids = d.sets.map((s) => s.id);
          break;
        }
      }
      await writeAuditLog(tx, {
        actorUserId: actor.id,
        action: "import",
        entityType: "content_file",
        entityId: kind,
        summary: `Imported ${kind}: ${Object.entries(counts)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ")} (status: ${status})`,
        payload: { status, counts, ids },
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw conflictError(
        "A slug in this file is already used by a different item id",
        "json",
      );
    }
    throw err;
  }

  revalidateContent(kind);
  return { kind, counts, status };
}

/** JSON document in the `content/<kind>.json` shape (no status field). */
export async function exportContentFile(
  kind: ContentKind,
  status?: ContentStatus,
): Promise<unknown> {
  switch (kind) {
    case "grammar":
      return exportGrammar(status);
    case "reading":
      return exportReading(status);
    case "listening":
      return exportListening(status);
    case "quiz":
      return exportQuizzes(status);
    case "vocabulary":
      return exportVocabulary(status);
  }
}

/* ── Audio upload ────────────────────────────────────────────── */

export const AUDIO_MAX_BYTES = 25 * 1024 * 1024;

const AUDIO_TYPES: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".webm": "audio/webm",
};

/** Store listening audio under `listening/` and return its storage key. */
export async function uploadListeningAudio(input: {
  actor: Actor;
  filename: string;
  bytes: Buffer;
}): Promise<{ key: string }> {
  const rawExt = path.extname(input.filename);
  const ext = rawExt.toLowerCase();
  const contentType = AUDIO_TYPES[ext];
  if (!contentType) {
    throw new ActionError("Audio must be .wav, .mp3, .ogg, .m4a or .webm", {
      code: "VALIDATION",
      fieldErrors: { audioPath: ["Unsupported audio type"] },
    });
  }
  if (input.bytes.length === 0 || input.bytes.length > AUDIO_MAX_BYTES) {
    throw new ActionError("Audio must be between 1 byte and 25 MB", {
      code: "VALIDATION",
      fieldErrors: { audioPath: ["Audio too large or empty"] },
    });
  }
  const base = path
    .basename(input.filename, rawExt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "audio";
  const key = `listening/${base}-${randomUUID().slice(0, 8)}${ext}`;
  await getStorage().put({ key, body: input.bytes, contentType });

  await db.transaction(async (tx) => {
    await writeAuditLog(tx, {
      actorUserId: input.actor.id,
      action: "upload",
      entityType: "audio",
      entityId: key,
      summary: `Uploaded audio ${key}`,
      payload: { bytes: input.bytes.length },
    });
  });
  return { key };
}

