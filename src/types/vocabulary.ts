import type { CefrLevel } from "@/types/cefr";
import topicsJson from "../../content/topics.json";
import { topicsContentSchema } from "../../content/schema";

const topicsData = topicsContentSchema.parse(topicsJson);

/** Topic ids stored on word_sets.topic — single source: content/topics.json */
export const WORD_SET_TOPICS = topicsData.topics.map((t) => t.id) as [
  string,
  ...string[],
];

export type WordSetTopic = (typeof WORD_SET_TOPICS)[number];

export const TOPIC_ENTRIES = topicsData.topics;

export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "preposition",
  "conjunction",
  "interjection",
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export type ReviewStatus =
  | "ai_generated"
  | "ai_checked"
  | "human_reviewed";

export type IpaStatus = "from_dict" | "proposed" | "missing";

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
  source?: string;
  sortOrder?: number;
  reviewStatus?: ReviewStatus;
  ipaStatus?: IpaStatus | null;
  createdAt: string;
  /** True when the signed-in user owns this word (editable/deletable). */
  owned?: boolean;
};

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
  /** Headwords in the set (for accent-insensitive word search). */
  wordHeads?: string[];
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
