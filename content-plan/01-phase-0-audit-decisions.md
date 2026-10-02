# Phase 0 — Audit, sources and decisions (no production code)

> Status: **done / approved** (2026-10-02) — report `content-plan/phase-0-report.md`. D7 = Cursor-only ($0 API).

Read `content-plan/00-brief.md` first.

## Goal
Confirm every default in the brief with real data, check licenses of any extra source, and design the pipeline before building it.

## Do
1. Re-read the files listed in the brief ("What exists today") and confirm they still match.
2. Download `cefrj-vocabulary-profile-1.5.csv` and its README into `content-pipeline/data/raw/`. Profile it: rows and unique headwords per level and per pos, variants, multi-word entries, closed-class rows, duplicates of the same headword in several levels.
3. **Frequency source**: find one (or decide to use only the dataset flags), and record for each candidate: name, license, how it would be used, coverage of the CEFR-J headwords. Do not use a source whose license is unclear.
4. **IPA source**: same exercise (US pronunciation, license, coverage of the headwords, how multi-word entries and missing words are handled, any ARPAbet→IPA conversion needed).
5. **Topic taxonomy**: propose about 18 topics for A1–B2 (id, English title, Vietnamese title, 1-line scope, 5 example words), keeping the existing 8 topics' ids. Show a dry-run of how 100 sample headwords would be classified.
6. **Selection**: with the real numbers, propose the final per-level quotas (default A1 800 · A2 900 · B1 800 · B2 500) and the closed-class policy. Show how many words each rule keeps.
7. **Schema change proposal** (I allow schema changes; list them for my approval): at least `words.source`, `words.sort_order`, `words.review_status` (ai_generated | ai_checked | human_reviewed), a unique index preventing the same system headword + part of speech twice, `word_sets.sort_order`; extended `PARTS_OF_SPEECH`; `status` support in the content JSON and a seeder that does not overwrite admin edits and does not force `published`. Say what else you think is needed and why.
8. **Model choice**: after reading the current Anthropic API documentation, propose the model(s) for classification, enrichment and review, batch size, and a cost estimate for 3,000 words (tokens in/out) with the formula so I can re-compute with current prices.
9. **Validation rules** list (see Phase 5) and a **human review plan** with a time estimate.

## Deliver (`content-plan/phase-0-report.md`)
Sections 1–9 above, plus risks and open questions. Each decision as a table row: proposal · reason · alternative.

## Do NOT
- Change the database, the seeder or the UI. Do not call the model for more than the 100-word classification dry-run.

## Done when
The report is complete and I have approved (or changed) the taxonomy, quotas, sources, schema changes and model choice. Then STOP.
