import type { CefrLevel } from "@/types/cefr";
import type {
  PartOfSpeech,
  Word,
  WordExample,
  WordSet,
  WordSetTopic,
} from "@/types/vocabulary";

export type WordSetRow = {
  id: string;
  title: string;
  titleVi: string;
  topic: string;
  level: string;
  ownerId?: string | null;
};

export type WordRow = {
  id: string;
  wordSetId: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  level: string;
  meaningVi: string;
  definitionEn: string;
  examples: WordExample[];
  collocations: string[] | null;
  notes: string | null;
  imagePath: string | null;
  createdAt: Date;
};

/** FSRS state: 0 New, 1 Learning, 2 Review, 3 Relearning (ts-fsrs). */
export function computeWordSetStatus(
  wordCount: number,
  learnedCount: number,
): WordSet["status"] {
  if (wordCount === 0 || learnedCount === 0) return "new";
  if (learnedCount >= wordCount) return "done";
  return "active";
}

export function mapWordSet(
  row: WordSetRow,
  wordCount: number,
  learnedCount: number,
  owned = false,
): WordSet {
  return {
    id: row.id,
    title: row.title,
    titleVi: row.titleVi,
    topic: row.topic as WordSetTopic,
    level: row.level as CefrLevel,
    wordCount,
    learnedCount,
    status: computeWordSetStatus(wordCount, learnedCount),
    owned,
  };
}

export function mapWord(
  row: WordRow,
  publicImageUrl?: string | null,
  owned = false,
): Word {
  return {
    id: row.id,
    word: row.word,
    ipa: row.ipa,
    partOfSpeech: row.partOfSpeech as PartOfSpeech,
    level: row.level as CefrLevel,
    meaningVi: row.meaningVi,
    definitionEn: row.definitionEn,
    examples: row.examples,
    wordSetId: row.wordSetId,
    collocations: row.collocations ?? undefined,
    notes: row.notes ?? undefined,
    imageUrl: publicImageUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
    owned,
  };
}
