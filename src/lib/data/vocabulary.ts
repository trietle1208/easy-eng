import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import {
  reviewLogs,
  userWordCards,
  wordSets,
  words,
} from "@/db/schema";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import {
  mapWord,
  mapWordSet,
  type WordRow,
} from "@/lib/data/mappers/vocabulary";
import {
  localDateString,
  newEntityId,
  recordActivityEvent,
} from "@/lib/data/progress-write";
import {
  emptyCardRow,
  foldSearch,
  gradeCard,
  type UiGrade,
} from "@/lib/fsrs";
import { getStorage } from "@/lib/storage";
import type {
  NewWordInput,
  ReviewDue,
  UpdateWordInput,
  UpdateWordSetInput,
  Word,
  WordSet,
  WordSetFilters,
  WordSetTopic,
} from "@/types/vocabulary";
import { WORD_SET_TOPICS as TOPICS } from "@/types/vocabulary";

export class VocabularyError extends Error {
  constructor(
    message: string,
    readonly code:
      | "DUPLICATE"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION",
  ) {
    super(message);
    this.name = "VocabularyError";
  }
}

function toWordRow(row: typeof words.$inferSelect): WordRow {
  return {
    id: row.id,
    wordSetId: row.wordSetId,
    word: row.word,
    ipa: row.ipa,
    partOfSpeech: row.partOfSpeech,
    level: row.level,
    meaningVi: row.meaningVi,
    definitionEn: row.definitionEn,
    examples: row.examples,
    collocations: row.collocations,
    notes: row.notes,
    imagePath: row.imagePath,
    createdAt: row.createdAt,
  };
}

function imagePublicUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("/files/") || imagePath.startsWith("http")) {
    return imagePath;
  }
  return getStorage().publicUrl(imagePath);
}

function imagePathFromInput(imageUrl?: string | null): string | null {
  if (imageUrl === null) return null;
  if (!imageUrl?.trim()) return null;
  const v = imageUrl.trim();
  if (v.startsWith("/files/")) return v.slice("/files/".length);
  return v;
}

function slugifySetId(title: string): string {
  const base =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "set";
  return `${base}-${newEntityId().slice(0, 8)}`;
}

async function visibleSetFilter(userId: string) {
  // System sets are learner-visible only once published (Phase 9 admin CMS).
  return or(
    and(isNull(wordSets.ownerId), eq(wordSets.status, "published")),
    eq(wordSets.ownerId, userId),
  );
}

/** Sets a learner may see: their own, or published system sets. */
const setIsVisibleSql = or(
  isNotNull(wordSets.ownerId),
  eq(wordSets.status, "published"),
);

async function assertSetAccessible(
  setId: string,
  userId: string,
): Promise<typeof wordSets.$inferSelect> {
  const [set] = await db
    .select()
    .from(wordSets)
    .where(eq(wordSets.id, setId))
    .limit(1);
  if (!set) throw new VocabularyError("Word set not found", "NOT_FOUND");
  if (set.ownerId && set.ownerId !== userId) {
    throw new VocabularyError("Word set not found", "NOT_FOUND");
  }
  if (!set.ownerId && set.status !== "published") {
    throw new VocabularyError("Word set not found", "NOT_FOUND");
  }
  return set;
}

async function findDuplicateWord(
  setId: string,
  wordText: string,
  userId: string,
  excludeId?: string,
): Promise<boolean> {
  const folded = wordText.trim().toLowerCase();
  const rows = await db
    .select({ id: words.id, word: words.word, ownerId: words.ownerId })
    .from(words)
    .where(
      and(
        eq(words.wordSetId, setId),
        or(isNull(words.ownerId), eq(words.ownerId, userId)),
      ),
    );
  return rows.some(
    (r) =>
      r.id !== excludeId && r.word.trim().toLowerCase() === folded,
  );
}

async function ensureCardForWord(
  userId: string,
  wordId: string,
  now = new Date(),
): Promise<void> {
  const empty = emptyCardRow(now);
  await db
    .insert(userWordCards)
    .values({
      id: newEntityId("card", userId, wordId),
      userId,
      wordId,
      due: empty.due,
      stability: empty.stability,
      difficulty: empty.difficulty,
      elapsedDays: empty.elapsedDays,
      scheduledDays: empty.scheduledDays,
      reps: empty.reps,
      lapses: empty.lapses,
      learningSteps: empty.learningSteps,
      state: empty.state,
      lastReview: empty.lastReview,
    })
    .onConflictDoNothing();
}

