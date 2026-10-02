import { readFileSync } from "node:fs";

import { PATHS } from "../../config";
import {
  applyPhrasePolicy,
  isCefrLevel,
  isExcludedPos,
  mapPos,
  normaliseHeadword,
} from "./normalise";
import { parseCefrjCsv } from "./build-skeleton";

/** Map CEFR-J inventory / Threshold labels → our topic ids. */
export const CEFRJ_TAG_TO_TOPIC: Record<string, string> = {
  "Personal identification": "People",
  "Personal information": "People",
  Education: "School",
  "Food and drink": "Food",
  "Free time, entertainment": "Sports",
  Shopping: "Shopping",
  "Work and Jobs": "Work",
  "Objects and rooms": "Home",
  "House and home, environment": "Home",
  "News, lifestyles and current affairs": "Society",
  "Things in the town, shops and shopping": "Shopping",
  Travel: "Travel",
  "Travel and services vocab": "Travel",
  "Health and body care": "Health",
  "Hobbies and pastimes": "Sports",
  "Relations with other people": "People",
  Services: "Shopping",
  "Leisure activities": "Sports",
  "Nationalities and countries": "Society",
  "Family life": "People",
  Clothes: "Appearance",
  Media: "Media",
  "Books and literature": "Media",
  "Ways of travelling": "Travel",
  "Ways of traveling": "Travel",
  Language: "Communication",
  "Daily life": "Daily life",
  Weather: "Nature",
  Arts: "Media",
  Art: "Media",
  Places: "Travel",
  Collocation: "Daily life",
  Colours: "Appearance",
  "Technical and legal language": "Society",
  Film: "Media",
  Holidays: "Travel",
  "Idiomatic expressions": "Daily life",
  "Scientific development": "Technology",
  // "Things in the town…" stays Shopping, but civic buildings usually also
  // carry Relations / Places — tag scoring prefers those (see TAG_SCORE).
};

export type CefrjTagIndex = Map<string, string[]>;

/** key = `${word}|${partOfSpeech}` → unique CEFR-J tag strings */
export function loadCefrjTagIndex(cefrjPath = PATHS.cefrjCsv): CefrjTagIndex {
  const rows = parseCefrjCsv(readFileSync(cefrjPath, "utf8"));
  const index: CefrjTagIndex = new Map();

  for (const r of rows) {
    if (!isCefrLevel(r.cefr) || isExcludedPos(r.pos)) continue;
    const mapped = mapPos(r.pos);
    if (!mapped || mapped === "exclude") continue;
    const { word, isMultiWord } = normaliseHeadword(r.headword);
    if (!word) continue;
    const pos = applyPhrasePolicy(mapped, isMultiWord);
    const tags = [r.coreInventory1, r.coreInventory2, r.threshold]
      .map((s) => s.trim())
      .filter(Boolean);
    if (!tags.length) continue;
    const key = `${word}|${pos}`;
    const prev = index.get(key) ?? [];
    index.set(key, [...new Set([...prev, ...tags])]);
  }

  return index;
}

/** Higher = prefer when a row has multiple CEFR-J tags. */
const TAG_SCORE: Record<string, number> = {
  // Domain tags outrank broad social tags so Work/School/etc. win ties.
  "Health and body care": 9,
  "Food and drink": 9,
  Clothes: 9,
  Weather: 9,
  Education: 9,
  Media: 8,
  Film: 8,
  "Books and literature": 8,
  "Work and Jobs": 8,
  Travel: 8,
  "Ways of travelling": 8,
  "Ways of traveling": 8,
  Holidays: 8,
  "Scientific development": 8,
  Language: 8,
  Shopping: 7,
  "Hobbies and pastimes": 7,
  "Leisure activities": 7,
  "House and home, environment": 7,
  "Travel and services vocab": 7,
  "Technical and legal language": 7,
  "Family life": 7,
  "Personal identification": 6,
  "Personal information": 6,
  "Relations with other people": 5,
  "Nationalities and countries": 6,
  "News, lifestyles and current affairs": 6,
  "Free time, entertainment": 4,
  "Objects and rooms": 5,
  Places: 5,
  Services: 3,
  "Things in the town, shops and shopping": 3,
  "Daily life": 2,
  Collocation: 1,
  "Idiomatic expressions": 1,
  Arts: 7,
  Art: 7,
  Colours: 7,
};

export function topicFromCefrjTags(tags: string[]): string | null {
  let best: { topic: string; score: number } | null = null;
  for (const tag of tags) {
    const topic = CEFRJ_TAG_TO_TOPIC[tag];
    if (!topic) continue;
    const score = TAG_SCORE[tag] ?? 1;
    if (!best || score > best.score) best = { topic, score };
  }
  return best?.topic ?? null;
}
