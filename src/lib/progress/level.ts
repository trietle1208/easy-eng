import { CEFR_LABELS, CEFR_LEVELS, type CefrLevel } from "@/types/cefr";
import type { LevelProgress } from "@/types/profile";

/** Unlock next band when previous completion ≥ this percent. */
export const LEVEL_UNLOCK_THRESHOLD = 80;

export type LevelContentCounts = {
  grammarTotal: number;
  grammarDone: number;
  readingTotal: number;
  readingDone: number;
  listeningTotal: number;
  listeningDone: number;
};

/**
 * Equal-weight completion of grammar + reading + listening at a CEFR band.
 * Missing content kinds (total 0) are omitted from the average.
 */
export function levelCompletionPercent(counts: LevelContentCounts): number {
  const parts: number[] = [];
  if (counts.grammarTotal > 0) {
    parts.push(counts.grammarDone / counts.grammarTotal);
  }
  if (counts.readingTotal > 0) {
    parts.push(counts.readingDone / counts.readingTotal);
  }
  if (counts.listeningTotal > 0) {
    parts.push(counts.listeningDone / counts.listeningTotal);
  }
  if (parts.length === 0) return 0;
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  return Math.max(0, Math.min(100, Math.round(avg * 100)));
}

export function computeLevelProgress(
  userLevel: CefrLevel,
  percentByLevel: Record<CefrLevel, number>,
): LevelProgress[] {
  const userIdx = CEFR_LEVELS.indexOf(userLevel);
  return CEFR_LEVELS.map((level, idx) => {
    const percent = percentByLevel[level] ?? 0;
    const current = level === userLevel;
    let locked = false;
    if (idx > 0) {
      const prev = CEFR_LEVELS[idx - 1]!;
      const prevPercent = percentByLevel[prev] ?? 0;
      // Bands at or below the user's declared level stay unlocked.
      if (idx > userIdx && prevPercent < LEVEL_UNLOCK_THRESHOLD) {
        locked = true;
      }
    }
    const statusLabel = locked
      ? "Locked"
      : percent >= 100
        ? "Done"
        : `${percent}%`;
    return {
      level,
      label: CEFR_LABELS[level],
      percent: locked ? 0 : percent,
      statusLabel,
      current,
      locked,
    };
  });
}
