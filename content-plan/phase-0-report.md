# Phase 0 report — Audit, sources and decisions

Date: 2026-10-02  
Status: **approved** (2026-10-02) — personal project, minimise cash cost; D7 = Cursor-only ($0 API)  
No DB / seeder / UI changes in this phase.

---

## 1. Repo audit (brief “What exists today”)

| Claim in brief | Verified | Notes |
|---|---|---|
| `word_sets`: id, title, title_vi, topic text, level, owner_id, status draft\|published, created_at | **yes** | No `sort_order` |
| `words`: id, word_set_id NOT NULL, owner_id, word, ipa, pos, level, meaning_vi, definition_en, examples/collocations jsonb, notes, image_path, created_at | **yes** | No `source`, `sort_order`, `review_status`; no system uniqueness |
| `content/vocabulary.json`: 9 sets, 3 words; keep ids | **yes** | Sets include `at-the-airport`, `morning-routines`, …; words keep existing ids |
| `seedVocabulary` forces `published`, overwrites on conflict | **yes** | `scripts/seed.ts` ~447–514 |
| Admin import/export | **yes** | `src/lib/admin/vocabulary.ts` |
| `WORD_SET_TOPICS` = 8 hard-coded titles | **yes** | Used by filter chips, `getTopicCounts`, mappers |
| `PARTS_OF_SPEECH` = noun, verb, adjective, adverb, phrase | **yes** | Also Add Word form / `newWordSchema` |
| Content schema has no set `status` | **yes** | `vocabularyContentSchema` sets: id/title/titleVi/topic/level only |

**Conclusion:** Brief still matches the repo. Pipeline + schema work in later phases is justified.

---

## 2. CEFR-J profile

**Files committed under** `content-pipeline/data/raw/`:
- `cefrj-vocabulary-profile-1.5.csv` (7,799 data rows)
- `README.md` (upstream terms)
- `CITATION.md` (excerpt + citation text)
- `profile-summary.json`, `sample-100.json`, `sample-100-classified.json|.md`

| Metric | Value |
|---|---|
| Rows | 7,799 |
| Unique headwords (case-sensitive) | 6,867 |
| Unique headwords (lowercased) | 6,863 |
| Variant spellings (`/`) | 167 |
| Multi-word (space) | 144 |
| Closed-class rows (excl. prep/conj; incl. interjection in closed count) | 200 excluded-policy POS + 9 interjections kept |
| Headwords appearing in >1 CEFR level | 573 |
| Headwords with >1 POS | 850 |

### Rows / unique headwords / flagged per level

| Level | Rows | Unique HW | Flagged rows (CoreInventory 1/2 or Threshold) |
|---|---:|---:|---:|
| A1 | 1,164 | 1,064 | 480 |
| A2 | 1,411 | 1,352 | 469 |
| B1 | 2,446 | 2,354 | 658 |
| B2 | 2,778 | 2,691 | 550 |

### POS distribution (all rows)

noun 4091 · adjective 1494 · verb 1349 · adverb 552 · pronoun 83 · preposition 76 · determiner 46 · conjunction 37 · number 30 · modal auxiliary 13 · be-verb 10 · interjection 9 · do-verb 5 · have-verb 3 · infinitive-to 1

### License (CEFR-J)

Free for research and commercial use with proper citation. Copyright: Tono Laboratory, TUFS. Upstream has no separate `LICENSE` file; terms live in `README.md` (copied to `CITATION.md`). **Octanove C1/C2 stays out of scope** (CC BY-SA 4.0).

---

## 3. Frequency source

| Candidate | License | How used | Coverage of selected ~3k | Verdict |
|---|---|---|---|---|
| **CEFR-J flags only** | Cite CEFR-J | Prefer flagged rows | Flagged alone: A1 480, A2 469, B1 658, B2 550 — not enough for A1/A2/B1 quotas | Necessary first pass, insufficient alone |
| **Google Books lists** (`david47k/top-english-wordlists`, English 1950–2012) | **CC BY 3.0** | Rank unflagged fill; store only rank at selection time, not redistributing the list as product content | Top 20k covers **90.7%** of a 3,000-word selection (flagged-first + frequency) | **Recommended fill source** |
| `wordfreq` | Data **CC BY-SA 4.0** | Zipf lookup | Excellent | Avoid embedding/redistributing derived ranks in-repo (ShareAlike risk) |
| SUBTLEX-US | Often labeled **CC BY-SA**; paper “freely available” | Spoken-frequency ranking | High for common words | Avoid as committed dependency (SA + unclear product interaction) |

