import { notFound } from "next/navigation";

import { GrammarView } from "@/components/grammar/grammar-view";
import {
  getAdjacentLessons,
  getGrammarTree,
  getLesson,
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

  return <GrammarView tree={tree} lesson={lesson} adjacent={adjacent} />;
}
