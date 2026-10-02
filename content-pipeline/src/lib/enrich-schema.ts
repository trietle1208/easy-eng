import { z } from "zod";

import { LEVEL_ORDER, type CefrLevel } from "../../config";

export const enrichExampleSchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
});

/** Model / agent output for one word (Zod contract). */
export const enrichModelItemSchema = z.object({
  id: z.string().min(1),
  meaningVi: z.string().min(1),
  definitionEn: z.string().min(1),
  examples: z.array(enrichExampleSchema).length(2),
  collocations: z.array(z.string().min(1)).min(2).max(4).nullable(),
  notes: z.string().min(1).nullable(),
});

export const enrichModelBatchSchema = z.array(enrichModelItemSchema);

export type EnrichModelItem = z.infer<typeof enrichModelItemSchema>;

export type EnrichIssue = {
  id: string;
  code: string;
  message: string;
};

const VI_ORTHO = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Common irregular surface forms keyed by lemma (validation helper). */
const IRREGULAR_FORMS: Record<string, string[]> = {
  go: ["went", "gone", "goes", "going"],
  come: ["came", "comes", "coming"],
  take: ["took", "taken", "takes", "taking"],
  make: ["made", "makes", "making"],
  get: ["got", "gotten", "gets", "getting"],
  see: ["saw", "seen", "sees", "seeing"],
  know: ["knew", "known", "knows", "knowing"],
  think: ["thought", "thinks", "thinking"],
  give: ["gave", "given", "gives", "giving"],
  find: ["found", "finds", "finding"],
  tell: ["told", "tells", "telling"],
  become: ["became", "becomes", "becoming"],
  leave: ["left", "leaves", "leaving"],
  leaf: ["leaves"],
  feel: ["felt", "feels", "feeling"],
  bring: ["brought", "brings", "bringing"],
  begin: ["began", "begun", "begins", "beginning"],
  write: ["wrote", "written", "writes", "writing"],
  speak: ["spoke", "spoken", "speaks", "speaking"],
  choose: ["chose", "chosen", "chooses", "choosing"],
  buy: ["bought", "buys", "buying"],
  eat: ["ate", "eaten", "eats", "eating"],
  drink: ["drank", "drunk", "drinks", "drinking"],
  run: ["ran", "runs", "running"],
  sit: ["sat", "sits", "sitting"],
  win: ["won", "wins", "winning"],
  lose: ["lost", "loses", "losing"],
  break: ["broke", "broken", "breaks", "breaking"],
  drive: ["drove", "driven", "drives", "driving"],
  wear: ["wore", "worn", "wears", "wearing"],
  catch: ["caught", "catches", "catching"],
  teach: ["taught", "teaches", "teaching"],
  sleep: ["slept", "sleeps", "sleeping"],
  swim: ["swam", "swum", "swims", "swimming"],
  sing: ["sang", "sung", "sings", "singing"],
  grow: ["grew", "grown", "grows", "growing"],
  fall: ["fell", "fallen", "falls", "falling"],
  send: ["sent", "sends", "sending"],
  build: ["built", "builds", "building"],
  understand: ["understood", "understands", "understanding"],
  draw: ["drew", "drawn", "draws", "drawing"],
  spend: ["spent", "spends", "spending"],
  rise: ["rose", "risen", "rises", "rising"],
  sell: ["sold", "sells", "selling"],
  fight: ["fought", "fights", "fighting"],
  forget: ["forgot", "forgotten", "forgets", "forgetting"],
  forgive: ["forgave", "forgiven", "forgives", "forgiving"],
  pay: ["paid", "pays", "paying"],
  meet: ["met", "meets", "meeting"],
  mean: ["meant", "means", "meaning"],
  read: ["reads", "reading"],
  set: ["sets", "setting"],
  let: ["lets", "letting"],
  cut: ["cuts", "cutting"],
  put: ["puts", "putting"],
  hit: ["hits", "hitting"],
  cry: ["cries", "cried", "crying"],
  die: ["dies", "died", "dying"],
  arise: ["arises", "arose", "arisen", "arising"],
  hold: ["held", "holds", "holding"],
  keep: ["kept", "keeps", "keeping"],
  lead: ["led", "leads", "leading"],
  hear: ["heard", "hears", "hearing"],
  stand: ["stood", "stands", "standing"],
  throw: ["threw", "thrown", "throws", "throwing"],
  seek: ["sought", "seeks", "seeking"],
  lie: ["lay", "lain", "lies", "lying"],
};

