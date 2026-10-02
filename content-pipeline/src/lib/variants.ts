/**
 * Pick US spelling as primary when CEFR-J lists slash variants.
 * Score is relative; higher = more American.
 */
export function americanScore(word: string): number {
  const w = word.toLowerCase();
  let score = 0;

  // US -ize / -yze vs UK -ise / -yse (analyze, organize, …)
  if (/(?:ize|yze|ization|yzation|izing|yzing|ized|yzed)$/.test(w)) score += 4;
  if (/(?:ise|yse|isation|ysation|ising|ysing|ised|ysed)$/.test(w)) score -= 4;

  if (/(?:our)$/.test(w)) score -= 3;
  if (/(?:or)$/.test(w) && !/(?:oor|eor|ior)$/.test(w)) score += 1;

  if (/(?:[tcdsg])re$/.test(w)) score -= 3;
  if (/(?:[tcdsg])er$/.test(w)) score += 2;

  if (/ogue$/.test(w)) score -= 3;
  if (/og$/.test(w)) score += 2;

  if (["defence", "offence", "licence"].includes(w)) score -= 3;
  if (["defense", "offense", "license"].includes(w)) score += 3;

  if (w === "aeroplane" || w === "aluminium" || w === "jewellery") score -= 4;
  if (w === "airplane" || w === "aluminum" || w === "jewelry") score += 4;

  if (w === "disc" || w.startsWith("disc ")) score -= 1;
  if (w === "disk" || w.startsWith("disk ")) score += 1;

  if (w === "archeologist") score += 2;
  if (w === "archaeologist") score -= 1;

  if (w === "advisor") score += 2;
  if (w === "adviser") score -= 1;

  if (w === "ax") score += 1;
  if (w === "axe") score -= 1;

  // US double-L / simpler forms vs UK
  if (w === "enroll" || w === "fulfill" || w === "skillful") score += 3;
  if (w === "enrol" || w === "fulfil" || w === "skilful") score -= 3;
  if (w === "yogurt") score += 3;
  if (w === "yoghurt") score -= 3;
  if (w === "gray") score += 2;
  if (w === "grey") score -= 2;

  // Prefer unaccented cafe over café for learner headwords.
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(w)) score -= 2;

  return score;
}

export function pickUsPrimary(variants: string[]): {
  primary: string;
  alternatives: string[];
} {
  const cleaned = variants.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { primary: "", alternatives: [] };
  }
  if (cleaned.length === 1) {
    return { primary: cleaned[0]!, alternatives: [] };
  }

  const scored = cleaned.map((v) => ({ v, score: americanScore(v) }));
  scored.sort((a, b) => b.score - a.score || a.v.localeCompare(b.v));
  return {
    primary: scored[0]!.v,
    alternatives: scored.slice(1).map((s) => s.v),
  };
}

export function splitVariants(raw: string): string[] {
  return raw.split("/").map((s) => s.trim()).filter(Boolean);
}
