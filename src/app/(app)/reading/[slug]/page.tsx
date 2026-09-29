import { notFound } from "next/navigation";

import { ReadingView } from "@/components/reading/reading-view";
import {
  getPassage,
  getPassages,
  getReadingProgress,
} from "@/lib/data/reading";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ReadingPassagePage({ params }: Props) {
  const { slug } = await params;
  const [passage, passages, progress] = await Promise.all([
    getPassage(slug),
    getPassages(),
    getReadingProgress(),
  ]);

  if (!passage) notFound();

  return (
    <ReadingView
      passages={passages}
      passage={passage}
      progress={progress}
    />
  );
}
