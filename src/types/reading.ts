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

/** Public question shape — no answer key (scoring via Server Action). */
export type ComprehensionQuestion = {
  id: string;
  prompt: string;
  choices: string[];
};

/** Server-only question with answer key for scoring. */
export type ComprehensionQuestionSecure = ComprehensionQuestion & {
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
  /** False for anonymous callers — UI can invite them to sign in. */
  progressSaved: boolean;
};
