import { redirect } from "next/navigation";

import { getFirstGrammarLessonSlug } from "@/lib/data/catalog";

export default async function GrammarIndexPage() {
  const slug = await getFirstGrammarLessonSlug();
  redirect(`/grammar/${slug}`);
}
