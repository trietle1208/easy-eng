import { redirect } from "next/navigation";

import { getFirstQuizSlug } from "@/lib/data/quiz";

export default async function QuizIndexPage() {
  const slug = await getFirstQuizSlug();
  redirect(`/quiz/${slug}`);
}
