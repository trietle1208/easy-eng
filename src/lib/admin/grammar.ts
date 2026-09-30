import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  grammarFamilies,
  grammarGroups,
  grammarLessons,
} from "@/db/schema";
import {
  asStatus,
  statusColumns,
  type WriteStatus,
  conflictError,
  type AdminListRow,
  type Tx,
} from "@/lib/admin/common";
import type {
  ContentStatus,
  GrammarLessonEntity,
} from "@/lib/admin/validate";
import type { GrammarContent } from "../../../content/schema";

type LessonRow = typeof grammarLessons.$inferSelect;

export function grammarRowToEntity(l: LessonRow): GrammarLessonEntity {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    level: l.level as GrammarLessonEntity["level"],
    familyId: l.familyId,
    groupId: l.groupId,
    sortOrder: l.sortOrder,
    readMinutes: l.readMinutes,
    introEn: l.introEn,
    introVi: l.introVi,
    useWhenEn: l.useWhenEn,
    useWhenVi: l.useWhenVi,
    structure: l.structure,
    examples: l.examples,
    mistakes: l.mistakes,
    practiceQuizSlug: l.practiceQuizSlug,
    practiceQuestionCount: l.practiceQuestionCount,
    practiceMinutes: l.practiceMinutes,
  };
}

export async function listGrammar(): Promise<AdminListRow[]> {
  const rows = await db
    .select({
      lesson: grammarLessons,
      family: grammarFamilies.title,
      group: grammarGroups.title,
    })
    .from(grammarLessons)
    .innerJoin(grammarFamilies, eq(grammarLessons.familyId, grammarFamilies.id))
    .innerJoin(grammarGroups, eq(grammarLessons.groupId, grammarGroups.id))
    .orderBy(
      asc(grammarFamilies.sortOrder),
      asc(grammarGroups.sortOrder),
      asc(grammarLessons.sortOrder),
    );
  return rows.map((r) => ({
    id: r.lesson.id,
    slug: r.lesson.slug,
    title: r.lesson.title,
    level: r.lesson.level,
    status: asStatus(r.lesson.status),
    updatedAt: r.lesson.updatedAt,
    meta: `${r.family} › ${r.group}`,
  }));
}

export async function getGrammar(
  id: string,
): Promise<{ entity: GrammarLessonEntity; status: ContentStatus } | null> {
  const [row] = await db
    .select()
    .from(grammarLessons)
    .where(eq(grammarLessons.id, id))
    .limit(1);
  if (!row) return null;
  return { entity: grammarRowToEntity(row), status: asStatus(row.status) };
}

export async function getGrammarTaxonomy() {
  const [families, groups] = await Promise.all([
    db.select().from(grammarFamilies).orderBy(asc(grammarFamilies.sortOrder)),
    db.select().from(grammarGroups).orderBy(asc(grammarGroups.sortOrder)),
  ]);
  return { families, groups };
}

export async function upsertGrammarFamily(
  tx: Tx,
  f: { id: string; title: string; sortOrder: number },
): Promise<void> {
  await tx
    .insert(grammarFamilies)
    .values(f)
    .onConflictDoUpdate({
      target: grammarFamilies.id,
      set: { title: f.title, sortOrder: f.sortOrder, updatedAt: new Date() },
    });
}

export async function upsertGrammarGroup(
  tx: Tx,
  g: { id: string; familyId: string; title: string; sortOrder: number },
): Promise<void> {
  const [family] = await tx
    .select({ id: grammarFamilies.id })
    .from(grammarFamilies)
    .where(eq(grammarFamilies.id, g.familyId))
    .limit(1);
  if (!family) {
    throw conflictError(`Unknown family "${g.familyId}"`, "familyId");
  }
  await tx
    .insert(grammarGroups)
    .values(g)
    .onConflictDoUpdate({
      target: grammarGroups.id,
      set: {
        familyId: g.familyId,
        title: g.title,
        sortOrder: g.sortOrder,
        updatedAt: new Date(),
      },
    });
}

export async function upsertGrammarLesson(
  tx: Tx,
  l: GrammarLessonEntity,
  status: WriteStatus,
): Promise<void> {
  const [group] = await tx
    .select({ id: grammarGroups.id, familyId: grammarGroups.familyId })
    .from(grammarGroups)
    .where(eq(grammarGroups.id, l.groupId))
    .limit(1);
  if (!group) throw conflictError(`Unknown group "${l.groupId}"`, "groupId");
  if (group.familyId !== l.familyId) {
    throw conflictError(
      "The selected group does not belong to the selected family",
      "groupId",
    );
  }

  const values = {
    slug: l.slug,
    title: l.title,
    level: l.level,
    familyId: l.familyId,
    groupId: l.groupId,
    sortOrder: l.sortOrder,
    readMinutes: l.readMinutes,
    introEn: l.introEn,
    introVi: l.introVi,
    useWhenEn: l.useWhenEn,
    useWhenVi: l.useWhenVi,
    structure: l.structure,
    examples: l.examples,
    mistakes: l.mistakes,
    practiceQuizSlug: l.practiceQuizSlug,
    practiceQuestionCount: l.practiceQuestionCount,
    practiceMinutes: l.practiceMinutes,
  };
  const st = statusColumns(status);
  await tx
    .insert(grammarLessons)
    .values({ id: l.id, ...values, ...st.insert })
    .onConflictDoUpdate({
      target: grammarLessons.id,
      set: { ...values, ...st.update, updatedAt: new Date() },
    });
}

export async function setGrammarStatus(
  tx: Tx,
  id: string,
  status: ContentStatus,
): Promise<boolean> {
  const res = await tx
    .update(grammarLessons)
    .set({ status, updatedAt: new Date() })
    .where(eq(grammarLessons.id, id))
    .returning({ id: grammarLessons.id });
  return res.length > 0;
}

export async function removeGrammarLesson(
  tx: Tx,
  id: string,
): Promise<boolean> {
  const res = await tx
    .delete(grammarLessons)
    .where(eq(grammarLessons.id, id))
    .returning({ id: grammarLessons.id });
  return res.length > 0;
}

export async function exportGrammar(
  status?: ContentStatus,
): Promise<GrammarContent> {
  const [families, groups, lessons] = await Promise.all([
    db.select().from(grammarFamilies).orderBy(asc(grammarFamilies.sortOrder)),
    db.select().from(grammarGroups).orderBy(asc(grammarGroups.sortOrder)),
    db
      .select()
      .from(grammarLessons)
      .where(status ? eq(grammarLessons.status, status) : undefined)
      .orderBy(asc(grammarLessons.sortOrder)),
  ]);
  return {
    families: families.map((f) => ({
      id: f.id,
      title: f.title,
      sortOrder: f.sortOrder,
    })),
    groups: groups.map((g) => ({
      id: g.id,
      familyId: g.familyId,
      title: g.title,
      sortOrder: g.sortOrder,
    })),
    lessons: lessons.map(grammarRowToEntity),
  };
}

export async function importGrammar(
  tx: Tx,
  content: GrammarContent,
  status: WriteStatus,
): Promise<{ lessons: number }> {
  for (const f of content.families) await upsertGrammarFamily(tx, f);
  for (const g of content.groups) await upsertGrammarGroup(tx, g);
  for (const l of content.lessons) await upsertGrammarLesson(tx, l, status);
  return { lessons: content.lessons.length };
}
