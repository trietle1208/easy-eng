import { AddWordForm } from "@/components/vocabulary/add-word-form";
import {
  getAddedToday,
  getSavedWordCount,
  getWordSets,
} from "@/lib/data/vocabulary";

export default async function AddWordPage() {
  const [wordSets, savedCount, addedToday] = await Promise.all([
    getWordSets(),
    getSavedWordCount(),
    getAddedToday(),
  ]);

  return (
    <AddWordForm
      wordSets={wordSets}
      savedCount={savedCount}
      initialAddedToday={addedToday}
      mode="page"
    />
  );
}