/** Create FSRS cards for every word in a set the user can access. */
export async function startWordSet(setId: string): Promise<number> {
  const user = await requireUser("/vocabulary");
  await assertSetAccessible(setId, user.id);

  const setWords = await db
    .select({ id: words.id })
    .from(words)
    .where(
      and(
        eq(words.wordSetId, setId),
        or(isNull(words.ownerId), eq(words.ownerId, user.id)),
      ),
    );

  const now = new Date();
  let created = 0;
  for (const w of setWords) {
    const before = await db
      .select({ id: userWordCards.id })
      .from(userWordCards)
      .where(
        and(
          eq(userWordCards.userId, user.id),
          eq(userWordCards.wordId, w.id),
        ),
      )
      .limit(1);
    if (before.length === 0) {
      await ensureCardForWord(user.id, w.id, now);
      created += 1;
    }
  }
  return created;
}

export async function getWordSets(
  filters: WordSetFilters = {},
): Promise<WordSet[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const level = filters.level ?? "all";
  const topic = filters.topic ?? "all";
  const query = filters.query?.trim() ?? "";

  const setRows = await db
    .select()
    .from(wordSets)
    .where(await visibleSetFilter(user.id))
    .orderBy(asc(wordSets.title));

  const setIds = setRows.map((s) => s.id);
  if (setIds.length === 0) return [];

  const wordRows = await db
    .select({
      id: words.id,
      wordSetId: words.wordSetId,
      ownerId: words.ownerId,
    })
    .from(words)
    .where(
      and(
        inArray(words.wordSetId, setIds),
        or(isNull(words.ownerId), eq(words.ownerId, user.id)),
      ),
    );

  const wordIds = wordRows.map((w) => w.id);
  const learnedByWord = new Map<string, boolean>();
  if (wordIds.length > 0) {
    const cards = await db
      .select({
        wordId: userWordCards.wordId,
        reps: userWordCards.reps,
        state: userWordCards.state,
      })
      .from(userWordCards)
      .where(
        and(
          eq(userWordCards.userId, user.id),
          inArray(userWordCards.wordId, wordIds),
        ),
      );
    for (const c of cards) {
      learnedByWord.set(c.wordId, c.reps > 0 || c.state > 0);
    }
  }

  const counts = new Map<string, { total: number; learned: number }>();
  for (const w of wordRows) {
    const cur = counts.get(w.wordSetId) ?? { total: 0, learned: 0 };
    cur.total += 1;
    if (learnedByWord.get(w.id)) cur.learned += 1;
    counts.set(w.wordSetId, cur);
  }

  const foldedQuery = query ? foldSearch(query) : "";

  return setRows
    .filter((s) => {
      if (level !== "all" && s.level !== level) return false;
      if (topic !== "all" && s.topic !== topic) return false;
      if (!foldedQuery) return true;
      return (
        foldSearch(s.title).includes(foldedQuery) ||
        foldSearch(s.titleVi).includes(foldedQuery) ||
        foldSearch(s.topic).includes(foldedQuery)
      );
    })
    .map((s) => {
      const c = counts.get(s.id) ?? { total: 0, learned: 0 };
      return mapWordSet(
        {
          id: s.id,
          title: s.title,
          titleVi: s.titleVi,
          topic: s.topic,
          level: s.level,
          ownerId: s.ownerId,
        },
        c.total,
        c.learned,
        s.ownerId === user.id,
      );
    });
}

export async function getTopicCounts(): Promise<
  Record<WordSetTopic | "all", number>
> {
  const user = await getCurrentUser();
  const result = Object.fromEntries(
    TOPICS.map((t) => [t, 0]),
  ) as Record<WordSetTopic | "all", number>;
  result.all = 0;
  if (!user) return result;

  const rows = await db
    .select({ topic: wordSets.topic, n: count() })
    .from(wordSets)
    .where(await visibleSetFilter(user.id))
    .groupBy(wordSets.topic);

  for (const row of rows) {
    const topic = row.topic as WordSetTopic;
    if (topic in result) {
      result[topic] = Number(row.n);
      result.all += Number(row.n);
    }
  }
  return result;
}

export async function getWord(id: string): Promise<Word | null> {
  const user = await getCurrentUser();
  const [row] = await db.select().from(words).where(eq(words.id, id)).limit(1);
  if (!row) return null;
  // System words (owner null) are public once their set is published;
  // user words require ownership.
  if (row.ownerId && (!user || row.ownerId !== user.id)) return null;
  if (!row.ownerId) {
    const [set] = await db
      .select({ status: wordSets.status })
      .from(wordSets)
      .where(eq(wordSets.id, row.wordSetId))
      .limit(1);
    if (!set || set.status !== "published") return null;
  }
  return mapWord(
    toWordRow(row),
    imagePublicUrl(row.imagePath),
    Boolean(user && row.ownerId === user.id),
  );
}

