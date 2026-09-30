import "server-only";

import { asc, eq, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  listeningDictationBlanks,
  listeningLessons,
  listeningTranscriptSentences,
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
  ListeningLessonEntity,
} from "@/lib/admin/validate";
import type { ListeningContent } from "../../../content/schema";

export async function listListening(): Promise<AdminListRow[]> {
  const rows = await db
    .select()
    .from(listeningLessons)
    .orderBy(asc(listeningLessons.sortOrder));
  return rows.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    level: l.level,
    status: asStatus(l.status),
    updatedAt: l.updatedAt,
    meta: `${l.topic} · ${Math.round(l.durationSeconds / 60)} min`,
  }));
}

async function loadLessonEntities(
  where?: SQL,
): Promise<{ entity: ListeningLessonEntity; status: ContentStatus }[]> {
  const lessons = await db
    .select()
    .from(listeningLessons)
    .where(where)
    .orderBy(asc(listeningLessons.sortOrder));
  if (lessons.length === 0) return [];

  const [transcript, blanks] = await Promise.all([
    db
      .select()
      .from(listeningTranscriptSentences)
      .orderBy(asc(listeningTranscriptSentences.sortOrder)),
    db
      .select()
      .from(listeningDictationBlanks)
      .orderBy(asc(listeningDictationBlanks.sortOrder)),
  ]);

  return lessons.map((l) => ({
    status: asStatus(l.status),
    entity: {
      id: l.id,
      slug: l.slug,
      title: l.title,
      topic: l.topic,
      level: l.level as ListeningLessonEntity["level"],
      durationSeconds: l.durationSeconds,
      audioPath: l.audioPath,
      speakers: l.speakers,
      accent: l.accent,
      familyLabel: l.familyLabel,
      sortOrder: l.sortOrder,
      transcript: transcript
        .filter((x) => x.lessonId === l.id)
        .map((s) => ({
          id: s.id,
          sortOrder: s.sortOrder,
          speaker: s.speaker,
          text: s.text,
          startMs: s.startMs,
          endMs: s.endMs,
        })),
      blanks: blanks
        .filter((x) => x.lessonId === l.id)
        .map((b) => ({
          id: b.id,
          sortOrder: b.sortOrder,
          promptBefore: b.promptBefore,
          promptAfter: b.promptAfter,
          answer: b.answer,
          accept: b.accept ?? null,
        })),
    },
  }));
}

export async function getListening(
  id: string,
): Promise<{ entity: ListeningLessonEntity; status: ContentStatus } | null> {
  const [hit] = await loadLessonEntities(eq(listeningLessons.id, id));
  return hit ?? null;
}

export async function upsertListeningLesson(
  tx: Tx,
  l: ListeningLessonEntity,
  status: WriteStatus,
): Promise<void> {
  await assertChildIdsFree(
    tx,
    listeningTranscriptSentences,
    listeningTranscriptSentences.id,
    listeningTranscriptSentences.lessonId,
    l.transcript.map((x) => x.id),
    l.id,
    "Transcript sentence",
  );
  await assertChildIdsFree(
    tx,
    listeningDictationBlanks,
    listeningDictationBlanks.id,
    listeningDictationBlanks.lessonId,
    l.blanks.map((x) => x.id),
    l.id,
    "Blank",
  );

  const values = {
    slug: l.slug,
    title: l.title,
    topic: l.topic,
    level: l.level,
    durationSeconds: l.durationSeconds,
    audioPath: l.audioPath,
    speakers: l.speakers,
    accent: l.accent,
    familyLabel: l.familyLabel,
    sortOrder: l.sortOrder,
  };
  const st = statusColumns(status);
  await tx
    .insert(listeningLessons)
    .values({ id: l.id, ...values, ...st.insert })
    .onConflictDoUpdate({
      target: listeningLessons.id,
      set: { ...values, ...st.update, updatedAt: new Date() },
    });

  await tx
    .delete(listeningTranscriptSentences)
    .where(eq(listeningTranscriptSentences.lessonId, l.id));
  await tx
    .delete(listeningDictationBlanks)
    .where(eq(listeningDictationBlanks.lessonId, l.id));

  if (l.transcript.length) {
    await tx.insert(listeningTranscriptSentences).values(
      l.transcript.map((s) => ({
        id: s.id,
        lessonId: l.id,
        sortOrder: s.sortOrder,
        speaker: s.speaker,
        text: s.text,
        startMs: s.startMs,
        endMs: s.endMs,
      })),
    );
  }
  if (l.blanks.length) {
    await tx.insert(listeningDictationBlanks).values(
      l.blanks.map((b) => ({
        id: b.id,
        lessonId: l.id,
        sortOrder: b.sortOrder,
        promptBefore: b.promptBefore,
        promptAfter: b.promptAfter,
        answer: b.answer,
        accept: b.accept ?? null,
      })),
    );
  }
}

export async function setListeningStatus(
  tx: Tx,
  id: string,
  status: ContentStatus,
): Promise<boolean> {
  const res = await tx
    .update(listeningLessons)
    .set({ status, updatedAt: new Date() })
    .where(eq(listeningLessons.id, id))
    .returning({ id: listeningLessons.id });
  return res.length > 0;
}

export async function removeListeningLesson(
  tx: Tx,
  id: string,
): Promise<boolean> {
  const res = await tx
    .delete(listeningLessons)
    .where(eq(listeningLessons.id, id))
    .returning({ id: listeningLessons.id });
  return res.length > 0;
}

export async function exportListening(
  status?: ContentStatus,
): Promise<ListeningContent> {
  const all = await loadLessonEntities();
  return {
    lessons: all
      .filter((x) => !status || x.status === status)
      .map((x) => x.entity),
  };
}

export async function importListening(
  tx: Tx,
  content: ListeningContent,
  status: WriteStatus,
): Promise<{ lessons: number }> {
  for (const l of content.lessons) await upsertListeningLesson(tx, l, status);
  return { lessons: content.lessons.length };
}
