# Phase 4 — Enrichment with the model

> Status: **done / awaiting approval** (2026-10-02) — report `content-plan/phase-4-report.md`. 3000/3000 enriched.

Read `content-plan/00-brief.md` and the approved earlier reports first. The "Word entry specification" in the brief is the contract.

## Goal
Every word has `meaningVi`, `definitionEn`, 2 examples (en + vi), collocations and, where useful, a note.

## Do
1. `enrich.ts` + `prompts/enrich.v1.md`. Input per word: headword, pos, level, topic, IPA, the alternative spelling if any. Batches of ~25 words (as approved). Output validated with Zod, one object per input id, no missing and no extra ids.
2. The prompt must state the full specification from the brief and the audience: Vietnamese adult learners. Include 3 hand-checked example entries per level as few-shot examples (I will supply or approve them; start with drafts and mark them for my approval).
3. **Pilot first**: run 100 words (25 per level, mixed topics, include some multi-word, some irregular verbs, some with several meanings), write them to `work/pilot.csv`, and STOP for my review before the full run. Adjust the prompt until the pilot passes my review (record each prompt version and what changed).
4. **Full run** after approval, resumable, cached by input hash + prompt version, with progress output and the budget cap. Failures are retried once, then written to `work/enrich-failed.jsonl`.
5. Set `reviewStatus = "ai_generated"` and `source` = `cefrj-1.5+ai` on every produced word.
6. Print a cost/usage summary (requests, input/output tokens) and compare with the Phase 0 estimate.

## Do NOT
- Skip the pilot. Do not import into the database. Do not edit the skeleton or the sets.

## Done when
- All words enriched or listed as failed; output passes the Zod schema.
- Report with usage numbers, the pilot findings (what the model got wrong and how the prompt changed), and 30 random enriched entries for me to read. Then STOP.
