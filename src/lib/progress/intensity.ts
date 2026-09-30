import type { ActivityIntensity } from "@/types/profile";

/**
 * Heatmap intensity from study minutes (Phase 0 §1.5):
 * 0 / 1–14 / 15–29 / 30–44 / 45+ → 0–4
 */
export function minutesToIntensity(minutes: number): ActivityIntensity {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 45) return 3;
  return 4;
}

/** Sum duration seconds → whole minutes (floor). */
export function secondsToMinutes(seconds: number): number {
  return Math.max(0, Math.floor(seconds / 60));
}
