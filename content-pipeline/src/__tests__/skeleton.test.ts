import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { RESERVED_WORD_IDS } from "../../config";
import { buildSkeleton, parseCefrjCsv } from "../lib/build-skeleton";
import { stableWordId, slugifyHeadword } from "../lib/ids";
import { arpabetToIpa, loadCmudict, lookupIpa } from "../lib/ipa";
import {
  applyPhrasePolicy,
  buildCandidates,
  mapPos,
  normaliseHeadword,
} from "../lib/normalise";
import {
  allocatePosQuotas,
  compareForSelection,
  selectByQuotas,
  seededSample,
} from "../lib/select";
import { americanScore, pickUsPrimary } from "../lib/variants";
import type { CefrRow, NormalisedCandidate } from "../lib/types";

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

describe("normalisation", () => {
  it("prefers US spelling and stores UK in notes", () => {
    const a = normaliseHeadword("analyze/analyse");
    expect(a.word).toBe("analyze");
    expect(a.notes).toContain("analyse");

    const b = normaliseHeadword("color/colour");
    expect(b.word).toBe("color");
    expect(b.notes).toContain("colour");

    const c = normaliseHeadword("airplane/aeroplane");
    expect(c.word).toBe("airplane");
  });

  it("trims, lowercases, and marks multi-word", () => {
    const n = normaliseHeadword("  Bank Account  ");
    expect(n.word).toBe("bank account");
    expect(n.isMultiWord).toBe(true);
  });

  it("maps POS and applies phrase policy for open-class multi-word", () => {
    expect(mapPos("noun")).toBe("noun");
    expect(mapPos("modal auxiliary")).toBe("exclude");
    expect(applyPhrasePolicy("noun", true)).toBe("phrase");
    expect(applyPhrasePolicy("preposition", true)).toBe("preposition");
  });

  it("americanScore ranks -ize above -ise", () => {
    expect(americanScore("organize")).toBeGreaterThan(americanScore("organise"));
    const { primary } = pickUsPrimary(["organise", "organize"]);
    expect(primary).toBe("organize");
  });
});

describe("closed-class + merge", () => {
  it("rejects closed-class and merges duplicate headword+pos to lowest level", () => {
    const rows: CefrRow[] = [
      {
        headword: "the",
        pos: "determiner",
        cefr: "A1",
        coreInventory1: "x",
        coreInventory2: "",
        threshold: "",
        line: 2,
      },
      {
        headword: "run",
        pos: "verb",
        cefr: "B1",
        coreInventory1: "",
        coreInventory2: "",
        threshold: "",
        line: 3,
      },
      {
        headword: "run",
        pos: "verb",
        cefr: "A2",
        coreInventory1: "Core",
        coreInventory2: "",
        threshold: "",
        line: 4,
      },
      {
        headword: "gate",
        pos: "noun",
        cefr: "A1",
        coreInventory1: "",
        coreInventory2: "",
        threshold: "",
        line: 5,
      },
    ];
    const { candidates, rejected, reservedExcluded } = buildCandidates(rows);
    expect(rejected.some((r) => r.reason.startsWith("closed_class"))).toBe(true);
    expect(reservedExcluded).toEqual([
      { word: "gate", partOfSpeech: "noun" },
    ]);
    const run = candidates.find((c) => c.word === "run");
    expect(run?.level).toBe("A2");
    expect(run?.otherLevels).toEqual(["B1"]);
    expect(run?.flagged).toBe(true);
    expect(candidates.some((c) => c.word === "gate")).toBe(false);
  });
});

describe("stable ids", () => {
  it("uses w-<slug>-<pos> and never reuses reserved ids", () => {
    expect(slugifyHeadword("boarding pass")).toBe("boarding-pass");
    expect(stableWordId("gate", "noun")).toBe("w-gate-noun");
    expect(stableWordId("analyze", "verb")).toBe("w-analyze-verb");
    for (const id of RESERVED_WORD_IDS) {
      expect(stableWordId("gate", "noun")).not.toBe(id);
      expect(id).not.toMatch(/-noun$/); // reserved lack pos suffix
    }
  });
});

describe("IPA", () => {
  it("maps ARPAbet with stress marks", () => {
    expect(arpabetToIpa(["G", "EY1", "T"])).toContain("ɡ");
    expect(arpabetToIpa(["G", "EY1", "T"])).toContain("ˈ");
  });

  it("looks up multi-word tokens", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cmudict-"));
    const file = path.join(dir, "cmudict.dict");
    writeFileSync(
      file,
      ["boarding B AO1 R D IH0 NG", "pass P AE1 S", "gate G EY1 T"].join("\n"),
      "utf8",
    );
    const dict = loadCmudict(file);
    const one = lookupIpa(dict, "gate");
    expect(one.ipaSource).toBe("dictionary");
    expect(one.ipa).toMatch(/^\/.+\/$/);
    const multi = lookupIpa(dict, "boarding pass");
    expect(multi.ipaSource).toBe("dictionary");
    expect(multi.ipa).toContain(" ");
    const miss = lookupIpa(dict, "zzzznotaword");
    expect(miss.ipaSource).toBe("missing");
    expect(miss.ipa).toBeNull();
  });
});