/** Loose check: headword or simple inflection appears in example. */
export function exampleContainsHeadword(en: string, headword: string): boolean {
  const h = headword.toLowerCase().trim();
  const text = en.toLowerCase();
  if (!h) return false;
  if (h.includes(" ")) {
    return text.includes(h);
  }
  const esc = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${esc}(?:s|es|ed|ing|er|est|'s)?\\b`, "i");
  if (re.test(text)) return true;
  const irreg = IRREGULAR_FORMS[h];
  if (irreg) {
    for (const form of irreg) {
      if (new RegExp(`\\b${form}\\b`, "i").test(text)) return true;
    }
  }
  if (h.length >= 4) {
    const stem = esc.slice(0, 4);
    return new RegExp(`\\b${stem}`, "i").test(text);
  }
  return false;
}

export function softValidateEnrichItem(
  item: EnrichModelItem,
  meta: { word: string; level: CefrLevel },
): EnrichIssue[] {
  const issues: EnrichIssue[] = [];
  const { word, level } = meta;

  if (!VI_ORTHO.test(item.meaningVi) && !/^[\p{L}\s,;/()-]+$/u.test(item.meaningVi)) {
    issues.push({
      id: item.id,
      code: "MEANING_VI",
      message: "meaningVi looks empty of Vietnamese orthography",
    });
  }
  if (/[A-Za-z]{3,}/.test(item.meaningVi) && /[aeiouy]{2,}/i.test(item.meaningVi)) {
    // Allow short VN words; flag obvious English leftovers (crude)
    const latinChunks = item.meaningVi.match(/[A-Za-z]{4,}/g) ?? [];
    if (latinChunks.some((c) => !/^(và|của|cho|với|một|các|những)$/i.test(c))) {
      // still allow; Phase 5 will be stricter — only hard-fail pure English
    }
  }

  const defWords = wordCount(item.definitionEn);
  if (defWords > 15) {
    issues.push({
      id: item.id,
      code: "DEF_LEN",
      message: `definitionEn has ${defWords} words (>15)`,
    });
  }
  const defLower = item.definitionEn.toLowerCase();
  const hw = word.toLowerCase();
  if (hw) {
    const esc = hw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Word-boundary only (avoid false positive: "phone" inside "telephone")
    if (new RegExp(`\\b${esc}\\b`).test(defLower)) {
      issues.push({
        id: item.id,
        code: "DEF_HEADWORD",
        message: "definitionEn contains the headword",
      });
    }
  }

  const maxEx = level === "A1" || level === "A2" ? 12 : 16;
  const minEx = level === "A1" || level === "A2" ? 5 : 1;
  for (let i = 0; i < item.examples.length; i++) {
    const ex = item.examples[i]!;
    const n = wordCount(ex.en);
    if (level === "A1" || level === "A2") {
      if (n < minEx || n > maxEx) {
        issues.push({
          id: item.id,
          code: "EX_LEN",
          message: `example[${i}].en has ${n} words (want ${minEx}–${maxEx})`,
        });
      }
    } else if (n > maxEx || n < 3) {
      issues.push({
        id: item.id,
        code: "EX_LEN",
        message: `example[${i}].en has ${n} words (want ≤${maxEx})`,
      });
    }
    if (!exampleContainsHeadword(ex.en, word)) {
      issues.push({
        id: item.id,
        code: "EX_HEADWORD",
        message: `example[${i}].en missing headword/inflection`,
      });
    }
  }

  if (item.collocations != null) {
    if (item.collocations.length < 2 || item.collocations.length > 4) {
      issues.push({
        id: item.id,
        code: "COLLOC",
        message: "collocations must be 2–4 items or null",
      });
    }
  }

  return issues;
}

export function validateBatchAgainstIds(
  batch: EnrichModelItem[],
  expectedIds: string[],
): { ok: boolean; issues: EnrichIssue[]; byId: Map<string, EnrichModelItem> } {
  const issues: EnrichIssue[] = [];
  const byId = new Map<string, EnrichModelItem>();
  const expected = new Set(expectedIds);

  for (const item of batch) {
    if (!expected.has(item.id)) {
      issues.push({
        id: item.id,
        code: "EXTRA_ID",
        message: "id not in input batch",
      });
      continue;
    }
    if (byId.has(item.id)) {
      issues.push({ id: item.id, code: "DUP_ID", message: "duplicate id in output" });
      continue;
    }
    byId.set(item.id, item);
  }

  for (const id of expectedIds) {
    if (!byId.has(id)) {
      issues.push({ id, code: "MISSING_ID", message: "id missing from output" });
    }
  }

  return { ok: issues.length === 0, issues, byId };
}

export function isCefrLevel(v: string): v is CefrLevel {
  return (LEVEL_ORDER as string[]).includes(v);
}
