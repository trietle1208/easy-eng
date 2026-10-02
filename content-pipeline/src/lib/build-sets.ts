import {
  LEVEL_ORDER,
  LEVEL_RANK,
  SET_MAX_SIZE,
  SET_MIN_SIZE,
  SET_TARGET_SIZE,
  SET_TITLE_PROMPT_VERSION,
  type CefrLevel,
} from "../../config";
import type { ClassifiedWord } from "./classify";
import { topicSlug } from "./topics";

export type WordSetDraft = {
  id: string;
  topicId: string;
  level: CefrLevel;
  sortOrder: number;
  title: string;
  titleVi: string;
  wordIds: string[];
  words: string[];
  status: "draft";
};

export type FoldEvent = {
  topicId: string;
  fromLevel: CefrLevel;
  toLevel: CefrLevel;
  wordCount: number;
  wordIds: string[];
};

export type BuildSetsResult = {
  sets: WordSetDraft[];
  folds: FoldEvent[];
};

function compareWords(a: ClassifiedWord, b: ClassifiedWord): number {
  const ar = a.frequencyRank ?? Number.POSITIVE_INFINITY;
  const br = b.frequencyRank ?? Number.POSITIVE_INFINITY;
  if (ar !== br) return ar - br;
  return (
    a.word.localeCompare(b.word) ||
    a.partOfSpeech.localeCompare(b.partOfSpeech)
  );
}

/** How many sets so each size is in [SET_MIN_SIZE, SET_MAX_SIZE]. */
export function planSetCount(n: number): number {
  if (n < SET_MIN_SIZE) return 0;
  let k = Math.max(1, Math.round(n / SET_TARGET_SIZE));
  // Shrink until min size ok
  while (k > 1 && Math.floor(n / k) < SET_MIN_SIZE) k -= 1;
  // Grow until max size ok
  while (Math.ceil(n / k) > SET_MAX_SIZE) {
    k += 1;
    if (Math.floor(n / k) < SET_MIN_SIZE) {
      // Prefer slightly oversized single merge over invalid min — caller folds cells < 12
      k -= 1;
      break;
    }
  }
  return Math.max(1, k);
}

export function splitEvenly<T>(items: T[], k: number): T[][] {
  if (k <= 0) return [];
  if (k === 1) return [items];
  const n = items.length;
  const base = Math.floor(n / k);
  const rem = n % k;
  const out: T[][] = [];
  let i = 0;
  for (let s = 0; s < k; s++) {
    const size = base + (s < rem ? 1 : 0);
    out.push(items.slice(i, i + size));
    i += size;
  }
  return out;
}

type PoolKey = string;
function poolKey(topicId: string, level: CefrLevel): PoolKey {
  return `${topicId}||${level}`;
}

/**
 * Pick fold target: densest other level for this topic (ties → lower CEFR).
 * Avoids A1↔A2 oscillation from naïve “adjacent only” folding.
 */
export function pickFoldTarget(
  topicId: string,
  fromLevel: CefrLevel,
  pools: Map<PoolKey, ClassifiedWord[]>,
): CefrLevel | null {
  let best: CefrLevel | null = null;
  let bestSize = -1;
  for (const level of LEVEL_ORDER) {
    if (level === fromLevel) continue;
    const size = (pools.get(poolKey(topicId, level)) ?? []).length;
    if (size > bestSize || (size === bestSize && best != null && LEVEL_RANK[level] < LEVEL_RANK[best])) {
      best = level;
      bestSize = size;
    }
  }
  // If every other level is empty, still fold toward lower CEFR neighbor / A2
  if (bestSize <= 0) {
    const idx = LEVEL_RANK[fromLevel];
    if (idx > 0) return LEVEL_ORDER[idx - 1]!;
    if (idx < LEVEL_ORDER.length - 1) return LEVEL_ORDER[idx + 1]!;
    return null;
  }
  return best;
}

function foldSmallCells(
  topics: string[],
  pools: Map<PoolKey, ClassifiedWord[]>,
  folds: FoldEvent[],
): void {
  let guard = 0;
  while (guard++ < 100) {
    // Smallest under-filled cell (deterministic: topic alpha, then level order)
    let pick: { topicId: string; level: CefrLevel; cell: ClassifiedWord[] } | null =
      null;
    for (const topicId of topics) {
      for (const level of LEVEL_ORDER) {
        const cell = pools.get(poolKey(topicId, level)) ?? [];
        if (cell.length === 0 || cell.length >= SET_MIN_SIZE) continue;
        if (
          !pick ||
          cell.length < pick.cell.length ||
          (cell.length === pick.cell.length &&
            (topicId < pick.topicId ||
              (topicId === pick.topicId &&
                LEVEL_RANK[level] < LEVEL_RANK[pick.level])))
        ) {
          pick = { topicId, level, cell };
        }
      }
    }
    if (!pick) break;

    const toLevel = pickFoldTarget(pick.topicId, pick.level, pools);
    if (!toLevel || toLevel === pick.level) break;

    const destKey = poolKey(pick.topicId, toLevel);
    const dest = pools.get(destKey) ?? [];
    folds.push({
      topicId: pick.topicId,
      fromLevel: pick.level,
      toLevel,
      wordCount: pick.cell.length,
      wordIds: pick.cell.map((w) => w.id).sort(),
    });
    dest.push(...pick.cell);
    pools.set(destKey, dest);
    pools.delete(poolKey(pick.topicId, pick.level));
  }
}

/**
 * Deterministic set builder.
 * - Order by frequency then alpha within (topic, level)
 * - Fold cells with < 12 words into the densest level of the same topic
 * - Split into even chunks of 12–30 (target ~25)
 */
