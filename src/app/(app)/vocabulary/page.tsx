import { VocabularyView } from "@/components/vocabulary/vocabulary-view";
import {
  getReviewDue,
  getTopicCounts,
  getWordSets,
} from "@/lib/data/vocabulary";

export default async function VocabularyPage() {
  const [sets, topicCounts, review] = await Promise.all([
    getWordSets(),
    getTopicCounts(),
    getReviewDue(),
  ]);

  return (
    <VocabularyView sets={sets} topicCounts={topicCounts} review={review} />
  );
}
