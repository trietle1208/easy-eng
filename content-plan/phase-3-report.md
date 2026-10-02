# Phase 3 report — Topic classification and word sets

Date: 2026-10-02  
Status: **approved** (2026-10-02) — P3-1 Cursor-only local classifier confirmed

Repository: **easy-eng**. Cursor-only ($0 API) — no Anthropic calls, no DB import.

---

## 1. What was done

### Prompts
- `content-pipeline/prompts/classify.v1.md`
- `content-pipeline/prompts/set-title.v1.md`

### Pipeline
- `src/classify.ts` / `lib/classify.ts` — resumable Cursor classifier
- `src/build-sets.ts` / `lib/build-sets.ts` — deterministic sets (12–30)
- CEFR-J tag → topic map + multi-tag scoring (`lib/cefrj-tags.ts`)
- Lexicon + pattern rules + `data/classify-corrections.jsonl` (345 overrides)
- Unit tests: `src/__tests__/classify-sets.test.ts` (8)

### Commands
```bash
pnpm content:classify
pnpm content:build-sets
```

### Outputs
| File | Committed? |
|---|---|
| `work/classified.jsonl` | no (regenerate) |
| `work/sets.json` | no (regenerate) |
| `work/topic-report.csv` | **yes** |
| `work/phase3-manifest.json` | **yes** |
| `data/classify-corrections.jsonl` | **yes** |

**No definitions / examples. No DB import.**

---

## 2. Numbers

| Metric | Value |
|---|---:|
| Classified | **3,000** (100%) |
| Low confidence (&lt; 0.7) | **0** |
| Sets | **131** |
| Set size range | **12–30** |
| Folds (small topic×level → densest level) | 11 |
| Stable set ids on re-run | yes |

### Classification methods

| Method | Count |
|---|---:|
| cefrj_tag | 1,605 |
| lexicon | 424 |
| fallback (Daily life) | 413 |
| correction | 345 |
| pattern | 145 |
| pos_rule (Grammar words) | 67 |
| heuristic | 1 |

### Topic × level

| Topic | A1 | A2 | B1 | B2 | Total |
|---|---:|---:|---:|---:|---:|
| Daily life | 165 | 249 | 218 | 137 | 769 |
| School | 34 | 56 | 83 | 48 | 221 |
| Home | 86 | 57 | 45 | 30 | 218 |
| People | 65 | 61 | 37 | 40 | 203 |
| Society | 19 | 46 | 76 | 57 | 198 |
| Work | 28 | 38 | 75 | 51 | 192 |
| Shopping | 56 | 69 | 32 | 19 | 176 |
| Travel | 33 | 57 | 55 | 16 | 161 |
| Sports | 71 | 53 | 17 | 7 | 148 |
| Food | 60 | 45 | 18 | 10 | 133 |
| Health | 32 | 25 | 36 | 23 | 116 |
| Media | 13 | 28 | 32 | 18 | 91 |
| Appearance | 46 | 25 | 11 | 5 | 87 |
| Grammar words | 35 | 25 | 15 | 4 | 79 |
| Feelings | 25 | 22 | 12 | 13 | 72 |
| Communication | 17 | 23 | 6 | 8 | 54 |
| Nature | 14 | 12 | 19 | 8 | 53 |
| Technology | 1 | 9 | 13 | 6 | 29 |

### Low-confidence words
None under 0.7 after corrections (`aware`, `darling` fixed). Flagged queue for Phase 6 can still use stratified sampling.

### 10 sample sets (seed 11)

1. **ws-grammar-words-a1-01** — Grammar words essentials / Từ ngữ pháp cơ bản · A1 · 20  
   of, and, owing to, to, in, that, for, as, with, on, by, or, from, at, but, if, when, so, than…
2. **ws-people-a2-01** — People essentials / Con người cơ bản · A2 · 21  
   first name, human, interest, face, single, association, member, staff, pen friend, police…
3. **ws-travel-a2-02** — Crowd & Remote / Du lịch phần 2 · A2 · 28  
   crowd, remote, rent, bush, repair, fee, apartment, tour, explore, banking, highway…
4. **ws-daily-life-b1-01** — Daily life Face-to-face / Đời sống cơ bản · B1 · 25  
   face-to-face, more, full-time, part-time, even, through, own, general, place…
5. **ws-food-b1-01** — Bill & Fish / Ẩm thực cơ bản · B1 · 18  
   bill, fish, agriculture, alcohol, taste, crop, folk, filling, nutrition, bacon…
6. **ws-sports-b1-01** — Sports essentials / Thể thao cơ bản · B1 · 17  
   social networking, board, rest, active, race, cycle, channel, match, recording, hunt…
7. **ws-technology-b1-01** — Technology Out-of-date / Công nghệ cơ bản · B1 · 29  
   out-of-date, up-to-date, data, hand-held, program, account, file, software, screen…
8. **ws-travel-b1-02** — Delay & Vehicle / Du lịch phần 2 · B1 · 27  
   delay, vehicle, arrival, customs, railway, platform, departure, destination…
9. **ws-daily-life-b2-04** — Daily life key words / Đời sống phần 4 · B2 · 27  
   significantly, specifically, prime, yield, concrete, essentially, improved…
10. **ws-work-b2-02** — Employer & Commander / Công việc phần 2 · B2 · 25  
    employer, commander, inflation, programming, retirement, crew, salary, colleague…

---

## 3. Decisions to confirm

| # | Decision | Notes |
|---|---|---|
| **P3-1** | Cursor-only classifier (tags + lexicon + patterns + corrections), not live LLM batches | **Confirmed** — matches D7; prompts kept for later API path |
| P3-2 | Multi-tag CEFR-J: highest `TAG_SCORE` wins | Avoids “Things in the town” beating Work/Relations |
| P3-3 | Fold tiny (topic, level) into **densest** same-topic level | Avoids A1↔A2 oscillation |
| P3-4 | Set ids `ws-<topic-slug>-<level>-<nn>` | Stable across re-runs |
| P3-5 | Titles from top frequent words / topic labels (set-title.v1 locally) | Unique within level |

---

## 4. Risks / known issues

1. **CEFR-J tag noise** — syllabus tags are coarse (`Free time` → Sports can pull *comedy* / *orchestra*; some Home/Tech bleed). Corrections cover the worst; Phase 6 sample review should catch more.
2. **Daily life is large** (769) — expected for general lemmas; many sets, OK for catalog.
3. **Technology is small** (29) — folded into B1-heavy sets; fine for v1.
4. **Set titles are utilitarian** — OK for draft; can rename in admin later.
5. **Homographs** — one topic per headword+pos; secondary senses ignored until enrichment notes.

---

## 5. Verification

| Check | Result |
|---|---|
| Every skeleton word classified | pass |
| Topic ∈ `content/topics.json` | pass |
| Set sizes 12–30 | pass (12–30) |
| Stable set ids | pass |
| Pipeline unit tests | pass (8 + prior 14) |

---

## 6. Plan for Phase 4

Per `content-plan/05-phase-4-enrichment.md`: Cursor batches for `meaningVi`, `definitionEn`, examples, collocations — prompts + resumable JSONL — **still no DB import**.

**Phase 3 closed.** Start Phase 4 only on explicit go-ahead.
