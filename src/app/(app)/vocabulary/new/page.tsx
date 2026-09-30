import { AddWordForm } from "@/components/vocabulary/add-word-form";
import { requireUser } from "@/lib/auth/session";
import {
  getAddedToday,
  getSavedWordCount,
  getWord,
  getWordSets,
} from "@/lib/data/vocabulary";

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function AddWordPage({ searchParams }: Props) {
  await requireUser("/vocabulary/new");
  const { edit } = await searchParams;

  const [wordSets, savedCount, addedToday, initialWord] = await Promise.all([
    getWordSets(),
    getSavedWordCount(),
    getAddedToday(),
    edit ? getWord(edit) : Promise.resolve(null),
  ]);

  return (
    <AddWordForm
      wordSets={wordSets}
      savedCount={savedCount}
      initialAddedToday={addedToday}
      initialWord={initialWord?.owned ? initialWord : null}
      mode="page"
    />
  );
}