**Proposal:** Selection order = (1) flagged CoreInventory/Threshold within level, (2) Google Books frequency rank for remaining slots, (3) leftover CEFR-J order. Record attribution on Credits. Do **not** vendor `wordfreq`/SUBTLEX into the repo.

| | Proposal | Reason | Alternative |
|---|---|---|---|
| Frequency | Google Books top list (CC BY 3.0) for unflagged fill | Clear license; 90%+ coverage of selection | Flags-only and lower A1/A2 quotas |

---

## 4. IPA source

| Candidate | License | Notes | Coverage of selected ~3k | Verdict |
|---|---|---|---|---|
| **CMUdict** (cmusphinx / 0.7b) | Unrestricted research/commercial use; acknowledge CMU | US/North American; **ARPAbet → IPA** via our own mapping table (avoid GPL `cmudict-tools` as a runtime dep) | **98.8%** full lookup (multi-word: all tokens present) | **Recommended** |
| Model-invented IPA | N/A | Brief forbids inventing as truth | — | Only for misses, flagged `ipa_status=proposed` |
| Commercial dict APIs | Varies | Cost + ToS | — | Reject for v1 |

**Missing / multi-word handling**
- Single word miss → model may propose IPA; set `ipa_status = proposed` → human review.
- Multi-word → lookup each token, join with spaces in IPA; if any token missing → `proposed` or `missing`.
- Homographs with stress variants (e.g. PROgress/proGRESS) → prefer POS-appropriate stress when mapping is ambiguous; else flag.

| | Proposal | Reason | Alternative |
|---|---|---|---|
| IPA | CMUdict + local ARPAbet→IPA map | Free, US, high coverage | Paid dict API |

---

## 5. Topic taxonomy (~18)

Keep the **existing 8 topic string ids** exactly (`Daily life`, `Work`, …) so current sets/filters keep working. Add 10 new Title Case ids (same style).

| id (topic string) | titleVi | Scope (1 line) | Example words |
|---|---|---|---|
| Daily life | Cuộc sống hàng ngày | Everyday routines, time-of-day, general verbs/objects | morning, clean, week, busy, ready |
| Work | Công việc | Jobs, office, business tasks | meeting, salary, boss, career, deadline |
| Travel | Du lịch | Trips, transport, hotels, directions | airport, ticket, map, journey, hotel |
| Food | Ẩm thực | Food, drink, cooking, restaurants | bread, cook, menu, hungry, recipe |
| Health | Sức khỏe | Body, illness, fitness, medical | doctor, knee, medicine, tired, exercise |
| School | Trường học | Study, subjects, exams, campus | student, exam, history, homework, grammar |
| Technology | Công nghệ | Devices, internet, software | computer, password, online, app, video |
| Feelings | Cảm xúc | Emotions, moods, attitudes | happy, worry, excited, lonely, proud |
| People | Con người & quan hệ | Family, friends, social roles | uncle, friend, marriage, neighbor, baby |
| Home | Nhà cửa | Housing, rooms, furniture, chores | floor, blanket, drawer, kitchen, apartment |
| Shopping | Mua sắm & tiền bạc | Shops, prices, money, payments | price, cheap, wallet, rent, label |
| Nature | Thiên nhiên & môi trường | Weather, animals, plants, environment | weather, forest, cloud, river, volcano |
| Sports | Thể thao & sở thích | Sports, games, hobbies, leisure | baseball, skiing, climb, puzzle, ballet |
| Media | Truyền thông & giải trí | TV, film, music, news, books | television, DVD, columnist, cellist, biography |
| Society | Xã hội & đời sống công | Civic life, law, culture, community | government, theft, embassy, ceremony, law |
| Communication | Giao tiếp | Speaking, writing, messages, signs | sign, print, message, speak, letter |
| Appearance | Ngoại hình & tính cách | Clothes, looks, personality traits | suit, sweatshirt, cloth, tall, kind |
| Grammar words | Từ ngữ pháp | Prepositions, conjunctions, interjections, discourse markers | according to, because of, however, wow, and |

