import { RESERVED_WORD_IDS } from "../../config";
import type { PartOfSpeech } from "./types";

const RESERVED = new Set<string>(RESERVED_WORD_IDS);

export function slugifyHeadword(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Stable id: `w-<slug>-<pos>`. Never reuse reserved hand-written ids.
 * On collision with a reserved id, append `-sys`.
 */
export function stableWordId(word: string, partOfSpeech: PartOfSpeech): string {
  const slug = slugifyHeadword(word);
  if (!slug) {
    throw new Error(`Cannot slugify headword: ${JSON.stringify(word)}`);
  }
  let id = `w-${slug}-${partOfSpeech}`;
  if (RESERVED.has(id)) {
    id = `${id}-sys`;
  }
  if (RESERVED.has(id)) {
    throw new Error(`Id still reserved after suffix: ${id}`);
  }
  return id;
}
