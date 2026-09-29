import { notFound } from "next/navigation";

import { ListeningView } from "@/components/listening/listening-view";
import {
  getListeningLesson,
  getListeningLessons,
} from "@/lib/data/listening";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ListeningLessonPage({ params }: Props) {
  const { slug } = await params;
  const [lesson, lessons] = await Promise.all([
    getListeningLesson(slug),
    getListeningLessons(),
  ]);

  if (!lesson) notFound();

  const index = lessons.findIndex((l) => l.slug === slug);
  const nextSlug =
    index >= 0 && index < lessons.length - 1
      ? lessons[index + 1]!.slug
      : null;

  return (
    <ListeningView lessons={lessons} lesson={lesson} nextSlug={nextSlug} />
  );
}