export async function getWordsInSet(setId: string): Promise<Word[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  await assertSetAccessible(setId, user.id);

  const rows = await db
    .select()
    .from(words)
    .where(
      and(
        eq(words.wordSetId, setId),
        or(isNull(words.ownerId), eq(words.ownerId, user.id)),
      ),
    )
    .orderBy(asc(words.word));

  return rows.map((r) =>
    mapWord(
      toWordRow(r),
      imagePublicUrl(r.imagePath),
      r.ownerId === user.id,
    ),
  );
}

export async function getReviewDueCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const now = new Date();
  const [row] = await db
    .select({ n: count() })
    .from(userWordCards)
    .innerJoin(words, eq(userWordCards.wordId, words.id))
    .innerJoin(wordSets, eq(words.wordSetId, wordSets.id))
    .where(
      and(
        eq(userWordCards.userId, user.id),
        lte(userWordCards.due, now),
        setIsVisibleSql,
      ),
    );
  return Number(row?.n ?? 0);
}

export async function getReviewDue(): Promise<ReviewDue | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const dueCards = await db
    .select({
      card: userWordCards,
      word: words,
      setTitle: wordSets.title,
    })
    .from(userWordCards)
    .innerJoin(words, eq(userWordCards.wordId, words.id))
    .innerJoin(wordSets, eq(words.wordSetId, wordSets.id))
    .where(
      and(
        eq(userWordCards.userId, user.id),
        lte(userWordCards.due, now),
        setIsVisibleSql,
      ),
    )
    .orderBy(asc(userWordCards.due))
    .limit(1);

  const hit = dueCards[0];
  if (!hit) {
    return null;
  }

  const totalDue = await getReviewDueCount();
  const setWordCount = await db
    .select({ n: count() })
    .from(words)
    .where(
      and(
        eq(words.wordSetId, hit.word.wordSetId),
        or(isNull(words.ownerId), eq(words.ownerId, user.id)),
      ),
    );

  // Position among due cards in this set (1-based display)
  const dueInSet = await db
    .select({ id: userWordCards.id })
    .from(userWordCards)
    .innerJoin(words, eq(userWordCards.wordId, words.id))
    .where(
      and(
        eq(userWordCards.userId, user.id),
        eq(words.wordSetId, hit.word.wordSetId),
        lte(userWordCards.due, now),
      ),
    )
    .orderBy(asc(userWordCards.due));
  const cardIndex =
    dueInSet.findIndex((c) => c.id === hit.card.id) + 1 || 1;

  return {
    count: totalDue,
    word: mapWord(
      toWordRow(hit.word),
      imagePublicUrl(hit.word.imagePath),
      hit.word.ownerId === user.id,
    ),
    setTitle: hit.setTitle,
    cardIndex,
    cardTotal: Number(setWordCount[0]?.n ?? totalDue),
    cardId: hit.card.id,
  };
}

export async function getSavedWordCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const [row] = await db
    .select({ n: count() })
    .from(words)
    .where(eq(words.ownerId, user.id));
  return Number(row?.n ?? 0);
}

export async function getAddedToday(): Promise<Word[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const today = localDateString(new Date(), user.timezone);
  // Fetch recent owned words and filter by the user's local calendar day.
  const rows = await db
    .select()
    .from(words)
    .where(eq(words.ownerId, user.id))
    .orderBy(desc(words.createdAt))
    .limit(100);

  return rows
    .filter((r) => localDateString(r.createdAt, user.timezone) === today)
    .slice(0, 20)
    .map((r) => mapWord(toWordRow(r), imagePublicUrl(r.imagePath), true));
}

