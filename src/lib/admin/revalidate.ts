import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { CONTENT_CACHE_TAGS, type ContentCacheTag } from "@/lib/data/cache-tags";
import type { ContentKind } from "@/lib/admin/validate";

/** Cache tags to bust when a content kind changes (catalog counts always). */
export function tagsForKind(kind: ContentKind): ContentCacheTag[] {
  const own: ContentCacheTag =
    kind === "grammar"
      ? CONTENT_CACHE_TAGS.grammar
      : kind === "reading"
        ? CONTENT_CACHE_TAGS.reading
        : kind === "listening"
          ? CONTENT_CACHE_TAGS.listening
          : kind === "quiz"
            ? CONTENT_CACHE_TAGS.quiz
            : CONTENT_CACHE_TAGS.vocabulary;
  return [own, CONTENT_CACHE_TAGS.catalog];
}

/** Revalidate content cache tags (+ admin list pages) after a successful write. */
export function revalidateContent(kinds: ContentKind | ContentKind[]): void {
  const list = Array.isArray(kinds) ? kinds : [kinds];
  const tags = new Set<ContentCacheTag>();
  for (const k of list) for (const t of tagsForKind(k)) tags.add(t);
  for (const tag of tags) revalidateTag(tag);
  revalidatePath("/admin", "layout");
  // Learner pages render per-user data around the cached content — refresh them too.
  revalidatePath("/", "layout");
}
