import "server-only";

import { and, asc, count, eq, inArray, isNull, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { wordSets, words } from "@/db/schema";
import {
  asStatus,
  statusColumns,
  type WriteStatus,
  assertChildIdsFree,
  conflictError,
  type AdminListRow,
  type Tx,
} from "@/lib/admin/common";
import type {
  ContentStatus,
  WordEntity,
  WordSetBundle,
  WordSetEntity,
} from "@/lib/admin/validate";
import type { VocabularyContent } from "../../../content/schema";

type Cefr = WordSetEntity["level"];

function wordRowToEntity(w: typeof words.$inferSelect): WordEntity {
  return {
    id: w.id,
    wordSetId: w.wordSetId,
    word: w.word,
    ipa: w.ipa,
    partOfSpeech: w.partOfSpeech,
    level: w.level as Cefr,
    meaningVi: w.meaningVi,
    definitionEn: w.definitionEn,
    examples: w.examples,
    collocations: w.collocations ?? null,
    notes: w.notes ?? null,
    imagePath: w.imagePath ?? null,
    source: w.source,
    sortOrder: w.sortOrder,
    reviewStatus: w.reviewStatus as WordEntity["reviewStatus"],
    ipaStatus: w.ipaStatus as WordEntity["ipaStatus"],
    createdAt: w.createdAt.toISOString(),
  };
}

export async function listWordSets(filters?: {
  status?: ContentStatus | "all";
  topic?: string | "all";
}): Promise<AdminListRow[]> {
  const status = filters?.status ?? "all";
  const topic = filters?.topic ?? "all";
  const sets = await db
    .select()
    .from(wordSets)
    .where(
      and(
        isNull(wordSets.ownerId),
        status !== "all" ? eq(wordSets.status, status) : undefined,
        topic !== "all" ? eq(wordSets.topic, topic) : undefined,
      ),
    )
    .orderBy(asc(wordSets.sortOrder), asc(wordSets.title));
  const counts = await db
    .select({ wordSetId: words.wordSetId, n: count() })
    .from(words)
    .where(isNull(words.ownerId))
    .groupBy(words.wordSetId);
  const byId = new Map(counts.map((c) => [c.wordSetId, Number(c.n)]));
  return sets.map((s) => ({
    id: s.id,
    slug: s.id,
    title: s.title,
    level: s.level,
    status: asStatus(s.status),
    updatedAt: s.createdAt,
    meta: `${s.topic} · ${byId.get(s.id) ?? 0} words · sort ${s.sortOrder}`,
    topic: s.topic,
  }));
}

export async function getWordSetBundle(
  id: string,
): Promise<{ bundle: WordSetBundle; status: ContentStatus } | null> {
  const [set] = await db
    .select()
    .from(wordSets)
    .where(and(eq(wordSets.id, id), isNull(wordSets.ownerId)))
    .limit(1);
  if (!set) return null;
  const rows = await db
    .select()
    .from(words)
    .where(and(eq(words.wordSetId, id), isNull(words.ownerId)))
    .orderBy(asc(words.sortOrder), asc(words.createdAt), asc(words.word));
  return {
    status: asStatus(set.status),
    bundle: {
      set: {
        id: set.id,
        title: set.title,
        titleVi: set.titleVi,
        topic: set.topic,
        level: set.level as Cefr,
        status: asStatus(set.status),
        sortOrder: set.sortOrder,
      },
      words: rows.map(wordRowToEntity),
    },
  };
}

export async function upsertWordSet(
  tx: Tx,
  bundle: WordSetBundle,
  status: WriteStatus,
  opts: { prune?: boolean } = {},
): Promise<void> {
  const { set } = bundle;
  const [existing] = await tx
    .select({ ownerId: wordSets.ownerId })
    .from(wordSets)
    .where(eq(wordSets.id, set.id))
    .limit(1);
  if (existing?.ownerId) {
    throw conflictError(
      `"${set.id}" is a personal word set — admin can only manage system sets.`,
    );
  }

  await assertChildIdsFree(
    tx,
    words,
    words.id,
    words.wordSetId,
    bundle.words.map((w) => w.id),
    set.id,
    "Word",
  );

  const values = {
    title: set.title,
    titleVi: set.titleVi,
    topic: set.topic,
    level: set.level,
    ownerId: null,
    sortOrder: set.sortOrder ?? 0,
  };
  const st = statusColumns(status);
  await tx
    .insert(wordSets)
    .values({ id: set.id, ...values, ...st.insert })
    .onConflictDoUpdate({ target: wordSets.id, set: { ...values, ...st.update } });

  // Upsert (never delete-all): learners' FSRS cards reference word ids.
  for (const [i, w] of bundle.words.entries()) {
    const row = {
      wordSetId: set.id,
      ownerId: null,
      word: w.word,
      ipa: w.ipa,
      partOfSpeech: w.partOfSpeech,
      level: w.level,
      meaningVi: w.meaningVi,
      definitionEn: w.definitionEn,
      examples: w.examples,
      collocations: w.collocations ?? null,
      notes: w.notes ?? null,
      imagePath: w.imagePath ?? null,
      source: w.source ?? "admin",
      sortOrder: w.sortOrder ?? i,
      reviewStatus: w.reviewStatus ?? "human_reviewed",
      ipaStatus: w.ipaStatus ?? null,
    };
    await tx
      .insert(words)
      .values({
        id: w.id,
        ...row,
        createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
      })
      .onConflictDoUpdate({ target: words.id, set: row });
  }

  // Editor saves are authoritative; file imports are additive (like the seeder).
  if (opts.prune === false) return;

  // Remove system words dropped from the editor (keeps users' own words in the set).
  const keep = bundle.words.map((w) => w.id);
  await tx
    .delete(words)
    .where(
      and(
        eq(words.wordSetId, set.id),
        isNull(words.ownerId),
        keep.length ? notInArray(words.id, keep) : undefined,
      ),
    );
}

export async function setWordSetStatus(
  tx: Tx,
  id: string,
  status: ContentStatus,
): Promise<boolean> {
  const res = await tx
    .update(wordSets)
    .set({ status })
    .where(and(eq(wordSets.id, id), isNull(wordSets.ownerId)))
    .returning({ id: wordSets.id });
  return res.length > 0;
}

export async function removeWordSet(tx: Tx, id: string): Promise<boolean> {
  const res = await tx
    .delete(wordSets)
    .where(and(eq(wordSets.id, id), isNull(wordSets.ownerId)))
    .returning({ id: wordSets.id });
  return res.length > 0;
}

export async function exportVocabulary(
  status?: ContentStatus,
): Promise<VocabularyContent> {
  const sets = await db
    .select()
    .from(wordSets)
    .where(
      and(isNull(wordSets.ownerId), status ? eq(wordSets.status, status) : undefined),
    )
    .orderBy(asc(wordSets.title));
  const setIds = sets.map((s) => s.id);
  const rows = setIds.length
    ? await db
        .select()
        .from(words)
        .where(and(inArray(words.wordSetId, setIds), isNull(words.ownerId)))
        .orderBy(asc(words.createdAt), asc(words.word))
    : [];
  return {
    sets: sets.map((s) => ({
      id: s.id,
      title: s.title,
      titleVi: s.titleVi,
      topic: s.topic,
      level: s.level as Cefr,
      status: asStatus(s.status),
      sortOrder: s.sortOrder,
    })),
    words: rows.map(wordRowToEntity),
  };
}

export async function importVocabulary(
  tx: Tx,
  content: VocabularyContent,
  status: WriteStatus,
): Promise<{ sets: number; words: number }> {
  for (const set of content.sets) {
    await upsertWordSet(
      tx,
      {
        set,
        words: content.words.filter((w) => w.wordSetId === set.id),
      },
      status,
      { prune: false },
    );
  }
  return { sets: content.sets.length, words: content.words.length };
}
