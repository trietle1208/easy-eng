import { redirect } from "next/navigation";

import { getFirstReadingSlug } from "@/lib/data/catalog";

export default async function ReadingIndexPage() {
  const slug = await getFirstReadingSlug();
  redirect(`/reading/${slug}`);
}
