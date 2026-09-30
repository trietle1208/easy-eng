import { AddWordModal } from "@/components/vocabulary/add-word-modal";
import { requireUser } from "@/lib/auth/session";
import {
  getAddedToday,
  getSavedWordCount,
  getWordSets,
} from "@/lib/data/vocabulary";

export default async function InterceptedAddWordPage() {
  await requireUser("/vocabulary/new");

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
