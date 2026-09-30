import "server-only";

import { asc, eq, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { quizQuestions, quizzes } from "@/db/schema";
import {
  asStatus,
  statusColumns,
  type WriteStatus,
  assertChildIdsFree,
  type AdminListRow,
  type Tx,
} from "@/lib/admin/common";
import type { ContentStatus, QuizEntity } from "@/lib/admin/validate";
import type { QuizContent } from "../../../content/schema";

export async function listQuizzes(): Promise<AdminListRow[]> {
  const rows = await db.select().from(quizzes).orderBy(asc(quizzes.createdAt));
  const counts = await db.select({ quizId: quizQuestions.quizId }).from(quizQuestions);
  const byQuiz = new Map<string, number>();
  for (const c of counts) byQuiz.set(c.quizId, (byQuiz.get(c.quizId) ?? 0) + 1);
  return rows.map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    level: q.level,
    status: asStatus(q.status),
    updatedAt: q.updatedAt,
    meta: `${byQuiz.get(q.id) ?? 0} questions · pass ${q.passScore}`,
  }));
}

async function loadQuizEntities(
  where?: SQL,
): Promise<{ entity: QuizEntity; status: ContentStatus }[]> {
  const rows = await db
    .select()
    .from(quizzes)
    .where(where)
    .orderBy(asc(quizzes.createdAt));
  if (rows.length === 0) return [];
  const questions = await db
    .select()
    .from(quizQuestions)
    .orderBy(asc(quizQuestions.sortOrder));

  return rows.map((q) => ({
    status: asStatus(q.status),
    entity: {
      id: q.id,
      slug: q.slug,
      title: q.title,
      kickEn: q.kickEn,
      kickVi: q.kickVi,
      breadcrumb: q.breadcrumb,
      level: q.level as QuizEntity["level"],
      descriptionEn: q.descriptionEn,
      descriptionVi: q.descriptionVi,
      timeLimitSeconds: q.timeLimitSeconds,
      passScore: q.passScore,
      questionTypes: q.questionTypes,
      lessonHref: q.lessonHref,
      nextHref: q.nextHref,
      nextLabel: q.nextLabel,
      encouragementEn: q.encouragementEn,
      encouragementVi: q.encouragementVi,
      questions: questions
        .filter((x) => x.quizId === q.id)
        .map((x) => ({
          id: x.id,
          sortOrder: x.sortOrder,
          type: x.type as QuizEntity["questions"][number]["type"],
          instructionVi: x.instructionVi,
          ...(x.promptVi != null ? { promptVi: x.promptVi } : {}),
          ...(x.hintEn != null ? { hintEn: x.hintEn } : {}),
          explanationEn: x.explanationEn,
          explanationVi: x.explanationVi,
          reviewBefore: x.reviewBefore,
          reviewAfter: x.reviewAfter,
          payload: x.payload,
        })),
    },
  }));
}

export async function getQuizForAdmin(
  id: string,
): Promise<{ entity: QuizEntity; status: ContentStatus } | null> {
  const [hit] = await loadQuizEntities(eq(quizzes.id, id));
  return hit ?? null;
}

export async function upsertQuiz(
  tx: Tx,
  q: QuizEntity,
  status: WriteStatus,
): Promise<void> {
  await assertChildIdsFree(
    tx,
    quizQuestions,
    quizQuestions.id,
    quizQuestions.quizId,
    q.questions.map((x) => x.id),
    q.id,
    "Question",
  );

  const values = {
    slug: q.slug,
    title: q.title,
    kickEn: q.kickEn,
    kickVi: q.kickVi,
    breadcrumb: q.breadcrumb,
    level: q.level,
    descriptionEn: q.descriptionEn,
    descriptionVi: q.descriptionVi,
    timeLimitSeconds: q.timeLimitSeconds,
    passScore: q.passScore,
    questionTypes: q.questionTypes,
    lessonHref: q.lessonHref,
    nextHref: q.nextHref,
    nextLabel: q.nextLabel,
    encouragementEn: q.encouragementEn,
    encouragementVi: q.encouragementVi,
  };
  const st = statusColumns(status);
  await tx
    .insert(quizzes)
    .values({ id: q.id, ...values, ...st.insert })
    .onConflictDoUpdate({
      target: quizzes.id,
      set: { ...values, ...st.update, updatedAt: new Date() },
    });

  await tx.delete(quizQuestions).where(eq(quizQuestions.quizId, q.id));
  if (q.questions.length) {
    await tx.insert(quizQuestions).values(
      q.questions.map((x) => ({
        id: x.id,
        quizId: q.id,
        sortOrder: x.sortOrder,
        type: x.type,
        instructionVi: x.instructionVi,
        promptVi: x.promptVi ?? null,
        hintEn: x.hintEn ?? null,
        explanationEn: x.explanationEn,
        explanationVi: x.explanationVi,
        reviewBefore: x.reviewBefore,
        reviewAfter: x.reviewAfter,
        payload: x.payload,
      })),
    );
  }
}

export async function setQuizStatus(
  tx: Tx,
  id: string,
  status: ContentStatus,
): Promise<boolean> {
  const res = await tx
    .update(quizzes)
    .set({ status, updatedAt: new Date() })
    .where(eq(quizzes.id, id))
    .returning({ id: quizzes.id });
  return res.length > 0;
}

export async function removeQuiz(tx: Tx, id: string): Promise<boolean> {
  const res = await tx
    .delete(quizzes)
    .where(eq(quizzes.id, id))
    .returning({ id: quizzes.id });
  return res.length > 0;
}

export async function exportQuizzes(status?: ContentStatus): Promise<QuizContent> {
  const all = await loadQuizEntities();
  return {
    quizzes: all
      .filter((x) => !status || x.status === status)
      .map((x) => x.entity),
  };
}

export async function importQuizzes(
  tx: Tx,
  content: QuizContent,
  status: WriteStatus,
): Promise<{ quizzes: number }> {
  for (const q of content.quizzes) await upsertQuiz(tx, q, status);
  return { quizzes: content.quizzes.length };
}
