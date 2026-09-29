import {
  MOCK_USER_NAME,
  mockContinueItems,
  mockDailyGoal,
  mockHomeStats,
  mockSectionEntries,
  mockWordOfTheDay,
} from "@/lib/mock/home";
import type {
  ContinueItem,
  DailyGoal,
  HomeCatalogStats,
  SectionEntry,
  WordOfTheDay,
} from "@/types/home";
import type { CefrLevel } from "@/types/cefr";

export type Greeting = {
  userName: string;
  en: string;
  vi: string;
};

export async function getDailyGoal(): Promise<DailyGoal> {
  return mockDailyGoal;
}

export async function getWordOfTheDay(): Promise<WordOfTheDay> {
  return mockWordOfTheDay;
}

export async function getContinueItems(
  level: CefrLevel | "all" = "all",
): Promise<ContinueItem[]> {
  if (level === "all") return mockContinueItems;
  return mockContinueItems.filter((item) => item.level === level);
}

export async function getSectionEntries(): Promise<SectionEntry[]> {
  return mockSectionEntries;
}

export async function getHomeCatalogStats(): Promise<HomeCatalogStats> {
  return mockHomeStats;
}

export async function getGreeting(
  now: Date = new Date(),
): Promise<Greeting> {
  const hour = now.getHours();
  if (hour < 12) {
    return {
      userName: MOCK_USER_NAME,
      en: "Good morning",
      vi: "Chào buổi sáng",
    };
  }
  if (hour < 18) {
    return {
      userName: MOCK_USER_NAME,
      en: "Good afternoon",
      vi: "Chào buổi chiều",
    };
  }
  return {
    userName: MOCK_USER_NAME,
    en: "Good evening",
    vi: "Chào buổi tối",
  };
}
