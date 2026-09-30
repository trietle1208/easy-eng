import "server-only";

import { unstable_cache } from "next/cache";

import {
  CONTENT_CACHE_REVALIDATE,
  type ContentCacheTag,
} from "@/lib/data/cache-tags";

/**
 * Cache a content loader. Skips Next cache under Vitest so tests hit the DB.
 * Never put per-user data inside `fn`.
 */
export function cacheContentQuery<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
  tags: ContentCacheTag[],
): (...args: TArgs) => Promise<TResult> {
  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
    return fn;
  }
  return unstable_cache(fn, keyParts, {
    tags,
    revalidate: CONTENT_CACHE_REVALIDATE,
  });
}