export async function createWord(input: NewWordInput): Promise<Word> {
  const user = await requireUser("/vocabulary/new");
  const wordText = input.word.trim();
  if (!wordText) {
    throw new VocabularyError("Word is required", "VALIDATION");
  }

  let setId = input.wordSetId?.trim() || "";
  if (!setId && input.newWordSetTitle?.trim()) {
    const title = input.newWordSetTitle.trim();
    const [existingSet] = await db
      .select({ id: wordSets.id })
      .from(wordSets)
      .where(and(eq(wordSets.ownerId, user.id), eq(wordSets.title, title)))
      .limit(1);
    if (existingSet) {
      setId = existingSet.id;
    } else {
      setId = slugifySetId(title);
      await db.insert(wordSets).values({
        id: setId,
        title,
        titleVi: title,
        topic: "Daily life",
        level: input.level,
        ownerId: user.id,
      });
    }
  }
  if (!setId) {
    throw new VocabularyError(
      "Pick a word set or create a new one",
      "VALIDATION",
    );
  }

  await assertSetAccessible(setId, user.id);

  if (await findDuplicateWord(setId, wordText, user.id)) {
    throw new VocabularyError(
      "You already have this word in this set",
      "DUPLICATE",
    );
  }

  const id = newEntityId();
  const now = new Date();
  const imagePath = imagePathFromInput(input.imageUrl);
  const examples = (input.examples ?? [])
    .map((en) => en.trim())
    .filter(Boolean)
    .map((en) => ({ en }));

  await db.insert(words).values({
    id,
    wordSetId: setId,
    ownerId: user.id,
    word: wordText,
    ipa: input.ipa?.trim() ?? "",
    partOfSpeech: input.partOfSpeech,
    level: input.level,
    meaningVi: input.meaningVi.trim(),
    definitionEn: input.definitionEn?.trim() ?? "",
    examples,
    notes: input.notes?.trim() || null,
    imagePath,
    createdAt: now,
  });

  await ensureCardForWord(user.id, id, now);
  await recordActivityEvent({
    userId: user.id,
    timezone: user.timezone,
    kind: "word_added",
    ref: id,
    payload: { word: wordText, wordSetId: setId },
  });

  return mapWord(
    {
      id,
      wordSetId: setId,
      word: wordText,
      ipa: input.ipa?.trim() ?? "",
      partOfSpeech: input.partOfSpeech,
      level: input.level,
      meaningVi: input.meaningVi.trim(),
      definitionEn: input.definitionEn?.trim() ?? "",
      examples,
      collocations: null,
      notes: input.notes?.trim() || null,
      imagePath,
      createdAt: now,
    },
    imagePublicUrl(imagePath),
    true,
  );
}

export async function updateWord(input: UpdateWordInput): Promise<Word> {
  const user = await requireUser("/vocabulary");
  const [existing] = await db
    .select()
    .from(words)
    .where(eq(words.id, input.id))
    .limit(1);
  if (!existing) throw new VocabularyError("Word not found", "NOT_FOUND");
  if (!existing.ownerId || existing.ownerId !== user.id) {
    throw new VocabularyError("Cannot edit system or others' words", "FORBIDDEN");
  }

  const nextWord = input.word?.trim() ?? existing.word;
  if (
    input.word &&
    (await findDuplicateWord(existing.wordSetId, nextWord, user.id, existing.id))
  ) {
    throw new VocabularyError(
      "You already have this word in this set",
      "DUPLICATE",
    );
  }

  const imagePath =
    input.imageUrl === undefined
      ? existing.imagePath
      : imagePathFromInput(input.imageUrl);

  const examples =
    input.examples === undefined
      ? existing.examples
      : input.examples
          .map((en) => en.trim())
          .filter(Boolean)
          .map((en) => ({ en }));

  await db
    .update(words)
    .set({
      word: nextWord,
      ipa: input.ipa !== undefined ? input.ipa.trim() : existing.ipa,
      partOfSpeech: input.partOfSpeech ?? existing.partOfSpeech,
      level: input.level ?? existing.level,
      meaningVi:
        input.meaningVi !== undefined
          ? input.meaningVi.trim()
          : existing.meaningVi,
      definitionEn:
        input.definitionEn !== undefined
          ? input.definitionEn.trim()
          : existing.definitionEn,
      examples,
      notes:
        input.notes !== undefined
          ? input.notes.trim() || null
          : existing.notes,
      imagePath,
    })
    .where(eq(words.id, existing.id));

  const [updated] = await db
    .select()
    .from(words)
    .where(eq(words.id, existing.id))
    .limit(1);
  return mapWord(toWordRow(updated!), imagePublicUrl(updated!.imagePath), true);
}

export async function deleteWord(id: string): Promise<void> {
  const user = await requireUser("/vocabulary");
  const [existing] = await db
    .select()
    .from(words)
    .where(eq(words.id, id))
    .limit(1);
  if (!existing) throw new VocabularyError("Word not found", "NOT_FOUND");
  if (!existing.ownerId || existing.ownerId !== user.id) {
    throw new VocabularyError(
      "Cannot delete system or others' words",
      "FORBIDDEN",
    );
  }
  if (existing.imagePath) {
    await getStorage().delete(existing.imagePath).catch(() => undefined);
  }
  await db.delete(words).where(eq(words.id, id));
}

