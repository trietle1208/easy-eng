import { readFileSync } from "node:fs";

/** 1-based rank; missing words → null (sorted last among unflagged). */
export function loadFrequencyRanks(filePath: string): Map<string, number> {
  const text = readFileSync(filePath, "utf8");
  const map = new Map<string, number>();
  let rank = 0;
  for (const line of text.split(/\r?\n/)) {
    const word = line.trim().toLowerCase();
    if (!word) continue;
    rank += 1;
    if (!map.has(word)) map.set(word, rank);
  }
  return map;
}

export function frequencyRankFor(
  ranks: Map<string, number>,
  word: string,
): number | null {
  const key = word.toLowerCase().trim();
  if (ranks.has(key)) return ranks.get(key)!;

  // Multi-word / hyphenated: use the minimum (most frequent) token rank.
  const tokens = key.split(/[\s-]+/).filter(Boolean);
  if (tokens.length <= 1) return null;

  let best: number | null = null;
  for (const t of tokens) {
    const r = ranks.get(t);
    if (r == null) continue;
    if (best == null || r < best) best = r;
  }
  return best;
}
