import "server-only";

import { getFirstGrammarLessonSlug as getGrammarSlug } from "@/lib/data/grammar";
import { getFirstReadingSlug as getReadingSlug } from "@/lib/data/reading";
import { getFirstListeningSlug as getListeningSlug } from "@/lib/data/listening";
import { getFirstQuizSlug } from "@/lib/data/quiz";

export async function getFirstGrammarLessonSlug(): Promise<string> {
  return getGrammarSlug();
}

export async function getFirstReadingSlug(): Promise<string> {
  return getReadingSlug();
}

export async function getFirstListeningSlug(): Promise<string> {
  return getListeningSlug();
}

export async function getSampleQuizSlug(): Promise<string> {
  return getFirstQuizSlug();
}