export async function updateWordSet(
  input: UpdateWordSetInput,
): Promise<WordSet> {
  const user = await requireUser("/vocabulary");
  const [existing] = await db
    .select()
    .from(wordSets)
    .where(eq(wordSets.id, input.id))
    .limit(1);
  if (!existing) throw new VocabularyError("Word set not found", "NOT_FOUND");
  if (!existing.ownerId || existing.ownerId !== user.id) {
    throw new VocabularyError(
      "Cannot edit system or others' sets",
      "FORBIDDEN",
    );
  }

  await db
    .update(wordSets)
    .set({
      title: input.title?.trim() || existing.title,
      titleVi: input.titleVi?.trim() || existing.titleVi,
      topic: input.topic ?? existing.topic,
      level: input.level ?? existing.level,
    })
    .where(eq(wordSets.id, existing.id));

  const sets = await getWordSets();
  const hit = sets.find((s) => s.id === existing.id);
  if (!hit) throw new VocabularyError("Word set not found", "NOT_FOUND");
  return hit;
}

export async function deleteWordSet(id: string): Promise<void> {
  const user = await requireUser("/vocabulary");
  const [existing] = await db
    .select()
    .from(wordSets)
    .where(eq(wordSets.id, id))
    .limit(1);
  if (!existing) throw new VocabularyError("Word set not found", "NOT_FOUND");
  if (!existing.ownerId || existing.ownerId !== user.id) {
    throw new VocabularyError(
      "Cannot delete system or others' sets",
      "FORBIDDEN",
    );
  }
  await db.delete(wordSets).where(eq(wordSets.id, id));
}

export async function gradeReview(
  cardId: string,
  grade: UiGrade,
): Promise<ReviewDue | null> {
  const user = await requireUser("/vocabulary");
  const [row] = await db
    .select()
    .from(userWordCards)
    .where(
      and(eq(userWordCards.id, cardId), eq(userWordCards.userId, user.id)),
    )
    .limit(1);
  if (!row) throw new VocabularyError("Card not found", "NOT_FOUND");

  const now = new Date();
  const graded = gradeCard(
    {
      due: row.due,
      stability: row.stability,
      difficulty: row.difficulty,
      elapsedDays: row.elapsedDays,
      scheduledDays: row.scheduledDays,
      reps: row.reps,
      lapses: row.lapses,
      learningSteps: row.learningSteps,
      state: row.state,
      lastReview: row.lastReview,
    },
    grade,
    now,
  );

  await db
    .update(userWordCards)
    .set({
      due: graded.card.due,
      stability: graded.card.stability,
      difficulty: graded.card.difficulty,
      elapsedDays: graded.card.elapsedDays,
      scheduledDays: graded.card.scheduledDays,
      reps: graded.card.reps,
      lapses: graded.card.lapses,
      learningSteps: graded.card.learningSteps,
      state: graded.card.state,
      lastReview: graded.card.lastReview,
    })
    .where(eq(userWordCards.id, row.id));

  await db.insert(reviewLogs).values({
    id: newEntityId(),
    userId: user.id,
    cardId: row.id,
    rating: graded.log.rating,
    scheduledDays: graded.log.scheduledDays,
    elapsedDays: graded.log.elapsedDays,
    review: graded.log.review,
    state: graded.log.state,
  });

  await recordActivityEvent({
    userId: user.id,
    timezone: user.timezone,
    kind: "review_done",
    ref: `${row.id}:${graded.log.review.toISOString()}`,
    payload: {
      cardId: row.id,
      wordId: row.wordId,
      grade,
      rating: graded.log.rating,
    },
  });

  return getReviewDue();
}

/** Validate and store a vocabulary image; returns public URL. */
export async function uploadWordImage(input: {
  bytes: Buffer;
  contentType: string;
  fileName?: string;
}): Promise<{ key: string; url: string }> {
  const user = await requireUser("/vocabulary/new");
  const allowed = new Map([
    ["image/jpeg", "jpg"],
    ["image/jpg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);
  const ext = allowed.get(input.contentType.toLowerCase());
  if (!ext) {
    throw new VocabularyError(
      "Image must be jpg, png, or webp",
      "VALIDATION",
    );
  }
  const maxBytes = 2 * 1024 * 1024;
  if (input.bytes.byteLength > maxBytes) {
    throw new VocabularyError("Image must be ≤ 2 MB", "VALIDATION");
  }

  const key = `vocabulary/${user.id}/${newEntityId()}.${ext}`;
  const storage = getStorage();
  await storage.put({
    key,
    body: input.bytes,
    contentType: input.contentType,
  });
  return { key, url: storage.publicUrl(key) };
}
