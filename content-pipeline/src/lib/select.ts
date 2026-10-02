import { LEVEL_ORDER, LEVEL_QUOTAS, type CefrLevel } from "../../config";
import { frequencyRankFor } from "./frequency";
import { lookupIpa } from "./ipa";
import { stableWordId } from "./ids";
import { SOURCE_TAG } from "../../config";
import type { NormalisedCandidate, PartOfSpeech, SkeletonWord } from "./types";
import { PARTS_OF_SPEECH } from "./types";

export type RankedCandidate = NormalisedCandidate & {
  frequencyRank: number | null;
};

/** Sort key: flagged first, then lower frequency rank, then alphabetical. */
export function compareForSelection(a: RankedCandidate, b: RankedCandidate): number {
  if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;

  const ar = a.frequencyRank ?? Number.POSITIVE_INFINITY;
  const br = b.frequencyRank ?? Number.POSITIVE_INFINITY;
  if (ar !== br) return ar - br;

  return (
    a.word.localeCompare(b.word) ||
    a.partOfSpeech.localeCompare(b.partOfSpeech)
  );
}

/**
 * Allocate `quota` seats across POS buckets proportional to pool sizes.
 * Largest-remainder method; deterministic POS order from PARTS_OF_SPEECH.
 *
 * Why not global flagged-first? CEFR-J CoreInventory/Threshold tags are
 * almost only on nouns (~2150 nouns vs 4 verbs), so a global flag-first
 * pass collapses the catalog to ~75% nouns. Flagged-first still applies
 * *inside* each POS bucket.
 */
export function allocatePosQuotas(
  pool: RankedCandidate[],
  quota: number,
): Map<PartOfSpeech, number> {
  const sizes = new Map<PartOfSpeech, number>();
  for (const pos of PARTS_OF_SPEECH) sizes.set(pos, 0);
  for (const c of pool) {
    sizes.set(c.partOfSpeech, (sizes.get(c.partOfSpeech) ?? 0) + 1);
  }

  const total = pool.length;
  const alloc = new Map<PartOfSpeech, number>();
  if (total === 0 || quota === 0) {
    for (const pos of PARTS_OF_SPEECH) alloc.set(pos, 0);
    return alloc;
  }

  const exact = PARTS_OF_SPEECH.map((pos) => {
    const size = sizes.get(pos) ?? 0;
    const raw = (size / total) * quota;
    const floor = Math.min(size, Math.floor(raw));
    return { pos, size, floor, frac: raw - Math.floor(raw) };
  });

  let used = exact.reduce((s, e) => s + e.floor, 0);
  for (const e of exact) alloc.set(e.pos, e.floor);

  // Distribute remaining seats: largest fractional part, then pool size, then POS name.
  const remainders = [...exact]
    .filter((e) => e.floor < e.size)
    .sort(
      (a, b) =>
        b.frac - a.frac ||
        b.size - a.size ||
        a.pos.localeCompare(b.pos),
    );

  let left = Math.min(quota, total) - used;
  for (const e of remainders) {
    if (left <= 0) break;
    alloc.set(e.pos, (alloc.get(e.pos) ?? 0) + 1);
    left -= 1;
  }

  // If still short (edge case), fill from any POS with leftover capacity.
  if (left > 0) {
    for (const pos of PARTS_OF_SPEECH) {
      if (left <= 0) break;
      const size = sizes.get(pos) ?? 0;
      const cur = alloc.get(pos) ?? 0;
      const add = Math.min(left, size - cur);
      if (add > 0) {
        alloc.set(pos, cur + add);
        left -= add;
      }
    }
  }

  return alloc;
}

export function selectByQuotas(
  candidates: NormalisedCandidate[],
  frequencyRanks: Map<string, number>,
  cmudict: Map<string, string[]>,
  quotas: Record<CefrLevel, number> = LEVEL_QUOTAS,
): SkeletonWord[] {
  const ranked: RankedCandidate[] = candidates.map((c) => ({
    ...c,
    frequencyRank: frequencyRankFor(frequencyRanks, c.word),
  }));

  const selected: SkeletonWord[] = [];
  const usedIds = new Set<string>();

  for (const level of LEVEL_ORDER) {
    const pool = ranked.filter((c) => c.level === level);
    const quota = Math.min(quotas[level], pool.length);
    const posQuotas = allocatePosQuotas(pool, quota);

    const take: RankedCandidate[] = [];
    for (const pos of PARTS_OF_SPEECH) {
      const n = posQuotas.get(pos) ?? 0;
      if (n <= 0) continue;
      const bucket = pool
        .filter((c) => c.partOfSpeech === pos)
        .sort(compareForSelection);
      take.push(...bucket.slice(0, n));
    }

    // Exact fill if rounding left seats empty (should be rare).
    if (take.length < quota) {
      const taken = new Set(take.map((c) => `${c.word}|${c.partOfSpeech}`));
      const extras = pool
        .filter((c) => !taken.has(`${c.word}|${c.partOfSpeech}`))
        .sort(compareForSelection);
      take.push(...extras.slice(0, quota - take.length));
    }

    for (const c of take) {
      const id = stableWordId(c.word, c.partOfSpeech);
      if (usedIds.has(id)) {
        throw new Error(`Duplicate stable id: ${id}`);
      }
      usedIds.add(id);

      const { ipa, ipaSource } = lookupIpa(cmudict, c.word);
      selected.push({
        id,
        word: c.word,
        partOfSpeech: c.partOfSpeech,
        level: c.level,
        ipa,
        ipaSource,
        frequencyRank: c.frequencyRank,
        flagged: c.flagged,
        source: SOURCE_TAG,
        notes: c.notes,
        otherLevels: c.otherLevels,
        isMultiWord: c.isMultiWord,
      });
    }
  }

  // Stable output order: by level then word then pos.
  selected.sort(
    (a, b) =>
      LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
      a.word.localeCompare(b.word) ||
      a.partOfSpeech.localeCompare(b.partOfSpeech),
  );

  return selected;
}

/** Deterministic seeded shuffle (mulberry32) for sample CSV. */
export function seededSample<T>(items: T[], size: number, seed: number): T[] {
  if (items.length <= size) return [...items];
  const rng = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, size);
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
