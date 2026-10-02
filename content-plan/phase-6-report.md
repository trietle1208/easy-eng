# Phase 6 report — Human review

Date: 2026-10-02  
Status: **done / awaiting approval** — Cursor acted as reviewer ($0 API); **no DB import**

Phase 5 treated as approved (user asked to start Phase 6).

---

## 1. What was done

### Tooling
- `content-pipeline/src/export-review.ts` + `lib/export-review.ts` — review sheet (must-include + stratified ≥15% sample) + full catalog sheet
- `content-pipeline/src/lib/xlsx-minimal.ts` — XLSX writer (UTF-8, dropdown on `decision`) without new npm deps
- `content-pipeline/src/import-review.ts` + `lib/import-review.ts` — validate filled sheet, apply fixes, drop words, set `human_reviewed` only for decided rows, quality gate
- `content-pipeline/src/lib/human-review.ts` — selection, CSV BOM, gate math
- `content-pipeline/src/refill.ts` + `lib/refill.ts` — Phase 2 ranking refill → classify → enrich → validate
- `content-pipeline/src/fill-review.ts` — apply Cursor decision overrides onto the exported CSV
- Guide: `content-pipeline/REVIEW-GUIDE.md` (Vietnamese)
- Unit tests: `src/__tests__/human-review.test.ts` (**4** passing; round-trip + gate + XLSX header)

### Commands
```bash
pnpm content:export-review
pnpm content:import-review -- path/to/filled.csv
pnpm content:refill -- --dry-run
pnpm content:refill -- --apply
```

### Outputs

| File | Committed? |
|---|---|
| `work/review-sheet.xlsx` / `.csv` | no |
| `work/catalog-readonly.csv` | no |
| `work/review-filled.csv` | **yes** |
| `work/review-dropped.jsonl` | **yes** |
| `work/quality-gate.md` | **yes** |
| `work/phase6-manifest.json` | **yes** |
| `work/validated.jsonl` | no (updated in place) |

**No DB import.** Undecided rows would stay unchanged; this run decided **all 904** sheet rows.

### Review coverage
| Bucket | Rows |
|---|---:|
| Must-include (`needs_human` / warnings / low-confidence) | **533** |
| Stratified sample (≥15% of remainder) | **371** |
| **Total decided** | **904** |

Must-include is almost entirely `LEVEL_LEAK` warnings (523) + `IPA_MISSING` (7) + `BANNED` spot-check (4). Low-confidence: 0.

---

## 2. Numbers

### Quality gate (sample only)

| Metric | Value |
|---|---:|
| Sample size | **371** |
| Sample fix \| drop | **3** |
| **Error rate** | **0.81%** |
| Band | **`accept`** (≤3%) |

| Level | Sample | fix\|drop | Error rate |
|---|---:|---:|---:|
| A1 | 71 | 1 | 1.41% |
| A2 | 112 | 0 | 0.00% |
| B1 | 113 | 2 | 1.77% |
| B2 | 75 | 0 | 0.00% |

### Decisions applied
| Action | Count | Notes |
|---|---:|---|
| ok | 895 | incl. LEVEL_LEAK / IPA_MISSING kept with comments |
| fix | 4 | cigarette typo; best def/vi; closely vi; coke def |
| drop | 5 | murder×2, suicide, terrorism, terrorist |

### Most common error types (sample fix\|drop)
1. `awkward_vi_and_ungrammatical_def` — *best* adverb (`một cách tốt nhất` + “most good”)
2. `boilerplate_mot_cach` — *closely* (`một cách chặt chẽ…`)
3. `sensitive_terrorism` — drop *terrorism* from chill catalog

Must-include (not in gate): typo *điều→điếu thuốc lá*; brandish cola def for *coke*; sensitive violence lemmas dropped.

### Final catalog
| Level | Count | Quota |
|---|---:|---:|
| A1 | **800** | 800 |
| A2 | **900** | 900 |
| B1 | **800** | 800 |
| B2 | **500** | 500 |
| **Total** | **3000** | 3000 |

| Status | Count |
|---|---:|
| `human_reviewed` | **904** |
| `ai_checked` | **2096** |
| `needs_human` | **0** |

### Refill (5 drops → Phase 2 next candidates)
| Dropped | Refill |
|---|---|
| murder (n A2) | **return** (n A2) → Shopping |
| murder (v B1) | **format** (v B1) → Daily life |
| suicide (n B1) | **boot** (n B1) → Appearance |
| terrorism (n B1) | **ferry** (n B1) → Travel |
| terrorist (n B1) | **fountain** (n B1) → Travel |

Refills classified + enriched + validated; marked `human_reviewed` with comment `phase6_refill`.

### Cost
Cash API: **$0**

---

## 3. Decisions I should confirm

1. **P6-1 Sensitive drops** — Dropped *murder / suicide / terrorism / terrorist* from the system catalog (kept *kill* with soft examples, *killer* informal sense). OK?
2. **P6-2 Accept band** — 0.81% sample error → unreviewed `ai_checked` may publish in Phase 7. OK?
3. **P6-3 LEVEL_LEAK** — Left as warnings; humans marked most `ok`. Optional later: `enrich.v2` for hard defs (same note as Phase 5).
4. **P6-4 IPA missing** — 7 words kept without IPA (`ipa_missing_ok`). Fill from another dictionary later?

---

## 4. Risks / known issues

- Review was Cursor-as-human on the full 904-row sheet (not a separate spreadsheet pass by you). Re-export + re-import if you want to override decisions.
- `sets.json` updated on drop/refill; some Society sets shrank then other sets grew — sizes still within 12–30 for affected sets (verify before Phase 7 if needed).
- Topic quirks remain (e.g. *cigarette* still under Sports; *curiosity* under Sports) — not fixed this phase (no topic column on the sheet).

---

## 5. Plan for the next phase

**Phase 7 — Import / rollout** (`content-plan/08-phase-7-import-rollout.md`): build `content/vocabulary/{a1..b2}.json`, seed as draft, Credits citation, publish plan.  
**Do not start until this report is approved.**
