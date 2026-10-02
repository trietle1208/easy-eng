# Phase 2 report — Skeleton

Date: 2026-10-02  
Status: **approved** (2026-10-02) — P2-1 POS-stratified selection confirmed

Repository: **easy-eng** (`/var/www/html/my/chill-english`). New pipeline code under `content-pipeline/` (no DB / app symbol edits requiring impact). Vitest include extended for pipeline unit tests.

---

## 1. What was done

### Sources (committed under `content-pipeline/data/raw/`)
- CEFR-J v1.5 CSV (already present)
- **CMUdict** `cmudict.dict` + LICENSE + `CITATION.md`
- **Google Books** frequency list `top_english_words_lower_20000.txt` (CC BY 3.0) + `CITATION.md` / README

### Pipeline
- `content-pipeline/config.ts` — paths, quotas A1 800 · A2 900 · B1 800 · B2 500, reserved words
- `content-pipeline/src/skeleton.ts` — CLI (`pnpm content:skeleton`)
- `content-pipeline/src/lib/*` — CSV parse, US-variant normalise, closed-class filter, merge, CMUdict IPA (ARPAbet→IPA), frequency ranks, POS-stratified selection, stable ids
- Unit tests: `content-pipeline/src/__tests__/skeleton.test.ts` (14 tests)
- `.gitignore`: ignore `work/*` except `work/manifest.json`

### Outputs
| File | Committed? |
|---|---|
| `work/skeleton.jsonl` | no (regenerate with `pnpm content:skeleton`) |
| `work/manifest.json` | **yes** |
| `work/skeleton-sample.csv` | no (150 seeded rows for eyeballing) |

**No model calls. No DB import.**

---

## 2. Numbers

| Metric | Value |
|---|---:|
| Selected | **3,000** |
| A1 / A2 / B1 / B2 | 800 / 900 / 800 / 500 (exact quotas) |
| Unique headword+pos | 3,000 |
| Flagged (CoreInventory/Threshold) | 1,618 |
| With frequency rank | 2,927 |
| IPA from dictionary | 2,993 |
| IPA missing | **7** |
| Multi-word | 62 |
| Rejected rows | 192 (closed_class 191 · reserved 1) |
| Reserved excluded | `gate`/`noun` only (`itinerary`, `boarding pass` not in CEFR-J) |
| Reserved id collisions | 0 |
| skeletonSha256 | `35d55e45d3bce89e66e81eb988c15b3dbca4cbcac9a5f573edd735283245a12c` |

### By part of speech

| POS | Count |
|---|---:|
| noun | 1,620 |
| adjective | 548 |
| verb | 490 |
| adverb | 223 |
| phrase | 52 |
| preposition | 43 |
| conjunction | 18 |
| interjection | 6 |

### Words without IPA (all 7)

| word | pos | level |
|---|---|---|
| `footballer` | noun | A2 |
| `headteacher` | noun | A2 |
| `motorway` | noun | A2 |
| `snowboarding` | noun | A2 |
| `stomachache` | noun | A2 |
| `toothache` | noun | A2 |
| `italicize` | verb | B2 |

(Phase 4/5 may propose IPA with `ipa_status=proposed` for human review.)

### Eyeball sample
`content-pipeline/work/skeleton-sample.csv` — 150 rows, seeded PRNG (`SAMPLE_SEED=42`), sorted by word for stable viewing. Re-run `pnpm content:skeleton` to regenerate.

---

## 3. Decisions to confirm

| # | Decision | Notes |
|---|---|---|
| **P2-1** | **POS-stratified selection within each level** | Naïve global “flagged first” yields ~76% nouns because CEFR-J CoreInventory/Threshold tags are almost only on nouns (~2,150 nouns vs 4 verbs). Implemented: allocate level quota across POS proportional to the level pool, then flagged→frequency→alpha *inside* each POS. |
| P2-2 | Multi-word open-class → `phrase`; prep/conj/interjection keep their POS | Grammar words stay classifiable in Phase 3 |
| P2-3 | US primary via scoring; UK spellings in `notes` (`Also: …`) | Includes -ize/-yze, -or/-our, enroll/enrol, yogurt/yoghurt, … |
| P2-4 | Ids `w-<slug>-<pos>`; never reuse `w-itinerary` / `w-boarding-pass` / `w-gate` | Existing hand-written rows kept for Phase 7 merge |
| P2-5 | `ipaSource`: `dictionary` \| `missing` only | No invented IPA in Phase 2 |

---

## 4. Risks / known issues

1. **Flag semantics** — CEFR-J “flags” are topic syllabus tags, not a cross-POS core list. P2-1 is required for a usable catalog; confirm or revert.
2. **UK compounds without CMUdict** — `motorway`, `headteacher`, `footballer`, etc. stay `ipaSource=missing` until Phase 4/5.
3. **`italicize` missing in CMUdict** — rare; flag for proposed IPA later.
4. **Sensitive heads** still in the skeleton (banned list is Phase 5) — e.g. graphic CEFR-J lemmas may appear until then.
5. **GitNexus** — pipeline is new; re-analyze when convenient (`node .gitnexus/run.cjs analyze`).

---

## 5. Verification

| Check | Result |
|---|---|
| `pnpm content:skeleton` | pass (3,000 exact quotas) |
| Skeleton unit tests (14) | pass |
| Duplicate headword+pos | 0 |
| Reserved id / headword reuse | 0 |
| Determinism (two runs, fixed `generatedAt`) | pass |

---

## 6. Plan for Phase 3

Per `content-plan/04-phase-3-topics-sets.md`: classify skeleton words into the 18-topic taxonomy, build word sets (topic × level, 20–30 words, merge &lt;12), Cursor-only batches — **no DB import yet**.

**Phase 2 closed.** Phase 3 started on explicit go-ahead.