**Sets estimate:** 18 topics × 4 levels = 72 cells; at 20–30 words/set and merge &lt;12 → roughly **100–140 sets** (close to brief 100–150).

### Dry-run classification (100 headwords)

- `ANTHROPIC_API_KEY` was **not** set → **human dry-run** (allowed; no model call).
- Sample: 25 flagged-kept words × 4 levels (`sample-100.json`).
- Result file: `content-pipeline/data/raw/sample-100-classified.md`.

| Topic | Count |
|---|---:|
| Health | 12 |
| Sports | 12 |
| Society | 10 |
| Food | 9 |
| Travel | 9 |
| Nature | 7 |
| Home | 7 |
| School | 6 |
| Work | 6 |
| Media | 5 |
| People | 4 |
| Daily life | 4 |
| Appearance | 3 |
| Communication | 2 |
| Shopping | 2 |
| Technology | 1 |
| Feelings | 1 |
| Grammar words | 0 |

Notes: sample was noun-heavy (flagged nouns), so Grammar words = 0 here; the 122 prep/conj/interjection rows will fill that topic in Phase 3. Low-confidence examples: `bench`, `powder`, `blast`. Sensitive heads in sample: `suicide`, `bomber` → see banned-content policy.

| | Proposal | Reason | Alternative |
|---|---|---|---|
| Taxonomy | 18 topics; keep 8 existing ids | Matches UI; enough buckets for A1–B2 | Stay at 8 (sets become too mixed) |

---

## 6. Selection and closed-class policy

### After excluding closed-class POS (see below), A1–B2 pool

| Level | Kept rows | Flagged | Unflagged | Default quota | Need unflagged fill |
|---|---:|---:|---:|---:|---:|
| A1 | 1,033 | 480 | 553 | 800 | 320 |
| A2 | 1,370 | 469 | 901 | 900 | 431 |
| B1 | 2,432 | 658 | 1,774 | 800 | 142 |
| B2 | 2,773 | 550 | 2,223 | 500 | 0 (all from flagged) |
| **Total** | **7,608** | | | **3,000** | |

Quotas are **feasible**. B2 can be filled entirely from flagged rows.

### Closed-class policy (confirm brief)

**Exclude (191 rows):** determiner, pronoun, be-verb, do-verb, have-verb, modal auxiliary, infinitive-to, number.  
**Keep under Grammar words:** preposition (76), conjunction (37), interjection (9) → **122 rows**.

### Other selection rules

- One row per headword + POS (dataset grain).
- Variants: US form primary; other spelling(s) in `notes` (167 rows).
- Multi-level headwords (573): keep the CEFR-J level on that row (do not collapse across levels); uniqueness is `(word, pos)` for **system** words, so the same headword+pos cannot appear twice — if CEFR-J lists the same pair at two levels, keep the **lowest** level.
- Sensitive / graphic heads (`suicide`, weapons, slurs, etc.): exclude from system catalog via banned list (Phase 5), even if in CEFR-J.

| | Proposal | Reason | Alternative |
|---|---|---|---|
| Quotas | A1 800 · A2 900 · B1 800 · B2 500 | Matches brief; pool supports it | A1 700 / A2 800 if review capacity is tight |
| Closed-class | Exclude list above; keep prep/conj/interjection | Matches brief; 122 grammar words | Also drop interjections |

---

## 7. Schema / platform change proposal (for your approval — Phase 1)

### Database

| Change | Why |
|---|---|
| `words.source` `text` (e.g. `cefrj-1.5`, `manual`, `admin`) | Attribution + debugging |
| `words.sort_order` `integer` not null default 0 | Stable set ordering |
| `words.review_status` `text` check in (`ai_generated`,`ai_checked`,`human_reviewed`) | Pipeline + CMS |
| `words.ipa_status` `text` check in (`from_dict`,`proposed`,`missing`) nullable | Track IPA provenance |
| Unique index on system words: `(lower(word), part_of_speech) WHERE owner_id IS NULL` | Prevent duplicate catalog entries |
| `word_sets.sort_order` `integer` not null default 0 | Catalog ordering |
| Optional: `word_sets.source` / keep topic as text but validate against `content/topics.json` in app | Taxonomy SSOT |

### Types / content JSON

