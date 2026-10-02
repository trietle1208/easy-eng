import { existsSync, readFileSync } from "node:fs";

import {
  LOW_CONFIDENCE_THRESHOLD,
  PATHS,
  RESERVED_HEADWORDS,
  type CefrLevel,
} from "../../config";
import { findBannedContent, SENSITIVE_HEADWORDS } from "./banned";
import {
  countWordsAboveLevel,
  loadCefrLevelIndex,
  type CefrLevelIndex,
} from "./cefr-level-index";
import type { EnrichedWord } from "./enrich";
import {
  exampleContainsHeadword,
  wordCount,
} from "./enrich-schema";

export type IssueSeverity = "error" | "warning";

export type ValidationIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
};

export type WordSetRef = {
  id: string;
  wordIds: string[];
};

const VI_ORTHO =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

/** English glue words — if a diacritic-free gloss is full of these, it's not VN. */
const EN_GLOSS_MARKERS =
  /\b(the|a|an|to|of|for|with|that|this|these|those|is|are|was|were|be|been|being|and|or|but|from|into|about|over|under|after|before|when|where|which|who|whom|whose|what|how|why|not|no|yes|it|its|as|by|on|in|at|up|out|off|than|then|so|if|my|your|his|her|our|their|me|him|us|them|we|you|they|he|she)\b/i;

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function normalizeForDup(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function isVietnameseMeaning(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (VI_ORTHO.test(t)) return true;
  // Undiacriticized / loanword glosses: "mua", "sau khi", "tivi", "website"
  const tokens = t
    .toLowerCase()
    .replace(/[^\p{L}\s,/;-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0 || tokens.length > 8) return false;
  if (EN_GLOSS_MARKERS.test(t)) return false;
  // Must not look like a full English definition sentence
  if (tokens.length >= 4 && tokens.every((tok) => /^[a-z]+$/i.test(tok))) {
    // 4+ pure-latin tokens without VN orthography → likely English
    return false;
  }
  return true;
}

/** Latin-only sentence that looks copied from English definition. */
export function looksLikeLatinOnlyCopy(
  meaningVi: string,
  definitionEn: string,
): boolean {
  const m = meaningVi.trim();
  if (!m || VI_ORTHO.test(m)) return false;
  // If mostly ASCII letters/spaces and overlaps definition tokens heavily
  if (!/^[A-Za-z0-9\s,.'"\-;/()]+$/.test(m)) return false;
  const mw = normalizeForDup(m);
  const dw = normalizeForDup(definitionEn);
  if (mw.length < 3) return false;
  return jaccard(mw, dw) >= 0.5;
}

export function examplesNearDuplicate(en1: string, en2: string): boolean {
  const a = normalizeForDup(en1);
  const b = normalizeForDup(en2);
  if (a.length === 0 || b.length === 0) return false;
  if (a.join(" ") === b.join(" ")) return true;
  return jaccard(a, b) >= 0.85;
}

export type CatalogContext = {
  ids: Set<string>;
  headwordPos: Map<string, string[]>;
  wordToSets: Map<string, string[]>;
  setIds: Set<string>;
  unknownSetWordIds: string[];
  cefrIndex: CefrLevelIndex;
};

export function loadSets(filePath = PATHS.setsJson): WordSetRef[] {
  if (!existsSync(filePath)) return [];
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as {
    sets: WordSetRef[];
  };
  return raw.sets ?? [];
}

export function buildCatalogContext(
  words: EnrichedWord[],
  sets: WordSetRef[],
  cefrIndex?: CefrLevelIndex,
): CatalogContext {
  const ids = new Set<string>();
  const headwordPos = new Map<string, string[]>();
  for (const w of words) {
    ids.add(w.id);
    const key = `${w.word.toLowerCase()}|${w.partOfSpeech}`;
    const list = headwordPos.get(key) ?? [];
    list.push(w.id);
    headwordPos.set(key, list);
  }

  // Reserved hand-written words — flag pipeline clashes as DUP_SYSTEM
  for (const r of RESERVED_HEADWORDS) {
    const key = `${r.word.toLowerCase()}|${r.partOfSpeech}`;
    const list = headwordPos.get(key) ?? [];
    list.push(`reserved:${r.word}`);
    headwordPos.set(key, list);
  }

  const wordToSets = new Map<string, string[]>();
  const setIds = new Set<string>();
  const unknownSetWordIds: string[] = [];
  for (const s of sets) {
    setIds.add(s.id);
    for (const wid of s.wordIds) {
      if (!ids.has(wid)) unknownSetWordIds.push(wid);
      const list = wordToSets.get(wid) ?? [];
      list.push(s.id);
      wordToSets.set(wid, list);
    }
  }

  return {
    ids,
    headwordPos,
    wordToSets,
    setIds,
    unknownSetWordIds,
    cefrIndex: cefrIndex ?? loadCefrLevelIndex(),
  };
}

function schemaIssues(w: EnrichedWord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!w.id?.trim()) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "missing id",
    });
  }
  if (!w.word?.trim()) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "missing word",
    });
  }
  if (!w.partOfSpeech) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "missing partOfSpeech",
    });
  }
  if (!w.level) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "missing level",
    });
  }
  if (typeof w.meaningVi !== "string") {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "missing meaningVi",
    });
  }
  if (typeof w.definitionEn !== "string") {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "missing definitionEn",
    });
  }
  if (!Array.isArray(w.examples)) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "examples must be an array",
    });
  }
  return issues;
}

