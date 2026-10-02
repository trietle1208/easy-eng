import { notFound } from "next/navigation";

import { GrammarView } from "@/components/grammar/grammar-view";
import { getCurrentUser } from "@/lib/auth/session";
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

  const user = await getCurrentUser();
  const completed = user
    ? tree.families
        .flatMap((f) => f.groups)
        .flatMap((g) => g.lessons)
        .some((l) => l.slug === lessonSlug && l.completed)
    : undefined;

  return (
    <GrammarView
      tree={tree}
      lesson={lesson}
      adjacent={adjacent}
      completed={completed}
    />
  );
}