| Change | Why |
|---|---|
| Extend `PARTS_OF_SPEECH` with `preposition`, `conjunction`, `interjection` (keep `phrase`) | Grammar words + dataset POS |
| Load topics from `content/topics.json` (migrate off hard-coded 8) | SSOT for chips + admin |
| Add optional `status` on sets in content JSON (`draft`\|`published`) | Seed without forcing publish |
| Split final files to `content/vocabulary/a1.json` … `b2.json` (same schema) | Size / review by level |
| Preserve hand-written 9 sets + 3 words and their ids | Brief requirement |

### Seeder behaviour

| Change | Why |
|---|---|
| Do **not** force `status: "published"`; use JSON `status` or default `draft` for new system sets | Safe rollout |
| On conflict: **do not overwrite** rows that were admin-edited — e.g. skip update when `source='admin'` or `review_status='human_reviewed'`, or only insert-missing | Protect CMS work |
| Never run `db:seed --content` against production during this plan | Brief rule |

### Also recommended

| Change | Why |
|---|---|
| Credits page section citing CEFR-J + CMUdict + Google Books list | License obligation |
| `.dockerignore`: add `content-pipeline` (and `content-plan`) | Brief: pipeline must not ship in image |
| `.gitignore`: `content-pipeline/work/` | Intermediate JSONL |
| `.env.example`: `ANTHROPIC_API_KEY=` | Pipeline only |

| | Proposal | Reason | Alternative |
|---|---|---|---|
| Schema | Columns above + unique system index | Needed for review/rollout | Minimal: only `review_status` + unique |

---

## 8. Model choice and cost — **approved: Cursor-only ($0 API)**

**Context:** Personal project; no `ANTHROPIC_API_KEY` / $0 Anthropic credits. Priority = minimise cash cost. The brief’s Anthropic Batches default is **overridden**.

| Step | How | Batch size (per Cursor session) |
|---|---|---|
| Classify topic | Cursor agent + versioned prompt `prompts/classify.v1.md` → append JSONL | 50–100 words |
| Enrich | Cursor agent + `prompts/enrich.v1.md` → append JSONL | 20–50 words (smaller = better quality control) |
| AI review | Cursor agent + `prompts/review.v1.md` on finished entries | 30–50 words |

**Still local / free (no API key):**
- CEFR-J selection, frequency rank, CMUdict IPA, Zod validation, resume by input-hash + prompt version, `--limit` / `--dry-run`
- “Budget cap” = max words per session in `config.ts` (not dollars)
- Invalid model JSON → reject to queue; never silently accept

**Cash cost:** **$0** beyond existing Cursor subscription.  
**Tradeoff:** slower wall-clock; must run many small agent sessions; quality depends on the Cursor model chosen each time (prefer a capable model for enrich, cheaper/faster for classify if available).

### Optional later upgrade (not planned)

If credits appear later, the same prompts/JSONL layout can grow an optional `ANTHROPIC_API_KEY` runner (Batches). Keep scripts provider-agnostic: “fill this batch file from the prompt”.

### Superseded estimate (Anthropic Batches — not used)

For reference only: Haiku classify/review + Sonnet enrich via Batches was ~$6–8 for 3,000 words ($25 cap). **Not applicable** under the approved Cursor-only path.

| | Proposal (approved) | Reason | Alternative |
|---|---|---|---|
| AI runtime | Cursor agent in this IDE | $0 cash; personal project | Anthropic Batches (~$7–25) when credits exist |
| Guardrails | Local Zod + resumable JSONL + `--limit` | Keep pipeline discipline without an API | Skip scripts (worse) |

---

## 9. Validation rules and human review plan

### Automated validation rules (Phase 5 checklist)

