import { readFileSync } from "node:fs";

import { LEVEL_RANK, PATHS, type CefrLevel } from "../../config";
import { parseCsv } from "./csv";
import { isCefrLevel, mapPos, normaliseHeadword } from "./normalise";

/**
 * Lowest CEFR-J level seen for a lowercased headword (any POS).
 * Used for LEVEL_LEAK: words above the entry's target level.
 */
export type CefrLevelIndex = Map<string, CefrLevel>;

export function loadCefrLevelIndex(cefrjPath = PATHS.cefrjCsv): CefrLevelIndex {
  const rows = parseCsv(readFileSync(cefrjPath, "utf8"));
  const header = rows[0] ?? [];
  const hi = header.indexOf("headword");
  const pi = header.indexOf("pos");
  const ci = header.indexOf("CEFR");
  const map: CefrLevelIndex = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const rawHw = row[hi] ?? "";
    const pos = row[pi] ?? "";
    const cefr = row[ci] ?? "";
    if (!isCefrLevel(cefr)) continue;
    const mapped = mapPos(pos);
    if (!mapped) continue;
    for (const part of rawHw.split("/")) {
      const hw = normaliseHeadword(part.trim()).word;
      if (!hw) continue;
      const prev = map.get(hw);
      if (!prev || LEVEL_RANK[cefr] < LEVEL_RANK[prev]) {
        map.set(hw, cefr);
      }
    }
  }
  return map;
}

/** Function / closed-class words ignored in level-leak counting. */
export const LEVEL_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "so",
  "because",
  "as",
  "than",
  "that",
  "this",
  "these",
  "those",
  "there",
  "here",
  "it",
  "its",
  "it's",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "our",
  "their",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "who",
  "whom",
  "whose",
  "which",
  "what",
  "where",
  "when",
  "why",
  "how",
  "is",
  "am",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "done",
  "have",
  "has",
  "had",
  "having",
  "will",
  "would",
  "shall",
  "should",
  "can",
  "could",
  "may",
  "might",
  "must",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "into",
  "about",
  "over",
  "under",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "out",
  "up",
  "down",
  "off",
  "again",
  "not",
  "no",
  "nor",
  "only",
  "just",
  "also",
  "very",
  "too",
  "more",
  "most",
  "some",
  "any",
  "all",
  "each",
  "every",
  "both",
  "few",
  "many",
  "much",
  "other",
  "another",
  "such",
  "own",
  "same",
  "than",
  "too",
  "very",
  "s",
  "t",
  "re",
  "ve",
  "ll",
  "d",
  "m",
]);

export function tokenizeContentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s-]/gu, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

/**
 * Count content words whose CEFR-J level is strictly above `target`.
 * Tokens not in the list (names, numbers, typos) are ignored.
 */
export function countWordsAboveLevel(
  texts: string[],
  target: CefrLevel,
  index: CefrLevelIndex,
  headword: string,
): { count: number; words: string[] } {
  const hw = headword.toLowerCase().trim();
  const hwParts = new Set(hw.split(/\s+/));
  const above: string[] = [];
  const seen = new Set<string>();

  for (const text of texts) {
    for (const tok of tokenizeContentWords(text)) {
      if (LEVEL_STOPWORDS.has(tok)) continue;
      if (/^\d+$/.test(tok)) continue;
      if (hwParts.has(tok) || tok === hw) continue;
      if (seen.has(tok)) continue;
      const lvl = index.get(tok);
      if (!lvl) continue; // unknown → ignore
      if (LEVEL_RANK[lvl] > LEVEL_RANK[target]) {
        seen.add(tok);
        above.push(tok);
      }
    }
  }
  return { count: above.length, words: above };
}
