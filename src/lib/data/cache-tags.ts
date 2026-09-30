/** Cache tags for content queries — revalidate after seed / admin writes. */
export const CONTENT_CACHE_TAGS = {
  grammar: "content:grammar",
  reading: "content:reading",
  listening: "content:listening",
  quiz: "content:quiz",
  vocabulary: "content:vocabulary",
  catalog: "content:catalog",
} as const;

export type ContentCacheTag =
  (typeof CONTENT_CACHE_TAGS)[keyof typeof CONTENT_CACHE_TAGS];

/** Default revalidate window for rarely changing catalog content (seconds). */
export const CONTENT_CACHE_REVALIDATE = 3600;
