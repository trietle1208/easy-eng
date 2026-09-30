import type {
  GrammarLesson,
  GrammarLessonSummary,
  LessonExample,
  LessonMistake,
  LessonStructureItem,
} from "@/types/grammar";
import type { CefrLevel } from "@/types/cefr";

export type GrammarLessonRow = {
  slug: string;
  title: string;
  level: string;
  familyId: string;
  groupId: string;
  sortOrder: number;
  readMinutes: number;
  introEn: string;
  introVi: string;
  useWhenEn: string;
  useWhenVi: string;
  structure: LessonStructureItem[];
  examples: LessonExample[];
  mistakes: LessonMistake[];
  practiceQuizSlug: string | null;
  practiceQuestionCount: number;
  practiceMinutes: number;
};

export type GrammarFamilyRow = {
  id: string;
  title: string;
};

export type GrammarGroupRow = {
  id: string;
  title: string;
  familyId: string;
};

/** Strip leading "N. " catalog numbering for UI familyTitle. */
export function familyDisplayTitle(title: string): string {
  return title.replace(/^\d+\.\s*/, "");
}

export function mapGrammarLessonSummary(
  row: Pick<
    GrammarLessonRow,
    "slug" | "title" | "level" | "familyId" | "groupId"
  >,
): GrammarLessonSummary {
  return {
    slug: row.slug,
    title: row.title,
    level: row.level as CefrLevel,
    familyId: row.familyId,
    groupId: row.groupId,
  };
}

export function mapGrammarLesson(
  row: GrammarLessonRow,
  family: GrammarFamilyRow,
  group: GrammarGroupRow,
  groupLessons: { slug: string }[],
): GrammarLesson {
  const index = groupLessons.findIndex((l) => l.slug === row.slug) + 1;
  return {
    slug: row.slug,
    title: row.title,
    level: row.level as CefrLevel,
    familyId: family.id,
    familyTitle: familyDisplayTitle(family.title),
    groupId: group.id,
    groupTitle: group.title,
    groupIndex: index > 0 ? index : 1,
    groupTotal: groupLessons.length || 1,
    readMinutes: row.readMinutes,
    introEn: row.introEn,
    introVi: row.introVi,
    useWhenEn: row.useWhenEn,
    useWhenVi: row.useWhenVi,
    structure: row.structure,
    examples: row.examples,
    mistakes: row.mistakes,
    practiceQuizSlug: row.practiceQuizSlug ?? row.slug,
    practiceQuestionCount: row.practiceQuestionCount,
    practiceMinutes: row.practiceMinutes,
  };
}
