import { readFileSync } from "node:fs";

import type { IpaSource } from "./types";

/** ARPAbet phone → IPA (US-oriented). Stress digits stripped before lookup. */
const ARPABET_TO_IPA: Record<string, string> = {
  AA: "ɑ",
  AE: "æ",
  AH: "ʌ",
  AO: "ɔ",
  AW: "aʊ",
  AY: "aɪ",
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  EH: "ɛ",
  ER: "ɝ",
  EY: "eɪ",
  F: "f",
  G: "ɡ",
  HH: "h",
  IH: "ɪ",
  IY: "i",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  OW: "oʊ",
  OY: "ɔɪ",
  P: "p",
  R: "ɹ",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  UH: "ʊ",
  UW: "u",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",
};

export function arpabetToIpa(phones: string[]): string {
  // CMUdict marks stress on the vowel phone (e.g. AH0, EY1). Place ˈ/ˌ
  // immediately before that vowel's IPA symbol.
  let out = "";
  for (const raw of phones) {
    const stress = raw.match(/([012])$/)?.[1];
    const phone = raw.replace(/[012]$/, "");
    const ipa = ARPABET_TO_IPA[phone];
    if (!ipa) continue;
    if (stress === "1") out += "ˈ";
    else if (stress === "2") out += "ˌ";
    // Unstressed AH → ə (schwa) is more natural in IPA transcriptions.
    if (phone === "AH" && stress === "0") out += "ə";
    else if (phone === "ER" && stress === "0") out += "ɚ";
    else out += ipa;
  }
  return out;
}

export function loadCmudict(filePath: string): Map<string, string[]> {
  const text = readFileSync(filePath, "utf8");
  const map = new Map<string, string[]>();

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith(";;;")) continue;
    const hash = line.indexOf("#");
    const body = (hash >= 0 ? line.slice(0, hash) : line).trim();
    if (!body) continue;

    const parts = body.split(/\s+/);
    if (parts.length < 2) continue;

    let key = parts[0]!.toLowerCase();
    // Alternate pronunciations: word(2), word(3) → same lemma key; keep first.
    key = key.replace(/\(\d+\)$/, "");
    if (map.has(key)) continue;
    map.set(key, parts.slice(1));
  }

  return map;
}

function lookupToken(
  dict: Map<string, string[]>,
  token: string,
): string | null {
  const key = token
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/^\.+|\.+$/g, "");

  // Try exact, then without internal periods (a.m. → am).
  const candidates = [
    key,
    key.replace(/\./g, ""),
    key.replace(/-/g, ""),
  ];

  for (const c of candidates) {
    const phones = dict.get(c);
    if (phones) return arpabetToIpa(phones);
  }

  // Hyphenated token: try joining parts' IPA.
  if (key.includes("-")) {
    const pieces = key.split("-").filter(Boolean);
    const ipas: string[] = [];
    for (const p of pieces) {
      const phones = dict.get(p);
      if (!phones) return null;
      ipas.push(arpabetToIpa(phones));
    }
    return ipas.join("-");
  }

  return null;
}

export function lookupIpa(
  dict: Map<string, string[]>,
  word: string,
): { ipa: string | null; ipaSource: IpaSource } {
  const tokens = word.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { ipa: null, ipaSource: "missing" };
  }

  const parts: string[] = [];
  for (const token of tokens) {
    const ipa = lookupToken(dict, token);
    if (!ipa) return { ipa: null, ipaSource: "missing" };
    parts.push(ipa);
  }

  return {
    ipa: `/${parts.join(" ")}/`,
    ipaSource: "dictionary",
  };
}
