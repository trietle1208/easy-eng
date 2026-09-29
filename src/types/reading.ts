import type { CefrLevel } from "@/types/cefr";

export type ReadingTopic =
  | "Travel"
  | "Science"
  | "Work"
  | "Culture"
  | "Business";

export const READING_TOPICS: ReadingTopic[] = [
  "Travel",
  "Science",
  "Work",
  "Culture",
  "Business",
];

export type VocabHighlight = {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  level: CefrLevel;
};

export type PassageSegment =
  | { type: "text"; text: string }
  | { type: "vocab"; vocabId: string };

export type Paragraph = {
  id: string;
  segments: PassageSegment[];
  vi: string;
};

export type ComprehensionQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

export type ReadingPassageSummary = {
  slug: string;
  title: string;
  topic: ReadingTopic;
  level: CefrLevel;
  minutes: number;
  completed: boolean;
  inProgress?: boolean;
};

export type ReadingPassage = ReadingPassageSummary & {
  wordCount: number;
  newWordCount: number;
  familyLabel: string;
  indexInTopic: number;
  topicTotal: number;
  paragraphs: Paragraph[];
  vocabulary: VocabHighlight[];
  questions: ComprehensionQuestion[];
};

export type AnswerCheckResult = {
  questionId: string;
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
};

export type CheckReadingAnswersResult = {
  results: AnswerCheckResult[];
  score: number;
  total: number;
};
