import type { CefrLevel } from "@/types/cefr";

export type ListeningTopic =
  | "Travel"
  | "Daily life"
  | "Work"
  | "News"
  | "Culture";

export const LISTENING_TOPICS: ListeningTopic[] = [
  "Travel",
  "Daily life",
  "Work",
  "News",
  "Culture",
];

export type TranscriptSentence = {
  id: string;
  speaker: string;
  text: string;
  start: number;
  end: number;
};

/** Public blank — no answer/accept (scoring via Server Action). */
export type DictationBlank = {
  id: string;
  /** Full sentence with `___` where the blank is */
  promptBefore: string;
  promptAfter: string;
};

/** Server-only blank with answer keys for scoring. */
export type DictationBlankSecure = DictationBlank & {
  answer: string;
  /** Acceptable alternate answers (lowercase compare) */
  accept?: string[];
};

export type ListeningLessonSummary = {
  slug: string;
  title: string;
  topic: ListeningTopic;
  level: CefrLevel;
  durationSeconds: number;
  completed: boolean;
  inProgress?: boolean;
};

export type ListeningLesson = ListeningLessonSummary & {
  audioSrc: string;
  speakers: number;
  accent: string;
  familyLabel: string;
  transcript: TranscriptSentence[];
  blanks: DictationBlank[];
};

export type DictationCheckItem = {
  blankId: string;
  given: string;
  answer: string;
  isCorrect: boolean;
};

export type CheckDictationResult = {
  results: DictationCheckItem[];
  score: number;
  total: number;
  /** False for anonymous callers — UI can invite them to sign in. */
  progressSaved: boolean;
};
