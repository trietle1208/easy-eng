/** Deterministic non-crypto hash for stable picks (WOTD, etc.). */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick a stable index in `[0, length)`. */
export function pickIndex(key: string, length: number): number {
  if (length <= 0) return 0;
  return hashString(key) % length;
}
