# Phase 2 — Skeleton (script only, no model calls)

> **Status: done** (2026-10-02) — see `content-plan/phase-2-report.md`.

Read `content-plan/00-brief.md` and the approved Phase 0 and Phase 1 reports first.

## Goal
A deterministic, reviewable list of ~3,000 headwords with level, part of speech, IPA and source, built from the dataset.

## Do
1. `content-pipeline/src/skeleton.ts`: read the CEFR-J CSV and
   - normalise headwords (variants: US spelling primary + alternative stored for `notes`; trim; consistent casing; multi-word entries marked as phrases),
   - map `pos` to the approved part-of-speech values,
   - apply the closed-class policy,
   - merge duplicates (same headword + pos in several rows) keeping the lowest level and recording the others,
   - attach IPA from the approved source, with `ipaSource` = `dictionary` or `missing`,
   - attach `frequencyRank` when a source was approved,
   - select the words per level with the approved quotas: flagged rows first, then by frequency, ties broken alphabetically (deterministic),
   - assign stable ids (`w-<slug>-<pos>`), never reusing the ids of the 3 existing words.
2. Output `content-pipeline/work/skeleton.jsonl` and `work/manifest.json` (counts per level and pos, how many IPA missing, rejected rows with the reason).
3. Unit tests for normalisation, selection determinism (two runs give identical output) and the stable-id rules.
4. A short human-readable `work/skeleton-sample.csv` of 150 random rows for me to eyeball.

## Do NOT
- Call the model. Do not import anything into the database.

## Done when
- The totals match the approved quotas (±2%), no duplicate headword + pos, no word from the existing 3 words is duplicated.
- Report with the manifest numbers, the list of words without IPA (count + 20 examples) and the 150-row sample. Then STOP.
