/** Fold Vietnamese/Latin accents for case-insensitive search. */
export function foldSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    // đ/Đ do not decompose under NFD
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}
