# Phase 3 — Topic classification and word sets

> **Status: done** (2026-10-02) — see `content-plan/phase-3-report.md`.

Read `content-plan/00-brief.md` and the approved earlier reports first.

## Goal
Every skeleton word has exactly one topic, and the words are grouped into named word sets.

## Do
1. **Classification** (`classify.ts`): send batches of words (with pos and level) to the model with the approved taxonomy (ids + scope + examples). Required output per word: `topicId` (must exist in `content/topics.json`), `confidence` (0–1), `reason` (≤ 10 words). Prompt in `prompts/classify.v1.md`. Rules in the prompt: choose the topic where a learner would most naturally meet this sense of the word; words that fit nothing go to "Daily life" with low confidence rather than a made-up topic.
2. **Checks**: every word classified; topic exists; per-topic counts printed per level; flag low confidence (< 0.7, adjustable) and topics that are too small (< 12 words at a level) or too big.
3. **Set building** (`build-sets.ts`, deterministic): for each (topic, level) order words by frequency rank (or alphabetical if none) and cut into sets of 20–30; merge leftovers smaller than 12 into the neighbouring set of the same topic and level; if a (topic, level) has fewer than 12 words in total, fold it into the same topic's adjacent level and report it. Assign `sortOrder`.
4. **Set naming**: the model proposes `title` (English, 2–4 words) and `titleVi` for each set from its words (prompt `prompts/set-title.v1.md`); titles must be unique within a level.
5. Output `work/classified.jsonl`, `work/sets.json`, and `work/topic-report.csv` (topic × level counts).

## Do NOT
- Write definitions, examples or meanings yet. Do not import into the database.

## Done when
- 100% of skeleton words have a valid topic; sets sizes are within 12–30; set ids are stable across re-runs (derived from topic + level + index).
- Report with the topic × level table, the list of low-confidence words (count + 30 examples), and 10 randomly chosen sets with their words and titles for my review. Then STOP.
