import {
  getReviewDueWord,
  getSavedCount,
  insertMockWord,
  listAddedToday,
  listMockWords,
  mockWordSets,
  topicCounts,
} from "@/lib/mock/vocabulary";
import type {
  NewWordInput,
  ReviewDue,
  Word,
  WordSet,
  WordSetFilters,
  WordSetTopic,
} from "@/types/vocabulary";

export async function getWordSets(
  filters: WordSetFilters = {},
): Promise<WordSet[]> {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const level = filters.level ?? "all";
  const topic = filters.topic ?? "all";

  return mockWordSets.filter((set) => {
    if (level !== "all" && set.level !== level) return false;
    if (topic !== "all" && set.topic !== topic) return false;
    if (!query) return true;
    return (
      set.title.toLowerCase().includes(query) ||
      set.titleVi.toLowerCase().includes(query) ||
      set.topic.toLowerCase().includes(query)
    );
  });
}

export async function getTopicCounts(): Promise<
  Record<WordSetTopic | "all", number>
> {
  return { ...topicCounts };
}

export async function getWord(id: string): Promise<Word | null> {
  return listMockWords().find((w) => w.id === id) ?? null;
}

export async function getWordsInSet(setId: string): Promise<Word[]> {
  return listMockWords().filter((w) => w.wordSetId === setId);
}

export async function getReviewDueCount(): Promise<number> {
  return 18;
}

export async function getReviewDue(): Promise<ReviewDue> {
  return getReviewDueWord();
}

export async function getSavedWordCount(): Promise<number> {
  return getSavedCount();
}

export async function getAddedToday(): Promise<Word[]> {
  return listAddedToday();
}

export async function createWord(input: NewWordInput): Promise<Word> {
  return insertMockWord(input);
}
