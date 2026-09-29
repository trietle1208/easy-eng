import {
  FIRST_GRAMMAR_LESSON_SLUG,
  allLessonSummaries,
  getMockLesson,
  mockGrammarFamilies,
  mockLevelCatalogCounts,
} from "@/lib/mock/grammar";
import type {
  AdjacentLessons,
  GrammarFilters,
  GrammarLesson,
  GrammarTree,
} from "@/types/grammar";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";

export async function getFirstGrammarLessonSlug(): Promise<string> {
  return FIRST_GRAMMAR_LESSON_SLUG;
}

export async function getLesson(
  slug: string,
): Promise<GrammarLesson | null> {
  return getMockLesson(slug);
}

export async function getAdjacentLessons(
  slug: string,
): Promise<AdjacentLessons> {
  const all = allLessonSummaries();
  const index = all.findIndex((l) => l.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? all[index - 1] : null,
    next: index < all.length - 1 ? all[index + 1] : null,
  };
}

export async function getGrammarTree(
  filters: GrammarFilters = {},
): Promise<GrammarTree> {
  const familyId = filters.familyId ?? "all";
  const groupId = filters.groupId ?? "all";
  const level = filters.level ?? "all";

  const families = mockGrammarFamilies
    .filter((family) => familyId === "all" || family.id === familyId)
    .map((family) => ({
      ...family,
      groups: family.groups
        .filter((group) => groupId === "all" || group.id === groupId)
        .map((group) => ({
          ...group,
          lessons: group.lessons.filter(
            (lesson) => level === "all" || lesson.level === level,
          ),
        }))
        .filter((group) => group.lessons.length > 0),
    }))
    .filter((family) => family.groups.length > 0);

  const familyOptions = mockGrammarFamilies.map((f) => ({
    id: f.id,
    title: f.title,
  }));

  const groupOptions = mockGrammarFamilies.flatMap((f) =>
    f.groups.map((g) => ({
      id: g.id,
      title: g.title,
      familyId: f.id,
    })),
  );

  const levelCounts = { ...mockLevelCatalogCounts } as Record<
    CefrLevel | "all",
    number
  >;
  // Keep catalog totals from mockup; optionally refine from tree for filtered views
  if (level !== "all" || familyId !== "all" || groupId !== "all") {
    const filtered = families.flatMap((f) =>
      f.groups.flatMap((g) => g.lessons),
    );
    levelCounts.all = filtered.length;
    for (const lv of CEFR_LEVELS) {
      levelCounts[lv] = filtered.filter((l) => l.level === lv).length;
    }
  }

  return {
    families,
    levelCounts,
    familyOptions,
    groupOptions,
    progress: {
      familyTitle: "Sentence foundations",
      done: 3,
      total: 18,
    },
  };
}
