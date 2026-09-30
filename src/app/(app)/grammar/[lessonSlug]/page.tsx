import { notFound } from "next/navigation";

import { GrammarView } from "@/components/grammar/grammar-view";
import {
  getAdjacentLessons,
  getGrammarTree,
  getLesson,
  recordGrammarVisit,
} from "@/lib/data/grammar";

type Props = {
  params: Promise<{ lessonSlug: string }>;
};

export default async function GrammarLessonPage({ params }: Props) {
  const { lessonSlug } = await params;
  const [lesson, adjacent, tree] = await Promise.all([
    getLesson(lessonSlug),
    getAdjacentLessons(lessonSlug),
    getGrammarTree(),
  ]);

  if (!lesson) notFound();

  // Signed-in: mark visit as in-progress for "Continue where you left off".
  await recordGrammarVisit(lessonSlug);

  return <GrammarView tree={tree} lesson={lesson} adjacent={adjacent} />;
}
