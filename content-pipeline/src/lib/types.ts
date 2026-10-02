import type { CefrLevel } from "../../config";

export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "preposition",
  "conjunction",
  "interjection",
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export type IpaSource = "dictionary" | "missing";

export type CefrRow = {
  headword: string;
  pos: string;
  cefr: string;
  coreInventory1: string;
  coreInventory2: string;
  threshold: string;
  line: number;
};

export type NormalisedCandidate = {
  word: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  flagged: boolean;
  notes: string | null;
  otherLevels: CefrLevel[];
  sourcePos: string;
  isMultiWord: boolean;
};

export type SkeletonWord = {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  ipa: string | null;
  ipaSource: IpaSource;
  frequencyRank: number | null;
  flagged: boolean;
  source: string;
  notes: string | null;
  otherLevels: CefrLevel[];
  isMultiWord: boolean;
};

export type RejectedRow = {
  line: number;
  headword: string;
  pos: string;
  reason: string;
};

export type SkeletonManifest = {
  generatedAt: string;
  source: string;
  quotas: Record<CefrLevel, number>;
  totals: {
    selected: number;
    byLevel: Record<CefrLevel, number>;
    byPos: Record<string, number>;
    flagged: number;
    ipaMissing: number;
    ipaDictionary: number;
    multiWord: number;
    withFrequencyRank: number;
  };
  rejected: {
    total: number;
    byReason: Record<string, number>;
    samples: RejectedRow[];
  };
  reservedExcluded: Array<{ word: string; partOfSpeech: string }>;
  quotaTolerancePct: number;
  withinQuotaTolerance: boolean;
  hashes: {
    skeletonSha256: string;
    cefrjSha256: string;
  };
};