| Code | Severity | Rule |
|---|---|---|
| `SCHEMA` | error | Zod schema; unique ids; set refs exist |
| `DUP_SYSTEM` | error | No duplicate system headword+pos |
| `MEANING_VI` | error | Non-empty; has Vietnamese orthography; not Latin-only copy of EN |
| `DEF_LEN` | error | `definitionEn` ≤ 15 words |
| `DEF_HEADWORD` | error | Definition does not contain headword |
| `EX_COUNT` | error | Exactly 2 examples with `en` + `vi` |
| `EX_LEN` | error | A1–A2: 5–12 words; B1–B2: ≤ 16 |
| `EX_HEADWORD` | error | Headword or inflection present in each `en` |
| `EX_DUP` | warning | Two examples near-identical |
| `LEVEL_LEAK` | warning | &gt;1 content word above target CEFR (lookup CEFR-J) |
| `BANNED` | error | Profanity/sensitive list, real names, brands, URLs |
| `IPA_MISSING` | warning | `ipa_status` missing/proposed |
| `TOPIC_LOW` | warning | Classification confidence below threshold |
| `COLLOC` | warning | Collocations empty when expected for high-freq nouns/verbs |

AI reviewer returns `pass | fix | reject`; apply fixes on a copy; still failing → `needs_human`. Pass-all → `review_status = ai_checked`.

### Human review plan

| Track | Scope | Est. time |
|---|---|---|
| Flagged queue | 100% of `needs_human` + IPA proposed + topic low-conf + sensitive near-misses | Assume 8–12% of 3,000 ≈ 240–360 words × ~45–60s ≈ **3–6 hours** |
| Stratified sample | ≥15% of `ai_checked` (≈ 450 words), stratified by level×topic | 450 × ~30s ≈ **3.5–4 hours** |
| Spot grammar-words + variants | All Grammar words (~100+) and variant/`notes` rows | **1–2 hours** |
| **Total** | | **~8–12 hours** of focused review |

Export: `work/review-queue.csv` + import round-trip in Phase 6. Nothing marked `human_reviewed` by automation.

| | Proposal | Reason | Alternative |
|---|---|---|---|
| Review | 100% flagged + ≥15% sample | Matches brief quality bar | 10% sample if timeboxed |

---

## Decisions — **approved** (2026-10-02)

| # | Decision | Reason | Alternative (not chosen) |
|---|---|---|---|
| D1 | Quotas A1 800 · A2 900 · B1 800 · B2 500 | Feasible on real pools | Lower A1/A2 |
| D2 | Closed-class exclude list; Grammar words for prep/conj/interjection | Brief default | Drop interjections too |
| D3 | Frequency fill via Google Books CC BY 3.0 list | License-clear; free | Flags-only |
| D4 | IPA via CMUdict + own ARPAbet→IPA | License + coverage; free | Model-only IPA |
| D5 | 18-topic taxonomy; keep 8 existing ids | UI compat + coverage | 8 or 12 topics |
| D6 | Schema columns + unique system index + safer seeder | Review/rollout safety | Minimal schema |
| D7 | **Cursor-only** generate/review; no Anthropic key; $0 API | Personal project; $0 credits | Anthropic Batches |
| D8 | Human review 100% flagged + ≥15% sample (~8–12h) | Quality (time, not cash) | 10% sample if timeboxed |

---

## Risks / open questions

1. **Same headword+pos at two CEFR levels** — propose keep lowest level; confirm.
2. **Sensitive CEFR-J heads** — exclude via banned list; confirm aggression level (weapons, suicide, drugs, politics).
3. **Existing 3 hand-written words** — may collide with system uniqueness when catalog grows; keep ids, merge carefully in Phase 7.
4. **Topic field is free text today** — migrating chips to 18 topics is a small UI change in Phase 1/7; confirm Title Case ids vs slugs (`daily-life`).
5. **Feelings** exists in `WORD_SET_TOPICS` but seed set `feelings-moods` uses topic `Daily life` — re-tag in content later?
6. **Cursor-only throughput** — 3,000 words need many small sessions; mitigate with clear batch files + resume hashes (Phase 2+).
7. **`.dockerignore`** — `content-pipeline` / `content-plan` already added in Phase 0 infra touch-up; confirm in Phase 1 if anything else must be excluded.

Open items still soft (defaults OK unless you change them): multi-level headword → keep lowest level; banned-content aggression; Title Case topic ids vs slugs; re-tag `feelings-moods` set topic.

---

## Plan for Phase 1

Approved to proceed when you say so: schema migration, `topics.json`, extended POS, content schema `status`, seeder that does not clobber admin/human_reviewed or force published, Credits stub — per `content-plan/02-phase-1-schema-platform.md`. Pipeline scripts stay Cursor-driven (no Anthropic client required).

**Phase 0 closed.** Start Phase 1 only on explicit go-ahead.
