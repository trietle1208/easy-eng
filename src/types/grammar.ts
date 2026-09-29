import type { CefrLevel } from "@/types/cefr";

export type GrammarFamily = {
  id: string;
  title: string;
  lessonCount: number;
  groups: GrammarGroup[];
};

export type GrammarGroup = {
  id: string;
  title: string;
  lessons: GrammarLessonSummary[];
};

export type GrammarLessonSummary = {
  slug: string;
  title: string;
  level: CefrLevel;
  groupId: string;
  familyId: string;
};

export type LessonStructureItem = {
  formula: string;
  explanation: string;
};

export type LessonExample = {
  sentence: string;
  explanation: string;
};

export type LessonMistake = {
  before: string;
  wrong: string;
  after: string;
  correct: string;
  noteEn: string;
  noteVi: string;
  /** When the mistake is a missing word (triangle mark in mockup). */
  missing?: boolean;
};

export type GrammarLesson = {
  slug: string;
  title: string;
  level: CefrLevel;
  familyId: string;
  familyTitle: string;
  groupId: string;
  groupTitle: string;
  groupIndex: number;
  groupTotal: number;
  readMinutes: number;
  introEn: string;
  introVi: string;
  useWhenEn: string;
  useWhenVi: string;
  structure: LessonStructureItem[];
  examples: LessonExample[];
  mistakes: LessonMistake[];
  practiceQuizSlug: string;
  practiceQuestionCount: number;
  practiceMinutes: number;
};

export type GrammarFilters = {
  familyId?: string | "all";
  groupId?: string | "all";
  level?: CefrLevel | "all";
};

export type GrammarTree = {
  families: GrammarFamily[];
  levelCounts: Record<CefrLevel | "all", number>;
  familyOptions: { id: string; title: string }[];
  groupOptions: { id: string; title: string; familyId: string }[];
  progress: {
    familyTitle: string;
    done: number;
    total: number;
  };
};

export type AdjacentLessons = {
  previous: GrammarLessonSummary | null;
  next: GrammarLessonSummary | null;
};
