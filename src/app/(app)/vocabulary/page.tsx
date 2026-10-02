import { VocabularyView } from "@/components/vocabulary/vocabulary-view";
import { requireUser } from "@/lib/auth/session";
import { getReviewDue, getWordSets } from "@/lib/data/vocabulary";

export default async function VocabularyPage() {
  await requireUser("/vocabulary");

  const [sets, review] = await Promise.all([getWordSets(), getReviewDue()]);

  return <VocabularyView sets={sets} review={review} />;
}
