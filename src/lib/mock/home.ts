import type {
  ContinueItem,
  DailyGoal,
  HomeCatalogStats,
  SectionEntry,
  WordOfTheDay,
} from "@/types/home";

export const mockDailyGoal: DailyGoal = {
  dateLabel: "Mon, 28 Sep",
  streakDays: 7,
  streakNote: "Chuỗi 7 ngày — keep it going!",
  weekdays: [
    { label: "T", status: "done" },
    { label: "W", status: "done" },
    { label: "T", status: "done" },
    { label: "F", status: "done" },
    { label: "S", status: "done" },
    { label: "S", status: "done" },
    { label: "M", status: "today" },
  ],
  newWords: { label: "New words", current: 12, target: 20 },
  grammar: { label: "Grammar lessons", current: 1, target: 2 },
  wordsLeftForGoal: 8,
  studySeconds: 18 * 60 + 42,
  pomodoroSeconds: 25 * 60,
};

export const mockWordOfTheDay: WordOfTheDay = {
  word: "serendipity",
  ipa: "/ˌser.ənˈdɪp.ə.ti/",
  partOfSpeech: "noun",
  level: "C1",
  meaningVi: "sự tình cờ may mắn",
  example: "Finding this quiet café was pure serendipity.",
  exampleHighlight: "serendipity",
};

export const mockContinueItems: ContinueItem[] = [
  {
    id: "c1",
    kind: "grammar",
    title: "Present perfect vs. past simple",
    subtitle: "Section 3 of 5 · Common mistakes",
    level: "B1",
    progress: 60,
    href: "/grammar/present-perfect-vs-past-simple",
  },
  {
    id: "c2",
    kind: "vocabulary",
    title: "At the airport",
    subtitle: "14 of 30 words · Ở sân bay",
    level: "A2",
    progress: 47,
    href: "/vocabulary",
  },
  {
    id: "c3",
    kind: "grammar",
    title: "Use linking verbs with complements",
    subtitle: "Section 2 of 5 · Examples",
    level: "A2",
    progress: 35,
    href: "/grammar/use-linking-verbs-with-complements",
  },
];

export const mockSectionEntries: SectionEntry[] = [
  {
    id: "grammar",
    title: "Grammar",
    subtitle: "474 lessons · 12 families · Ngữ pháp",
    href: "/grammar",
  },
  {
    id: "vocabulary",
    title: "Vocabulary",
    subtitle: "86 word sets · 2,140 words · Từ vựng",
    href: "/vocabulary",
  },
];

export const mockHomeStats: HomeCatalogStats = {
  grammarLessons: 474,
  grammarFamilies: 12,
  wordSets: 86,
  words: 2140,
};

export const MOCK_USER_NAME = "Linh";
