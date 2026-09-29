import type { CefrLevel } from "@/types/cefr";

export type WeekdayMark = "done" | "today" | "empty";

export type WeekdayCheck = {
  label: string;
  status: WeekdayMark;
};

export type GoalProgress = {
  label: string;
  current: number;
  target: number;
};

export type DailyGoal = {
  dateLabel: string;
  streakDays: number;
  streakNote: string;
  weekdays: WeekdayCheck[];
  newWords: GoalProgress;
  grammar: GoalProgress;
  wordsLeftForGoal: number;
  studySeconds: number;
  pomodoroSeconds: number;
};

export type WordOfTheDay = {
  word: string;
  ipa: string;
  partOfSpeech: string;
  level: CefrLevel;
  meaningVi: string;
  example: string;
  exampleHighlight: string;
};

export type ContinueKind = "grammar" | "vocabulary";

export type ContinueItem = {
  id: string;
  kind: ContinueKind;
  title: string;
  subtitle: string;
  level: CefrLevel;
  progress: number;
  href: string;
};

export type SectionEntry = {
  id: "grammar" | "vocabulary";
  title: string;
  subtitle: string;
  href: string;
};

export type HomeCatalogStats = {
  grammarLessons: number;
  grammarFamilies: number;
  wordSets: number;
  words: number;
};
