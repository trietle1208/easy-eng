import { redirect } from "next/navigation";

import { getFirstListeningSlug } from "@/lib/data/catalog";

export default async function ListeningIndexPage() {
  const slug = await getFirstListeningSlug();
  redirect(`/listening/${slug}`);
}