describe("selection determinism", () => {
  it("two runs produce identical output", () => {
    const a = buildSkeleton({ generatedAt: "2026-10-02T00:00:00.000Z" });
    const b = buildSkeleton({ generatedAt: "2026-10-02T00:00:00.000Z" });
    expect(a.words).toEqual(b.words);
    expect(a.manifest.hashes.skeletonSha256).toBe(b.manifest.hashes.skeletonSha256);
    expect(a.sample).toEqual(b.sample);

    const body =
      a.words.map((w) => JSON.stringify(w)).join("\n") + "\n";
    expect(sha256(body)).toBe(a.manifest.hashes.skeletonSha256);
  });

  it("flagged-first then frequency then alpha", () => {
    const ranked = [
      {
        word: "zebra",
        partOfSpeech: "noun" as const,
        level: "A1" as const,
        flagged: false,
        notes: null,
        otherLevels: [],
        sourcePos: "noun",
        isMultiWord: false,
        frequencyRank: 10,
      },
      {
        word: "apple",
        partOfSpeech: "noun" as const,
        level: "A1" as const,
        flagged: true,
        notes: null,
        otherLevels: [],
        sourcePos: "noun",
        isMultiWord: false,
        frequencyRank: 999,
      },
      {
        word: "mango",
        partOfSpeech: "noun" as const,
        level: "A1" as const,
        flagged: false,
        notes: null,
        otherLevels: [],
        sourcePos: "noun",
        isMultiWord: false,
        frequencyRank: 5,
      },
    ];
    const sorted = [...ranked].sort(compareForSelection);
    expect(sorted.map((c) => c.word)).toEqual(["apple", "mango", "zebra"]);
  });

  it("seededSample is deterministic", () => {
    const items = Array.from({ length: 300 }, (_, i) => i);
    expect(seededSample(items, 150, 42)).toEqual(seededSample(items, 150, 42));
    expect(seededSample(items, 150, 42)).not.toEqual(
      seededSample(items, 150, 99),
    );
  });

  it("selectByQuotas respects quotas and unique ids", () => {
    const candidates: NormalisedCandidate[] = [];
    for (let i = 0; i < 20; i++) {
      candidates.push({
        word: `word${String(i).padStart(3, "0")}`,
        partOfSpeech: "noun",
        level: "A1",
        flagged: i < 5,
        notes: null,
        otherLevels: [],
        sourcePos: "noun",
        isMultiWord: false,
      });
    }
    const freq = new Map(candidates.map((c, i) => [c.word, i + 1]));
    const dict = new Map<string, string[]>();
    const selected = selectByQuotas(candidates, freq, dict, {
      A1: 10,
      A2: 0,
      B1: 0,
      B2: 0,
    });
    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((w) => w.id)).size).toBe(10);
    expect(selected.every((w) => w.level === "A1")).toBe(true);
    // First 5 flagged should all be included.
    expect(selected.filter((w) => w.flagged)).toHaveLength(5);
  });

  it("allocatePosQuotas mirrors pool mix (not noun-only)", () => {
    const pool = [
      ...Array.from({ length: 10 }, (_, i) => ({
        word: `n${i}`,
        partOfSpeech: "noun" as const,
        level: "A1" as const,
        flagged: true,
        notes: null,
        otherLevels: [],
        sourcePos: "noun",
        isMultiWord: false,
        frequencyRank: i + 1,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        word: `v${i}`,
        partOfSpeech: "verb" as const,
        level: "A1" as const,
        flagged: false,
        notes: null,
        otherLevels: [],
        sourcePos: "verb",
        isMultiWord: false,
        frequencyRank: i + 1,
      })),
    ];
    const alloc = allocatePosQuotas(pool, 10);
    expect(alloc.get("noun")).toBe(5);
    expect(alloc.get("verb")).toBe(5);
  });
});

describe("parseCefrjCsv", () => {
  it("parses header and quoted fields", () => {
    const text = [
      "headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold",
      'able,adjective,B1,"Work and Jobs",,',
    ].join("\n");
    const rows = parseCefrjCsv(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.headword).toBe("able");
    expect(rows[0]!.coreInventory1).toBe("Work and Jobs");
  });
});
