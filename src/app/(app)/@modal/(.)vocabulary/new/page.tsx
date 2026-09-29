import { AddWordModal } from "@/components/vocabulary/add-word-modal";
import {
  getAddedToday,
  getSavedWordCount,
  getWordSets,
} from "@/lib/data/vocabulary";

export default async function InterceptedAddWordPage() {
  const [wordSets, savedCount, addedToday] = await Promise.all([
    getWordSets(),
    getSavedWordCount(),
    getAddedToday(),
  ]);

  return (
    <AddWordModal
      wordSets={wordSets}
      savedCount={savedCount}
      addedToday={addedToday}
    />
  );
}
