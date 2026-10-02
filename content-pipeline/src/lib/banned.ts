/** Profanity / sensitive topics — keep short; Phase 5 rule check only. */
export const PROFANITY_AND_SENSITIVE = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "piss",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "retard",
  "suicide",
  "rape",
  "murder",
  "terrorist",
  "cocaine",
  "heroin",
  "meth",
] as const;

/**
 * Real-person / brand names that must not appear in learner examples.
 * Avoid bare ambiguous tokens (e.g. "apple" the fruit).
 */
export const BANNED_NAMES_AND_BRANDS = [
  "google",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "x.com",
  "amazon",
  "microsoft",
  "netflix",
  "spotify",
  "uber",
  "airbnb",
  "mcdonald",
  "starbucks",
  "coca-cola",
  "cocacola",
  "coca cola",
  "pepsi",
  "iphone",
  "ipad",
  "samsung",
  "nike",
  "adidas",
  "tesla",
  "disney",
  "harry potter",
  "taylor swift",
  "elon musk",
  "trump",
  "biden",
  "obama",
  "messi",
  "ronaldo",
  "beyonce",
  "oprah",
] as const;

/** Headwords that are sensitive but valid CEFR vocabulary — warn, don't error on self. */
export const SENSITIVE_HEADWORDS = new Set([
  "murder",
  "suicide",
  "terrorist",
  "rape",
]);

const URL_RE = /https?:\/\/|www\.\w|\w+\.(com|org|net|io|vn)\b/i;
const DIGITS_ONLY_RE = /^\d+$/;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string): boolean {
  const t = text.toLowerCase();
  const p = phrase.toLowerCase();
  if (p.includes(" ") || p.includes(".")) {
    return t.includes(p);
  }
  return new RegExp(`\\b${escapeRe(p)}\\b`, "i").test(text);
}

export type BannedHit = {
  kind: "profanity" | "name_brand" | "url" | "digits";
  match: string;
};

export type BannedScanOptions = {
  /** Terms to ignore (usually the headword + inflections). */
  ignore?: string[];
  /** If true, skip brand/name checks (use for notes that explain brands). */
  skipNames?: boolean;
};

/** Scan meaning, definition, examples, collocations, notes. */
export function findBannedContent(
  parts: string[],
  opts: BannedScanOptions = {},
): BannedHit[] {
  const hits: BannedHit[] = [];
  const seen = new Set<string>();
  const ignore = new Set(
    (opts.ignore ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean),
  );
  const push = (hit: BannedHit) => {
    if (ignore.has(hit.match.toLowerCase())) return;
    const key = `${hit.kind}:${hit.match}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(hit);
  };

  for (const raw of parts) {
    const text = raw?.trim() ?? "";
    if (!text) continue;

    if (DIGITS_ONLY_RE.test(text)) {
      push({ kind: "digits", match: text });
    }
    if (URL_RE.test(text)) {
      push({ kind: "url", match: text.match(URL_RE)?.[0] ?? "url" });
    }
    for (const w of PROFANITY_AND_SENSITIVE) {
      if (containsPhrase(text, w)) push({ kind: "profanity", match: w });
    }
    if (!opts.skipNames) {
      for (const w of BANNED_NAMES_AND_BRANDS) {
        if (containsPhrase(text, w)) push({ kind: "name_brand", match: w });
      }
    }
  }

  return hits;
}