/** Per-word rule checks (Phase 0 codes). */
export function validateWord(
  w: EnrichedWord,
  ctx: CatalogContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  issues.push(...schemaIssues(w));
  if (issues.some((i) => i.code === "SCHEMA" && i.severity === "error")) {
    return issues;
  }

  const key = `${w.word.toLowerCase()}|${w.partOfSpeech}`;
  const dups = ctx.headwordPos.get(key) ?? [];
  const otherCatalog = dups.filter(
    (id) => id !== w.id && !id.startsWith("reserved:"),
  );
  if (otherCatalog.length > 0) {
    issues.push({
      code: "DUP_SYSTEM",
      severity: "error",
      message: `duplicate headword+pos with ${otherCatalog.join(", ")}`,
    });
  }
  if (dups.some((id) => id.startsWith("reserved:"))) {
    issues.push({
      code: "DUP_SYSTEM",
      severity: "error",
      message: `clashes with reserved headword+pos`,
    });
  }

  const sets = ctx.wordToSets.get(w.id) ?? [];
  if (sets.length === 0) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: "word not referenced by any set",
    });
  } else if (sets.length > 1) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: `word in multiple sets: ${sets.join(", ")}`,
    });
  }

  const meaning = (w.meaningVi ?? "").trim();
  if (!meaning) {
    issues.push({
      code: "MEANING_VI",
      severity: "error",
      message: "meaningVi is empty",
    });
  } else if (!isVietnameseMeaning(meaning)) {
    issues.push({
      code: "MEANING_VI",
      severity: "error",
      message: "meaningVi lacks Vietnamese orthography",
    });
  } else if (looksLikeLatinOnlyCopy(meaning, w.definitionEn ?? "")) {
    issues.push({
      code: "MEANING_VI",
      severity: "error",
      message: "meaningVi looks like a Latin-only copy of the definition",
    });
  }

  const def = (w.definitionEn ?? "").trim();
  const defWords = wordCount(def);
  if (defWords > 15) {
    issues.push({
      code: "DEF_LEN",
      severity: "error",
      message: `definitionEn has ${defWords} words (>15)`,
    });
  }
  const hw = w.word.toLowerCase();
  if (hw && def) {
    const esc = hw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${esc}\\b`).test(def.toLowerCase())) {
      issues.push({
        code: "DEF_HEADWORD",
        severity: "error",
        message: "definitionEn contains the headword",
      });
    }
  }

  const examples = w.examples ?? [];
  if (examples.length !== 2) {
    issues.push({
      code: "EX_COUNT",
      severity: "error",
      message: `expected 2 examples, got ${examples.length}`,
    });
  } else {
    const maxEx = w.level === "A1" || w.level === "A2" ? 12 : 16;
    const minEx = w.level === "A1" || w.level === "A2" ? 5 : 3;
    for (let i = 0; i < 2; i++) {
      const ex = examples[i]!;
      if (!ex?.en?.trim()) {
        issues.push({
          code: "EX_COUNT",
          severity: "error",
          message: `example[${i}].en missing`,
        });
        continue;
      }
      if (!ex?.vi?.trim()) {
        issues.push({
          code: "EX_COUNT",
          severity: "error",
          message: `example[${i}].vi missing`,
        });
      }
      const n = wordCount(ex.en);
      if (n < minEx || n > maxEx) {
        issues.push({
          code: "EX_LEN",
          severity: "error",
          message: `example[${i}].en has ${n} words (want ${minEx}–${maxEx})`,
        });
      }
      if (!exampleContainsHeadword(ex.en, w.word)) {
        issues.push({
          code: "EX_HEADWORD",
          severity: "error",
          message: `example[${i}].en missing headword/inflection`,
        });
      }
    }
    if (
      examples[0]?.en &&
      examples[1]?.en &&
      examplesNearDuplicate(examples[0].en, examples[1].en)
    ) {
      issues.push({
        code: "EX_DUP",
        severity: "warning",
        message: "two examples are near-identical",
      });
    }
  }

  const leak = countWordsAboveLevel(
    [def, ...(examples.map((e) => e.en ?? ""))],
    w.level as CefrLevel,
    ctx.cefrIndex,
    w.word,
  );
  if (leak.count > 1) {
    issues.push({
      code: "LEVEL_LEAK",
      severity: "warning",
      message: `>1 content word above ${w.level}: ${leak.words.slice(0, 8).join(", ")}`,
    });
  }

  const ignoreTerms = [
    w.word,
    ...w.word.toLowerCase().split(/\s+/),
  ];
  const learnerParts = [
    meaning,
    def,
    ...examples.map((e) => e.en ?? ""),
    ...examples.map((e) => e.vi ?? ""),
    ...(w.collocations ?? []),
  ];
  const banned = findBannedContent(learnerParts, { ignore: ignoreTerms });
  // Notes may mention brands as teaching points — only scan for profanity/URLs
  const noteBanned = findBannedContent([w.notes ?? "", w.enrichNotes ?? ""], {
    ignore: ignoreTerms,
    skipNames: true,
  });
  for (const hit of [...banned, ...noteBanned]) {
    issues.push({
      code: "BANNED",
      severity: "error",
      message: `${hit.kind}: ${hit.match}`,
    });
  }
  if (SENSITIVE_HEADWORDS.has(w.word.toLowerCase())) {
    issues.push({
      code: "BANNED",
      severity: "warning",
      message: `sensitive headword "${w.word}" — human spot-check`,
    });
  }

  if (w.ipaSource === "missing" || !w.ipa?.trim()) {
    issues.push({
      code: "IPA_MISSING",
      severity: "warning",
      message: "ipa missing (dictionary lookup failed)",
    });
  }

  if (w.confidence < LOW_CONFIDENCE_THRESHOLD) {
    issues.push({
      code: "TOPIC_LOW",
      severity: "warning",
      message: `topic confidence ${w.confidence} < ${LOW_CONFIDENCE_THRESHOLD}`,
    });
  }

  const highFreq =
    w.frequencyRank != null &&
    w.frequencyRank <= 3000 &&
    (w.partOfSpeech === "noun" || w.partOfSpeech === "verb");
  if (highFreq && (w.collocations == null || w.collocations.length < 2)) {
    issues.push({
      code: "COLLOC",
      severity: "warning",
      message: "high-frequency noun/verb missing 2–4 collocations",
    });
  }

  return issues;
}

/** Catalog-level issues (orphan set refs, duplicate ids). */
export function validateCatalog(
  words: EnrichedWord[],
  ctx: CatalogContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    if (seen.has(w.id)) {
      issues.push({
        code: "SCHEMA",
        severity: "error",
        message: `duplicate id ${w.id}`,
      });
    }
    seen.add(w.id);
  }
  for (const wid of ctx.unknownSetWordIds) {
    issues.push({
      code: "SCHEMA",
      severity: "error",
      message: `set references unknown word id ${wid}`,
    });
  }
  return issues;
}

export function hasError(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export function hasWarning(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "warning");
}
