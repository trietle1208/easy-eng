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
  /** True when the signed-in user owns this word (editable/deletable). */
  owned?: boolean;
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
  /** True when the signed-in user owns this set (editable/deletable). */
  owned?: boolean;
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
  /** Public `/files/...` URL or storage key written by upload action */
  imageUrl?: string;
};

export type UpdateWordInput = {
  id: string;
  word?: string;
  ipa?: string;
  partOfSpeech?: PartOfSpeech;
  level?: CefrLevel;
  meaningVi?: string;
  definitionEn?: string;
  examples?: string[];
  notes?: string;
  imageUrl?: string | null;
};

export type UpdateWordSetInput = {
  id: string;
  title?: string;
  titleVi?: string;
  topic?: WordSetTopic;
  level?: CefrLevel;
};

export type ReviewGrade = "still_learning" | "know_it";

export type ReviewDue = {
  count: number;
  word: Word;
  setTitle: string;
  cardIndex: number;
  cardTotal: number;
  /** user_word_cards.id — required to grade */
  cardId: string;
};
