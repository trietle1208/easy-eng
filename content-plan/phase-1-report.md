# Phase 1 report — Schema and platform

Date: 2026-10-02  
Status: **done** (awaiting approval to start Phase 2)

Repository: **easy-eng** (`/var/www/html/my/chill-english`). Pre-edit impact: `words` schema **HIGH** (additive columns + backfill only; no column drops). `seedVocabulary` LOW. `WORD_SET_TOPICS` / `PARTS_OF_SPEECH` UNKNOWN → confirmed via text search (UI, forms, data layer).

---

## 1. What was done

### Migration
- `drizzle/0005_shiny_ghost_rider.sql`
- `word_sets.sort_order`
- `words.source` (default `manual`), `sort_order`, `review_status` (default `human_reviewed`), `ipa_status`
- Backfill `sort_order` for existing sets/words
- Indexes: `word_sets_sort_order_idx`, `words_set_sort_order_idx`, unique `words_system_word_pos_uidx` on `lower(word), part_of_speech` WHERE `owner_id IS NULL`
- Checks for `review_status` / `ipa_status`

### Taxonomy SSOT
- `content/topics.json` — 18 topics (keeps original 8 ids)
- `topicsContentSchema` in `content/schema.ts`
- `WORD_SET_TOPICS` / `TOPIC_ENTRIES` derived in `src/types/vocabulary.ts`

### Parts of speech
- Extended with `preposition`, `conjunction`, `interjection`
- Wired through `newWordSchema`, Add Word form (`PARTS_OF_SPEECH`), flashcard (string display), WOTD / reading popover mappers

### Content schema
- Optional on sets: `status`, `sortOrder`
- Optional on words: `source`, `sortOrder`, `reviewStatus`, `ipaStatus`
- Old `vocabulary.json` still validates

### Seeder
- Chunked inserts (~500)
- Respects set `status` from JSON (default `published`)
- `--only-new` → insert missing, never update
- `NODE_ENV=production` + `--content` refused unless `--force`
- Skips overwrite when existing `source = 'admin'`

### Admin
- Import/export carry new fields
- Editor shows `sortOrder`, read-only review/source summary, words JSON includes `source` / `reviewStatus` / `ipaStatus`
- List filters: status + topic (`VocabListFilters`)

### Learner UI (scale)
- Topic sidebar: scroll + “More topics”
- Set list: load more (24 / page)
- Search matches set titles **and** headwords (`foldSearch`, including `đ` → `d`)
- `foldSearch` moved to `src/lib/fold-search.ts` (client-safe)

### Infra
- `.dockerignore` already excludes `content-pipeline` / `content-plan` (Phase 0)
- `.env.example`: optional `ANTHROPIC_API_KEY` note

**Not done (by design):** no 3,000-word catalog; kept 9 sets / 3 words.

---

## 2. Numbers

| Item | Count |
|---|---:|
| Topics in SSOT | 18 |
| Existing seed sets / words | 9 / 3 |
| New POS values | +3 (prep, conj, interj) |
| Migration | `0005` |

---

## 3. Decisions to confirm

| # | Decision | Notes |
|---|---|---|
| P1-1 | Unique system index on `lower(word)+pos` | User-owned words can still duplicate a system headword |
| P1-2 | Admin saves set `source` default `admin` | Distinguishes CMS from seed/`manual` |
| P1-3 | `foldSearch` maps `đ`→`d` | Slightly broader than pre-Phase-1 behaviour |
| P1-4 | Production seed guard | Verified: blocked without `--force` |

---

## 4. Risks / known issues

1. Re-seeding in dev still **updates** non-admin rows (idempotent when JSON unchanged); use `--only-new` for insert-only.
2. Topics not in `topics.json` still store as free text but won’t appear in filter chips.
3. GitNexus index is stale relative to these edits — refresh after approve if desired (`node .gitnexus/run.cjs analyze`).
4. Large vitest suite still re-seeds per file (pre-existing cost).

---

## 5. Verification

| Check | Result |
|---|---|
| `pnpm db:migrate` | pass |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (no errors) |
| `pnpm test` (full earlier; phase-1 files after fix) | pass |
| `pnpm build` | pass |
| Production seed guard | pass (refuses without `--force`) |

---

## 6. Plan for Phase 2

Per `content-plan/03-phase-2-skeleton.md`: pipeline skeleton under `content-pipeline/` (config, prompts stubs, resumable step runners) for Cursor-only generate — **no API key required**.

**STOP — waiting for approval before Phase 2.**
