# Phase 6 — Human review

> Status: **done / awaiting approval** — see `content-plan/phase-6-report.md` (2026-10-02).

Read `content-plan/00-brief.md` and the approved earlier reports first.

## Goal
A person checks what matters, the findings flow back into the data, and the quality is measured with numbers.

## Do
1. **Review sheet export** (`export-review.ts`): a CSV/XLSX for me with one row per word: id, word, pos, level, topic, set title, IPA, meaningVi, definitionEn, example 1 en/vi, example 2 en/vi, collocations, notes, flags (why it is in the sheet), and empty columns `decision` (ok | fix | drop), `fixed_meaningVi`, `fixed_definitionEn`, `fixed_example1_en/vi`, `fixed_example2_en/vi`, `comment`. Data validation (dropdown) on `decision`. Vietnamese must open correctly in Excel (UTF-8 with BOM).
2. **What goes into the sheet**: 100% of `needs_human` and warnings, 100% of low-confidence topics, and a **stratified random sample of at least 15%** of the remaining words (balanced across levels and topics). Also export the full catalog as a second read-only sheet so I can browse it.
3. **Review guide** (`content-pipeline/REVIEW-GUIDE.md`, in Vietnamese): checklist per field (diacritics, meaning fits the pos, example natural, level appropriate, no offensive or culturally odd content), examples of ok / fix / drop, how to fill the columns.
4. **Import back** (`import-review.ts`): validate the filled sheet (unknown ids, bad decisions, empty fixes), apply `fix` values, remove `drop` words (log them), set `reviewStatus = "human_reviewed"` for every row I decided on, and report conflicts instead of guessing.
5. **Quality gate**: compute the error rate in the random sample (words marked fix or drop ÷ sampled words), per level and overall.
   - ≤ 3%: accept; the unreviewed remainder stays `ai_checked` and can be published.
   - 3–8%: tell me, propose prompt/rule changes, and re-run Phases 4–5 for the affected level/topic before a second sample of 10%.
   - > 8%: stop and report the root causes.
6. If words were dropped, refill the quota from the next candidates in the skeleton ranking (Phase 2 script, deterministic) and run them through Phases 3–5 again.

## Do NOT
- Mark words `human_reviewed` that I did not decide on. Do not import into the database.

## Done when
- The import-back script round-trips on a test sheet; the quality gate numbers are in the report, per level.
- Report with the error rate, the most common error types I found, and the final word counts per level. Then STOP.
