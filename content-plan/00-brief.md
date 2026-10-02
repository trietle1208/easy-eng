# Vocabulary Content Brief (shared context for every phase)

Read this file fully before starting any phase. Each phase file only describes what is specific to that phase. Also follow `CLAUDE.md` / `AGENTS.md` (GitNexus impact analysis before editing code, status updates after each phase).

## Goal
Build the system vocabulary catalog: about **3,000 words**, levels **A1–B2**, organised by **topic** into word sets, each word with Vietnamese meaning, simple English definition, examples, collocations and IPA. Quality matters more than speed: this is learning content and mistakes teach people the wrong thing.

## What exists today (verified in the repo)
- `src/db/schema/vocabulary.ts`: `word_sets` (id, title, title_vi, topic **text**, level, owner_id, status draft|published, created_at) and `words` (id, word_set_id NOT NULL, owner_id, word, ipa, part_of_speech, level, meaning_vi, definition_en, examples jsonb, collocations jsonb, notes, image_path, created_at). No sort order, no source/attribution, no review state, no uniqueness on system words.
- `content/schema.ts` → `vocabularyContentSchema`; `content/vocabulary.json` has 9 sets and 3 words (hand-written; **keep them, keep their ids**).
- `scripts/seed.ts` → `seedVocabulary`: one INSERT per row inside one transaction, **forces `status: "published"`**, overwrites rows on conflict (this also overwrites admin edits).
- `src/lib/admin/vocabulary.ts`: admin import/export of word sets (status keep/draft/published).
- `src/types/vocabulary.ts`: `WORD_SET_TOPICS` is a hard-coded list of **8 topics** (Daily life, Work, Travel, Food, Health, School, Technology, Feelings) used by `vocabulary-view.tsx` (filter chips), `src/lib/data/vocabulary.ts` (`getTopicCounts`) and the mappers. `PARTS_OF_SPEECH` has only noun, verb, adjective, adverb, phrase (also used by the Add Word form and `newWordSchema`).

## Source dataset
**CEFR-J Vocabulary Profile v1.5** (https://github.com/openlanguageprofiles/olp-en-cefrj, file `cefrj-vocabulary-profile-1.5.csv`).
- 7,799 rows, 6,867 unique headwords. Columns: `headword, pos, CEFR, CoreInventory 1, CoreInventory 2, Threshold`.
- Unique headwords per level: A1 1,066 · A2 1,352 · B1 2,354 · B2 2,691. 
- Rows flagged in at least one of CoreInventory 1/2 or Threshold (they also appear in other classic syllabus lists, a useful "core vocabulary" signal): A1 480 · A2 469 · B1 658 · B2 550 (of 1,164 / 1,411 / 2,446 / 2,778 rows).
- It has **no topic, no IPA, no Vietnamese**. Topic, meanings and examples come from the pipeline.
- Edge cases to handle: 167 variant spellings in one cell (e.g. `analyze/analyse`), 144 multi-word entries (e.g. `bank account`), 313 closed-class rows (determiner, pronoun, be/do/have-verb, modal auxiliary, infinitive-to, number, interjection…).
- **License**: free for research and commercial use if the dataset is cited properly; copyright Tono Laboratory, TUFS. Keep the original README/license text next to the data and show the citation on a Credits page.
- The Octanove C1/C2 file is CC BY-SA 4.0 and is **out of scope** (A1–B2 only). Do not import it.
- Any other source (frequency list, IPA dictionary) must have its license checked and recorded in the Phase 0 report before use.

## Decisions (defaults; Phase 0 must confirm or adjust them with me)
| Topic | Default |
|---|---|
| Levels | A1–B2 (my message said "A1–B12", read as A1–B2) |
| Size | ~3,000 words. Quotas: A1 800 · A2 900 · B1 800 · B2 500 |
| Selection | Within each level: flagged rows first (CoreInventory/Threshold), then by frequency from a license-checked source |
| Closed-class words | Exclude determiners, pronouns, be/do/have-verbs, modals, infinitive-to, numbers. Keep prepositions, conjunctions and interjections under a "Grammar words" topic |
| Variants | One headword per row; US spelling primary, the other spelling in `notes` |
| Granularity | One row per headword + part of speech (as in the dataset); 1–2 core meanings |
| Topics | One primary topic per word (the topic of its set). Taxonomy of ~18 topics proposed in Phase 0 |
| Sets | One set per (topic, level), 20–30 words each (merge sets smaller than 12) → about 100–150 sets |
| IPA | US pronunciation from a dictionary source, never invented by the model. If a word is missing, the model may propose it and the row is flagged for human review |
| Review | Everything starts as draft; 100% human check of flagged rows + stratified random sample (≥15%) |

## Word entry specification (what "good" means)
- `meaningVi`: Vietnamese with correct diacritics, 1–2 core meanings that match the part of speech; no English words, no explanation longer than one line.
- `definitionEn`: ≤ 15 words, does not contain the headword, uses only vocabulary at or below the word's level.
- `examples`: exactly 2, each with `en` and `vi`; 5–12 words (A1–A2) or ≤ 16 words (B1–B2); natural everyday sentences; contain the headword in any inflected form; no names of real people or brands; nothing offensive or sensitive; the Vietnamese translation is natural, not word-for-word.
- `collocations`: 2–4 genuinely common ones, or `null`.
- `notes`: only when useful (false friends for Vietnamese speakers, typical Vietnamese-learner mistakes, UK/US difference, irregular forms); otherwise `null`.
- `partOfSpeech`: normalised values defined in Phase 1.

## Folder layout
```
content-pipeline/
  README.md                 # how to run every step
  config.ts                 # paths, quotas, model name, batch size, budget cap
  data/raw/                 # CEFR-J CSV + README/license (committed)
  prompts/                  # versioned prompt files (committed)
  src/                      # scripts: skeleton, classify, enrich, validate, export-review, import-review, build
  work/                     # intermediate JSONL (git-ignored); manifest.json with counts and hashes IS committed
content/
  topics.json               # topic taxonomy (single source of truth)
  vocabulary/               # final files, split by level: a1.json … b2.json (same schema as vocabulary.json)
```
`content-pipeline/` must not be copied into the Docker image (`.dockerignore`).

## Rules for every script
- Resumable and idempotent: re-running skips finished items; results are cached by input hash + prompt version.
- `--limit N` and `--dry-run` on every step that calls the model; a configurable budget cap that stops the run.
- Model calls use structured JSON output validated with Zod; invalid output is retried once, then queued, never silently accepted.
- API key from `ANTHROPIC_API_KEY` in the environment only; never print or commit it; `.env.example` updated.
- Check the Anthropic API documentation for the current model names, structured-output and batch options before choosing; record the choice and the reason in the Phase 0 report.

## Verification (every phase)
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` pass when code under `src/` or `scripts/` changed.
- Pipeline steps print a summary (counts per level/topic, rejected, flagged) that goes into the report.
- Never run `db:seed --content` against production while working on this plan.

## Report format (end of every phase)
Write `content-plan/phase-N-report.md`:
1. What was done (files, counts, migrations)
2. Numbers (per level / per topic, rejected, flagged, cost if the model was used)
3. Decisions I should confirm
4. Risks / known issues
5. Plan for the next phase

Update the status table in `CLAUDE.md` and `AGENTS.md`. Then STOP and wait for approval. Never start the next phase on your own.
