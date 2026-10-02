/**
 * Phase 6 — refill quota after human drops (Phases 2 ranking → 3–5 → human ok).
 *
 * Usage:
 *   pnpm content:refill -- --dry-run
 *   pnpm content:refill -- --apply
 */
import type { EnrichModelItem } from "./lib/enrich-schema";
import { readValidatedWords } from "./lib/human-review";
import {
  applyRefillEnrichments,
  neededSlotsFromDroppedLog,
  nextCandidatesForSlots,
  quotaSnapshot,
} from "./lib/refill";
import type { SkeletonWord } from "./lib/types";

/** Enrichment copy for refill headwords (Cursor Phase 6). */
const BY_WORD: Record<string, Omit<EnrichModelItem, "id">> = {
  return: {
    meaningVi: "sự trở lại; lợi nhuận",
    definitionEn: "the act of coming back, or money you gain",
    examples: [
      {
        en: "We look forward to your return next month.",
        vi: "Chúng tôi mong bạn trở lại vào tháng sau.",
      },
      {
        en: "The shop had a good return on sales this year.",
        vi: "Cửa hàng có lợi nhuận bán hàng tốt năm nay.",
      },
    ],
    collocations: ["return home", "on your return", "a good return"],
    notes: "Noun sense here; the verb return is a separate entry.",
  },
  format: {
    meaningVi: "định dạng, sắp xếp theo mẫu",
    definitionEn: "to arrange text or data in a set style",
    examples: [
      {
        en: "Please format the report before you send it.",
        vi: "Hãy định dạng báo cáo trước khi gửi.",
      },
      {
        en: "I need to format this table for the meeting.",
        vi: "Mình cần định dạng bảng này cho cuộc họp.",
      },
    ],
    collocations: ["format a document", "format text", "format a disk"],
    notes: null,
  },
  boot: {
    meaningVi: "giày ống, ủng",
    definitionEn: "a strong shoe that covers the foot and ankle",
    examples: [
      {
        en: "She bought new boots for the winter trip.",
        vi: "Cô ấy mua ủng mới cho chuyến đi mùa đông.",
      },
      {
        en: "These boots are too tight for long walks.",
        vi: "Đôi ủng này bó quá nếu đi bộ lâu.",
      },
    ],
    collocations: ["winter boots", "a pair of boots", "put on boots"],
    notes: null,
  },
  ferry: {
    meaningVi: "phà (tàu chở người/xe qua sông, biển)",
    definitionEn: "a boat that carries people or cars across water",
    examples: [
      {
        en: "We took the ferry to the island this morning.",
        vi: "Sáng nay chúng tôi đi phà ra đảo.",
      },
      {
        en: "The ferry leaves every hour from this port.",
        vi: "Phà khởi hành mỗi giờ từ cảng này.",
      },
    ],
    collocations: ["take the ferry", "ferry crossing", "catch the ferry"],
    notes: null,
  },
  fountain: {
    meaningVi: "đài phun nước",
    definitionEn: "a structure that sends water into the air",
    examples: [
      {
        en: "Children played near the fountain in the park.",
        vi: "Trẻ em chơi gần đài phun nước trong công viên.",
      },
      {
        en: "The old fountain in the square still works.",
        vi: "Đài phun nước cũ ở quảng trường vẫn còn chạy.",
      },
    ],
    collocations: ["water fountain", "park fountain", "drinking fountain"],
    notes: null,
  },
};

function parseArgs(argv: string[]) {
  let dryRun = false;
  let apply = false;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--apply") apply = true;
  }
  return { dryRun, apply };
}

function buildEnrichItems(picked: SkeletonWord[]): EnrichModelItem[] {
  return picked.map((p) => {
    const body = BY_WORD[p.word.toLowerCase()];
    if (!body) {
      throw new Error(
        `No enrichment for refill word "${p.word}" (${p.id}). Add to BY_WORD.`,
      );
    }
    return { id: p.id, ...body };
  });
}

function main() {
  const { dryRun, apply } = parseArgs(process.argv.slice(2));
  const existing = readValidatedWords();
  const used = new Set(existing.map((w) => w.id));
  const slots = neededSlotsFromDroppedLog();
  if (!slots.length) {
    console.log("No dropped words to refill.");
    return;
  }
  console.log("Slots:", slots);
  console.log("Before:", quotaSnapshot(existing));

  const picked = nextCandidatesForSlots(slots, used);
  for (const p of picked) {
    console.log(
      `  → ${p.id}  ${p.level} ${p.partOfSpeech}  freq=${p.frequencyRank}  flagged=${p.flagged}`,
    );
  }

  if (!apply) {
    console.log(dryRun ? "(dry-run)" : "Pass --apply to write refill words.");
    return;
  }

  const items = buildEnrichItems(picked);
  const added = applyRefillEnrichments(picked, items);
  const after = readValidatedWords();
  console.log("Added:", added.map((w) => `${w.id}[${w.topicId}]`).join(", "));
  console.log("After:", quotaSnapshot(after));
  const issues = added.flatMap((w) =>
    w.validationIssues.map((i) => `${w.id}:${i.code}:${i.severity}`),
  );
  if (issues.length) console.log("Validation issues:", issues.join("; "));
}

main();
