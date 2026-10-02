import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  grammarFamilies,
  grammarGroups,
  grammarLessons,
  userLessonProgress,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/data/cache-tags";
import { cacheContentQuery } from "@/lib/data/content-cache";
import {
  familyDisplayTitle,
  mapGrammarLesson,
  mapGrammarLessonSummary,
  type GrammarFamilyRow,
  type GrammarGroupRow,
  type GrammarLessonRow,
} from "@/lib/data/mappers/grammar";
import { flagsFor, loadProgressFlags } from "@/lib/data/progress-flags";
import { upsertLessonProgress } from "@/lib/data/progress-write";
import type {
  AdjacentLessons,
  GrammarFilters,
  GrammarLesson,
  GrammarLessonSummary,
  GrammarTree,
} from "@/types/grammar";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";

type LessonJoinRow = {
  lesson: typeof grammarLessons.$inferSelect;
  family: typeof grammarFamilies.$inferSelect;
  group: typeof grammarGroups.$inferSelect;
};

function toLessonRow(row: LessonJoinRow): GrammarLessonRow {
  const l = row.lesson;
  return {
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
}

const loadAllLessonsOrdered = cacheContentQuery(
  async (): Promise<LessonJoinRow[]> => {
    return db
      .select({
        lesson: grammarLessons,
        family: grammarFamilies,
        group: grammarGroups,
      })
      .from(grammarLessons)
      .innerJoin(grammarFamilies, eq(grammarLessons.familyId, grammarFamilies.id))
      .innerJoin(grammarGroups, eq(grammarLessons.groupId, grammarGroups.id))
      .where(eq(grammarLessons.status, "published"))
      .orderBy(
        asc(grammarFamilies.sortOrder),
        asc(grammarGroups.sortOrder),
        asc(grammarLessons.sortOrder),
      );
  },
  ["grammar-lessons-all"],
  [CONTENT_CACHE_TAGS.grammar],
);

const loadCatalogMeta = cacheContentQuery(
  async () => {
    const [families, groups] = await Promise.all([
      db
        .select()
        .from(grammarFamilies)
        .orderBy(asc(grammarFamilies.sortOrder)),
      db.select().from(grammarGroups).orderBy(asc(grammarGroups.sortOrder)),
    ]);
    return { families, groups };
  },
  ["grammar-catalog-meta"],
  [CONTENT_CACHE_TAGS.grammar],
);

function summariesFromRows(rows: LessonJoinRow[]): GrammarLessonSummary[] {
  return rows.map((r) => mapGrammarLessonSummary(toLessonRow(r)));
}

export async function getFirstGrammarLessonSlug(): Promise<string> {
  const rows = await loadAllLessonsOrdered();
  if (!rows[0]) {
    throw new Error("No grammar lessons seeded");
  }
  return rows[0].lesson.slug;
}

export async function getLesson(
  slug: string,
): Promise<GrammarLesson | null> {
  const rows = await loadAllLessonsOrdered();
  const hit = rows.find((r) => r.lesson.slug === slug);
  if (!hit) return null;

  const groupLessons = rows
    .filter((r) => r.lesson.groupId === hit.lesson.groupId)
    .map((r) => ({ slug: r.lesson.slug }));

  const family: GrammarFamilyRow = {
    id: hit.family.id,
    title: hit.family.title,
  };
  const group: GrammarGroupRow = {
    id: hit.group.id,
    title: hit.group.title,
    familyId: hit.group.familyId,
  };

  return mapGrammarLesson(toLessonRow(hit), family, group, groupLessons);
}

/** Record a grammar lesson visit as in-progress (no-op when anonymous). */
export async function recordGrammarVisit(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const rows = await loadAllLessonsOrdered();
  const hit = rows.find((r) => r.lesson.slug === slug);
  if (!hit) return;

  await upsertLessonProgress({
    userId: user.id,
    contentKind: "grammar",
    contentId: slug,
    status: "in_progress",
    progressPercent: 10,
    lastPosition: { section: "visit" },
  });
}

/**
 * Manually mark a grammar lesson completed (or undo back to in-progress).
 * No activity event on purpose: only the practice quiz counts toward goals.
 */
export async function setGrammarCompleted(
  slug: string,
  completed: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const rows = await loadAllLessonsOrdered();
  if (!rows.some((r) => r.lesson.slug === slug)) return;

  if (completed) {
    await upsertLessonProgress({
      userId: user.id,
      contentKind: "grammar",
      contentId: slug,
      status: "completed",
      progressPercent: 100,
    });
    return;
  }

  // upsertLessonProgress never downgrades `completed`, so undo writes directly.
  await db
    .update(userLessonProgress)
    .set({ status: "in_progress", progressPercent: 10, updatedAt: new Date() })
    .where(
      and(
        eq(userLessonProgress.userId, user.id),
        eq(userLessonProgress.contentKind, "grammar"),
        eq(userLessonProgress.contentId, slug),
      ),
    );
}

export async function getAdjacentLessons(
  slug: string,
): Promise<AdjacentLessons> {
  const all = summariesFromRows(await loadAllLessonsOrdered());
  const index = all.findIndex((l) => l.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? all[index - 1]! : null,
    next: index < all.length - 1 ? all[index + 1]! : null,
  };
}

export async function getGrammarTree(
  filters: GrammarFilters = {},
): Promise<GrammarTree> {
  const familyId = filters.familyId ?? "all";
  const groupId = filters.groupId ?? "all";
  const level = filters.level ?? "all";

  const [{ families: familyRows, groups: groupRows }, lessonRows] =
    await Promise.all([loadCatalogMeta(), loadAllLessonsOrdered()]);

  const user = await getCurrentUser();
  const progress = user
    ? await loadProgressFlags(
        user.id,
        "grammar",
        lessonRows.map((r) => r.lesson.slug),
      )
    : new Map();

  const familyOptions = familyRows.map((f) => ({
    id: f.id,
    title: f.title,
  }));

  const groupOptions = groupRows.map((g) => ({
    id: g.id,
    title: g.title,
    familyId: g.familyId,
  }));

  const filteredRows = lessonRows.filter((r) => {
    if (familyId !== "all" && r.lesson.familyId !== familyId) return false;
    if (groupId !== "all" && r.lesson.groupId !== groupId) return false;
    if (level !== "all" && r.lesson.level !== level) return false;
    return true;
  });

  const families = familyRows
    .filter((f) => familyId === "all" || f.id === familyId)
    .map((family) => {
      const groups = groupRows
        .filter((g) => g.familyId === family.id)
        .filter((g) => groupId === "all" || g.id === groupId)
        .map((group) => {
          const lessons = filteredRows
            .filter((r) => r.lesson.groupId === group.id)
            .map((r) => {
              const flags = flagsFor(progress, r.lesson.slug);
              return {
                ...mapGrammarLessonSummary(toLessonRow(r)),
                completed: flags.completed,
                inProgress: flags.inProgress || undefined,
              };
            });
          return { id: group.id, title: group.title, lessons };
        })
        .filter((g) => g.lessons.length > 0);

      const lessonCount = groups.reduce((n, g) => n + g.lessons.length, 0);
      return {
        id: family.id,
        title: family.title,
        lessonCount,
        groups,
      };
    })
    .filter((f) => f.groups.length > 0);

  const levelCounts = {
    all: 0,
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
  } as Record<CefrLevel | "all", number>;

  const countSource =
    familyId !== "all" || groupId !== "all" || level !== "all"
      ? filteredRows
      : lessonRows;

  levelCounts.all = countSource.length;
  for (const lv of CEFR_LEVELS) {
    levelCounts[lv] = countSource.filter((r) => r.lesson.level === lv).length;
  }

  const progressFamily =
    familyId !== "all"
      ? familyRows.find((f) => f.id === familyId)
      : familyRows[0];

  const progressLessons = progressFamily
    ? lessonRows.filter((r) => r.lesson.familyId === progressFamily.id)
    : [];
  const total = progressLessons.length;
  const done = progressLessons.filter(
    (r) => flagsFor(progress, r.lesson.slug).completed,
  ).length;

  return {
    families,
    levelCounts,
    familyOptions,
    groupOptions,
    progress: {
      familyTitle: progressFamily
        ? familyDisplayTitle(progressFamily.title)
        : "Grammar",
      done,
      total,
    },
  };
}