export function buildSets(words: ClassifiedWord[]): BuildSetsResult {
  const pools = new Map<PoolKey, ClassifiedWord[]>();
  for (const w of words) {
    const key = poolKey(w.topicId, w.level);
    const arr = pools.get(key) ?? [];
    arr.push(w);
    pools.set(key, arr);
  }

  const folds: FoldEvent[] = [];
  const topics = [...new Set(words.map((w) => w.topicId))].sort();

  foldSmallCells(topics, pools, folds);

  const sets: WordSetDraft[] = [];
  let globalSort = 0;

  for (const topicId of topics) {
    for (const level of LEVEL_ORDER) {
      const key = poolKey(topicId, level);
      const cell = (pools.get(key) ?? []).slice().sort(compareWords);
      if (cell.length === 0) continue;

      // Still too small after folds — one set anyway (report later); clamp by merging note
      const k = cell.length < SET_MIN_SIZE ? 1 : planSetCount(cell.length);
      const chunks = splitEvenly(cell, k);

      chunks.forEach((chunk, index) => {
        const setIndex = index + 1;
        const id = `ws-${topicSlug(topicId)}-${level.toLowerCase()}-${String(setIndex).padStart(2, "0")}`;
        const titled = titleForSet(topicId, level, setIndex, chunk);
        globalSort += 1;
        sets.push({
          id,
          topicId,
          level,
          sortOrder: globalSort,
          title: titled.title,
          titleVi: titled.titleVi,
          wordIds: chunk.map((w) => w.id),
          words: chunk.map((w) => w.word),
          status: "draft",
        });
      });
    }
  }

  // Ensure titles unique within level
  enforceUniqueTitles(sets);

  return { sets, folds };
}

const TOPIC_TITLE_VI: Record<string, string> = {
  "Daily life": "Đời sống",
  Work: "Công việc",
  Travel: "Du lịch",
  Food: "Ẩm thực",
  Health: "Sức khỏe",
  School: "Học tập",
  Technology: "Công nghệ",
  Feelings: "Cảm xúc",
  People: "Con người",
  Home: "Nhà cửa",
  Shopping: "Mua sắm",
  Nature: "Thiên nhiên",
  Sports: "Thể thao",
  Media: "Truyền thông",
  Society: "Xã hội",
  Communication: "Giao tiếp",
  Appearance: "Ngoại hình",
  "Grammar words": "Từ ngữ pháp",
};

const SET_LABELS_EN = [
  "essentials",
  "basics",
  "core words",
  "key words",
  "more words",
  "practice pack",
  "review pack",
  "next steps",
  "plus pack",
  "stretch words",
];

/**
 * Cursor-local titles (set-title.v1 rules): 2–4 English words + Vietnamese.
 * Unique within level after enforceUniqueTitles.
 */
export function titleForSet(
  topicId: string,
  level: CefrLevel,
  setIndex: number,
  words: ClassifiedWord[],
): { title: string; titleVi: string } {
  const top = words
    .slice()
    .sort(compareWords)
    .filter((w) => !GRAMMARISH.has(w.word))
    .slice(0, 2)
    .map((w) => w.word);

  const label = SET_LABELS_EN[(setIndex - 1) % SET_LABELS_EN.length]!;
  let title: string;
  if (top.length >= 2 && top.every((t) => t.length <= 10 && !t.includes(" "))) {
    title = `${capitalize(top[0]!)} & ${capitalize(top[1]!)}`;
  } else if (top[0] && top[0].length <= 12 && !top[0].includes(" ")) {
    title = `${topicId} ${capitalize(top[0])}`;
  } else {
    title = `${topicId} ${label}`;
  }

  const parts = title.split(/\s+/);
  if (parts.length > 4) title = parts.slice(0, 4).join(" ");

  const viBase = TOPIC_TITLE_VI[topicId] ?? topicId;
  const titleVi =
    setIndex === 1 ? `${viBase} cơ bản` : `${viBase} phần ${setIndex}`;

  void level;
  return { title, titleVi };
}

const GRAMMARISH = new Set([
  "about","above","after","again","also","always","and","as","at","be","by",
  "for","from","in","into","of","on","or","the","to","with","without",
]);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function enforceUniqueTitles(sets: WordSetDraft[]): void {
  const byLevel = new Map<CefrLevel, WordSetDraft[]>();
  for (const s of sets) {
    const arr = byLevel.get(s.level) ?? [];
    arr.push(s);
    byLevel.set(s.level, arr);
  }

  for (const [, group] of byLevel) {
    const seen = new Map<string, number>();
    for (const s of group) {
      let t = s.title;
      const key = t.toLowerCase();
      const n = (seen.get(key) ?? 0) + 1;
      seen.set(key, n);
      if (n > 1) {
        s.title = `${t} ${n}`;
        s.titleVi = `${s.titleVi} ${n}`;
      }
    }
  }
}

export function setsSummary(sets: WordSetDraft[]): {
  setCount: number;
  sizeMin: number;
  sizeMax: number;
  sizesOutOfRange: WordSetDraft[];
} {
  const sizes = sets.map((s) => s.wordIds.length);
  const sizeMin = sizes.length ? Math.min(...sizes) : 0;
  const sizeMax = sizes.length ? Math.max(...sizes) : 0;
  const sizesOutOfRange = sets.filter(
    (s) =>
      s.wordIds.length < SET_MIN_SIZE || s.wordIds.length > SET_MAX_SIZE,
  );
  return { setCount: sets.length, sizeMin, sizeMax, sizesOutOfRange };
}

export { SET_TITLE_PROMPT_VERSION };
