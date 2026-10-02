import {
  EXCLUDED_POS,
  LEVEL_RANK,
  RESERVED_HEADWORDS,
  type CefrLevel,
} from "../../config";
import { pickUsPrimary, splitVariants } from "./variants";
import type {
  CefrRow,
  NormalisedCandidate,
  PartOfSpeech,
  RejectedRow,
} from "./types";

const OPEN_CLASS_TO_PHRASE = new Set(["noun", "verb", "adjective", "adverb"]);

const POS_MAP: Record<string, PartOfSpeech | "exclude"> = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
  preposition: "preposition",
  conjunction: "conjunction",
  interjection: "interjection",
  determiner: "exclude",
  pronoun: "exclude",
  "be-verb": "exclude",
  "do-verb": "exclude",
  "have-verb": "exclude",
  "modal auxiliary": "exclude",
  "infinitive-to": "exclude",
  number: "exclude",
};

export function mapPos(raw: string): PartOfSpeech | "exclude" | null {
  const key = raw.trim().toLowerCase();
  if (!(key in POS_MAP)) return null;
  return POS_MAP[key]!;
}

export function isExcludedPos(raw: string): boolean {
  return EXCLUDED_POS.has(raw.trim().toLowerCase());
}

export function isCefrLevel(value: string): value is CefrLevel {
  return value === "A1" || value === "A2" || value === "B1" || value === "B2";
}

export function normaliseHeadword(raw: string): {
  word: string;
  notes: string | null;
  isMultiWord: boolean;
} {
  const variants = splitVariants(raw.trim());
  const { primary, alternatives } = pickUsPrimary(variants);
  // Consistent casing: lowercase (keep internal punctuation like a.m., hyphens).
  const word = primary.toLowerCase().replace(/\s+/g, " ").trim();
  const isMultiWord = /\s/.test(word);
  const notes =
    alternatives.length > 0
      ? `Also: ${alternatives.map((a) => a.toLowerCase()).join(", ")}`
      : null;
  return { word, notes, isMultiWord };
}

export function applyPhrasePolicy(
  mappedPos: PartOfSpeech,
  isMultiWord: boolean,
): PartOfSpeech {
  if (
    isMultiWord &&
    OPEN_CLASS_TO_PHRASE.has(mappedPos) &&
    mappedPos !== "phrase"
  ) {
    return "phrase";
  }
  return mappedPos;
}

export function isReservedHeadword(
  word: string,
  partOfSpeech: PartOfSpeech,
): boolean {
  const w = word.toLowerCase();
  return RESERVED_HEADWORDS.some(
    (r) => r.word === w && r.partOfSpeech === partOfSpeech,
  );
}

export function isFlagged(row: CefrRow): boolean {
  return Boolean(
    row.coreInventory1.trim() ||
      row.coreInventory2.trim() ||
      row.threshold.trim(),
  );
}

type MergeBucket = {
  word: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  flagged: boolean;
  notes: string | null;
  otherLevels: Set<CefrLevel>;
  sourcePos: string;
  isMultiWord: boolean;
};

/**
 * Normalise rows, drop closed-class / bad POS / non A1–B2, merge same
 * headword+pos keeping the lowest CEFR level.
 */
export function buildCandidates(rows: CefrRow[]): {
  candidates: NormalisedCandidate[];
  rejected: RejectedRow[];
  reservedExcluded: Array<{ word: string; partOfSpeech: string }>;
} {
  const rejected: RejectedRow[] = [];
  const buckets = new Map<string, MergeBucket>();
  const reservedExcluded: Array<{ word: string; partOfSpeech: string }> = [];
  const reservedSeen = new Set<string>();

  for (const row of rows) {
    if (!isCefrLevel(row.cefr)) {
      rejected.push({
        line: row.line,
        headword: row.headword,
        pos: row.pos,
        reason: `unsupported_level:${row.cefr || "empty"}`,
      });
      continue;
    }

    if (isExcludedPos(row.pos)) {
      rejected.push({
        line: row.line,
        headword: row.headword,
        pos: row.pos,
        reason: `closed_class:${row.pos}`,
      });
      continue;
    }

    const mapped = mapPos(row.pos);
    if (mapped === null) {
      rejected.push({
        line: row.line,
        headword: row.headword,
        pos: row.pos,
        reason: `unknown_pos:${row.pos}`,
      });
      continue;
    }
    if (mapped === "exclude") {
      rejected.push({
        line: row.line,
        headword: row.headword,
        pos: row.pos,
        reason: `closed_class:${row.pos}`,
      });
      continue;
    }

    const { word, notes, isMultiWord } = normaliseHeadword(row.headword);
    if (!word) {
      rejected.push({
        line: row.line,
        headword: row.headword,
        pos: row.pos,
        reason: "empty_headword",
      });
      continue;
    }

    const partOfSpeech = applyPhrasePolicy(mapped, isMultiWord);

    if (isReservedHeadword(word, partOfSpeech)) {
      const key = `${word}|${partOfSpeech}`;
      if (!reservedSeen.has(key)) {
        reservedSeen.add(key);
        reservedExcluded.push({ word, partOfSpeech });
      }
      rejected.push({
        line: row.line,
        headword: row.headword,
        pos: row.pos,
        reason: "reserved_existing_word",
      });
      continue;
    }

    const key = `${word}|${partOfSpeech}`;
    const flagged = isFlagged(row);
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        word,
        partOfSpeech,
        level: row.cefr,
        flagged,
        notes,
        otherLevels: new Set(),
        sourcePos: row.pos.trim().toLowerCase(),
        isMultiWord,
      });
      continue;
    }

    // Merge: keep lowest level; record others; OR flagged; merge notes.
    if (LEVEL_RANK[row.cefr] < LEVEL_RANK[existing.level]) {
      existing.otherLevels.add(existing.level);
      existing.level = row.cefr;
    } else if (row.cefr !== existing.level) {
      existing.otherLevels.add(row.cefr);
    }
    existing.flagged = existing.flagged || flagged;
    if (notes && !existing.notes) existing.notes = notes;
    else if (notes && existing.notes && !existing.notes.includes(notes)) {
      existing.notes = `${existing.notes}; ${notes}`;
    }
  }

  const candidates = [...buckets.values()]
    .map((b) => ({
      word: b.word,
      partOfSpeech: b.partOfSpeech,
      level: b.level,
      flagged: b.flagged,
      notes: b.notes,
      otherLevels: [...b.otherLevels].sort(
        (a, c) => LEVEL_RANK[a] - LEVEL_RANK[c],
      ),
      sourcePos: b.sourcePos,
      isMultiWord: b.isMultiWord,
    }))
    .sort(
      (a, b) =>
        a.word.localeCompare(b.word) ||
        a.partOfSpeech.localeCompare(b.partOfSpeech),
    );

  return { candidates, rejected, reservedExcluded };
}
