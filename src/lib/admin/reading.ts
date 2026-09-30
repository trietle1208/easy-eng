import "server-only";

import { asc, eq, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  readingParagraphs,
  readingPassages,
  readingQuestions,
  readingVocabHighlights,
} from "@/db/schema";
import {
  asStatus,
  statusColumns,
  type WriteStatus,
  assertChildIdsFree,
  type AdminListRow,
  type Tx,
} from "@/lib/admin/common";
import type {
  ContentStatus,
  ReadingPassageEntity,
} from "@/lib/admin/validate";
import type { ReadingContent } from "../../../content/schema";

type Cefr = ReadingPassageEntity["level"];

export async function listReading(): Promise<AdminListRow[]> {
  const rows = await db
    .select()
    .from(readingPassages)
    .orderBy(asc(readingPassages.sortOrder));
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    level: p.level,
    status: asStatus(p.status),
    updatedAt: p.updatedAt,
    meta: `${p.topic} · ${p.minutes} min`,
  }));
}

async function loadPassageEntities(
  where?: SQL,
): Promise<{ entity: ReadingPassageEntity; status: ContentStatus }[]> {
  const passages = await db
    .select()
    .from(readingPassages)
    .where(where)
    .orderBy(asc(readingPassages.sortOrder));
  if (passages.length === 0) return [];

  const [paragraphs, vocab, questions] = await Promise.all([
    db.select().from(readingParagraphs).orderBy(asc(readingParagraphs.sortOrder)),
    db.select().from(readingVocabHighlights),
    db.select().from(readingQuestions).orderBy(asc(readingQuestions.sortOrder)),
  ]);

  return passages.map((p) => ({
    status: asStatus(p.status),
    entity: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      topic: p.topic,
      level: p.level as Cefr,
      minutes: p.minutes,
      wordCount: p.wordCount,
      newWordCount: p.newWordCount,
      familyLabel: p.familyLabel,
      sortOrder: p.sortOrder,
      paragraphs: paragraphs
        .filter((x) => x.passageId === p.id)
        .map((x) => ({
          id: x.id,
          sortOrder: x.sortOrder,
          vi: x.vi,
          segments: x.segments,
        })),
      vocabulary: vocab
        .filter((x) => x.passageId === p.id)
        .map((v) => ({
          id: v.id,
          word: v.word,
          ipa: v.ipa,
          partOfSpeech: v.partOfSpeech,
          meaningVi: v.meaningVi,
          level: v.level as Cefr,
        })),
      questions: questions
        .filter((x) => x.passageId === p.id)
        .map((q) => ({
          id: q.id,
          sortOrder: q.sortOrder,
          prompt: q.prompt,
          choices: q.choices,
          correctIndex: q.correctIndex,
        })),
    },
  }));
}

export async function getReading(
  id: string,
): Promise<{ entity: ReadingPassageEntity; status: ContentStatus } | null> {
  const [hit] = await loadPassageEntities(eq(readingPassages.id, id));
  return hit ?? null;
}

export async function upsertReadingPassage(
  tx: Tx,
  p: ReadingPassageEntity,
  status: WriteStatus,
): Promise<void> {
  await assertChildIdsFree(
    tx,
    readingParagraphs,
    readingParagraphs.id,
    readingParagraphs.passageId,
    p.paragraphs.map((x) => x.id),
    p.id,
    "Paragraph",
  );
  await assertChildIdsFree(
    tx,
    readingVocabHighlights,
    readingVocabHighlights.id,
    readingVocabHighlights.passageId,
    p.vocabulary.map((x) => x.id),
    p.id,
    "Vocabulary",
  );
  await assertChildIdsFree(
    tx,
    readingQuestions,
    readingQuestions.id,
    readingQuestions.passageId,
    p.questions.map((x) => x.id),
    p.id,
    "Question",
  );

  const values = {
    slug: p.slug,
    title: p.title,
    topic: p.topic,
    level: p.level,
    minutes: p.minutes,
    wordCount: p.wordCount,
    newWordCount: p.newWordCount,
    familyLabel: p.familyLabel,
    sortOrder: p.sortOrder,
  };
  const st = statusColumns(status);
  await tx
    .insert(readingPassages)
    .values({ id: p.id, ...values, ...st.insert })
    .onConflictDoUpdate({
      target: readingPassages.id,
      set: { ...values, ...st.update, updatedAt: new Date() },
    });

  // Children carry unique (parent, sortOrder) constraints → replace wholesale.
  await tx.delete(readingParagraphs).where(eq(readingParagraphs.passageId, p.id));
  await tx
    .delete(readingVocabHighlights)
    .where(eq(readingVocabHighlights.passageId, p.id));
  await tx.delete(readingQuestions).where(eq(readingQuestions.passageId, p.id));

  if (p.paragraphs.length) {
    await tx.insert(readingParagraphs).values(
      p.paragraphs.map((x) => ({
        id: x.id,
        passageId: p.id,
        sortOrder: x.sortOrder,
        vi: x.vi,
        segments: x.segments,
      })),
    );
  }
  if (p.vocabulary.length) {
    await tx.insert(readingVocabHighlights).values(
      p.vocabulary.map((v) => ({
        id: v.id,
        passageId: p.id,
        word: v.word,
        ipa: v.ipa,
        partOfSpeech: v.partOfSpeech,
        meaningVi: v.meaningVi,
        level: v.level,
      })),
    );
  }
  if (p.questions.length) {
    await tx.insert(readingQuestions).values(
      p.questions.map((q) => ({
        id: q.id,
        passageId: p.id,
        sortOrder: q.sortOrder,
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: q.correctIndex,
      })),
    );
  }
}

export async function setReadingStatus(
  tx: Tx,
  id: string,
  status: ContentStatus,
): Promise<boolean> {
  const res = await tx
    .update(readingPassages)
    .set({ status, updatedAt: new Date() })
    .where(eq(readingPassages.id, id))
    .returning({ id: readingPassages.id });
  return res.length > 0;
}

export async function removeReadingPassage(
  tx: Tx,
  id: string,
): Promise<boolean> {
  const res = await tx
    .delete(readingPassages)
    .where(eq(readingPassages.id, id))
    .returning({ id: readingPassages.id });
  return res.length > 0;
}

export async function exportReading(
  status?: ContentStatus,
): Promise<ReadingContent> {
  const all = await loadPassageEntities();
  return {
    passages: all
      .filter((x) => !status || x.status === status)
      .map((x) => x.entity),
  };
}

export async function importReading(
  tx: Tx,
  content: ReadingContent,
  status: WriteStatus,
): Promise<{ passages: number }> {
  for (const p of content.passages) await upsertReadingPassage(tx, p, status);
  return { passages: content.passages.length };
}
