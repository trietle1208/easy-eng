import { notFound } from "next/navigation";

import { QuizView } from "@/components/quiz/quiz-view";
import { getLastAttempt, getQuiz } from "@/lib/data/quiz";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function QuizPage({ params }: Props) {
  const { slug } = await params;
  const quiz = await getQuiz(slug);
  if (!quiz) notFound();

  const lastAttempt = await getLastAttempt(slug);

  return <QuizView quiz={quiz} lastAttempt={lastAttempt} />;
}
