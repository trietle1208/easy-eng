import type { CefrLevel } from "@/types/cefr";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrase";

export const PARTS_OF_SPEECH: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
];

export type WordExample = {
  en: string;
  vi?: string;
};

export type Word = {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  meaningVi: string;
  definitionEn: string;
  examples: WordExample[];
  wordSetId: string;
  collocations?: string[];
  notes?: string;
  imageUrl?: string;
  createdAt: string;
};

export type WordSetTopic =
  | "Daily life"
  | "Work"
  | "Travel"
  | "Food"
  | "Health"
  | "School"
  | "Technology"
  | "Feelings";

export const WORD_SET_TOPICS: WordSetTopic[] = [
  "Daily life",
  "Work",
  "Travel",
  "Food",
  "Health",
  "School",
  "Technology",
  "Feelings",
];

export type WordSet = {
  id: string;
  title: string;
  titleVi: string;
  topic: WordSetTopic;
  level: CefrLevel;
  wordCount: number;
  learnedCount: number;
  /** recently studied | new | done */
  status: "active" | "new" | "done";
};

export type WordSetFilters = {
  query?: string;
  level?: CefrLevel | "all";
  topic?: WordSetTopic | "all";
};

export type NewWordInput = {
  word: string;
  ipa?: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  meaningVi: string;
  definitionEn?: string;
  examples: string[];
  wordSetId?: string;
  newWordSetTitle?: string;
  notes?: string;
  imageUrl?: string;
};

export type ReviewDue = {
  count: number;
  word: Word;
  setTitle: string;
  cardIndex: number;
  cardTotal: number;
};
