import "server-only";

import { getGrammar, getGrammarTaxonomy } from "@/lib/admin/grammar";
import { getListening } from "@/lib/admin/listening";
import { getQuizForAdmin } from "@/lib/admin/quiz";
import { getReading } from "@/lib/admin/reading";
import { getGrammarTree } from "@/lib/data/grammar";
import { getListeningLessons } from "@/lib/data/listening";
import { getPassages } from "@/lib/data/reading";
import { mapGrammarLesson } from "@/lib/data/mappers/grammar";
import { mapListeningLesson } from "@/lib/data/mappers/listening";
import { mapQuiz, toPublicQuiz } from "@/lib/data/mappers/quiz";
import { mapReadingPassage } from "@/lib/data/mappers/reading";
import { getStorage } from "@/lib/storage";

/**
 * Draft-friendly previews: map a stored entity (any status) through the same
 * mappers the learner data layer uses, so the admin sees what learners will.
 */

export async function previewGrammar(id: string) {
  const hit = await getGrammar(id);
  if (!hit) return null;
  const l = hit.entity;
  const { families, groups } = await getGrammarTaxonomy();
  const family = families.find((f) => f.id === l.familyId);
  const group = groups.find((g) => g.id === l.groupId);
  if (!family || !group) return null;
  const tree = await getGrammarTree();
  const lesson = mapGrammarLesson(
    { ...l },
    { id: family.id, title: family.title },
    { id: group.id, title: group.title, familyId: group.familyId },
    [{ slug: l.slug }],
  );
  return {
    status: hit.status,
    lesson,
    tree,
    adjacent: { previous: null, next: null },
  };
}

export async function previewReading(id: string) {
  const hit = await getReading(id);
  if (!hit) return null;
  const p = hit.entity;
  const passages = await getPassages();
  const passage = mapReadingPassage(
    p,
    p.paragraphs,
    p.vocabulary,
    p.questions,
    [{ slug: p.slug }],
  );
  return {
    status: hit.status,
    passage,
    passages,
    progress: { done: 0, total: passages.length },
  };
}

export async function previewListening(id: string) {
  const hit = await getListening(id);
  if (!hit) return null;
  const l = hit.entity;
  const lessons = await getListeningLessons();
  const lesson = mapListeningLesson(
    l,
    l.transcript,
    l.blanks.map((b) => ({ ...b, accept: b.accept ?? null })),
    getStorage().publicUrl(l.audioPath),
  );
  return { status: hit.status, lesson, lessons, nextSlug: null };
}

export async function previewQuiz(id: string) {
  const hit = await getQuizForAdmin(id);
  if (!hit) return null;
  const q = hit.entity;
  const quiz = mapQuiz(
    q,
    q.questions.map((x) => ({
      ...x,
      promptVi: x.promptVi ?? null,
      hintEn: x.hintEn ?? null,
    })),
  );
  return { status: hit.status, quiz: toPublicQuiz(quiz) };
}
