# Phase 4 report — Enrichment

Date: 2026-10-02  
Status: **done** (awaiting approval) — Cursor-only ($0 API); **no DB import**

**Pilot decisions confirmed:** P4-1 few-shots OK · P4-2 quality OK · full run authorized.

---

## 1. What was done

### Prompt
- `content-pipeline/prompts/enrich.v1.md` — full brief spec + audience + 12 few-shot examples (approved)

### Pipeline
- `src/enrich.ts` / `lib/enrich.ts` / `lib/enrich-schema.ts`
- Zod batch validation (exact ids, schema)
- Soft rules: def ≤15 words, no headword (word-boundary), example length, headword/inflection in examples
- Resumable JSONL (`work/enriched.jsonl`), cache key = input hash + `enrich.v1`
- Pending/done batch files under `work/enrich-batches/`
- Failures → retry once, then `work/enrich-failed.jsonl` (empty at end)
- Budget cap = **200 words / session**; cash API = **$0**
- Unit tests: `src/__tests__/enrich.test.ts` (8)

### Commands
```bash
pnpm content:enrich -- --pilot
pnpm content:enrich -- --apply content-pipeline/work/enrich-batches/done-NN.json
pnpm content:enrich -- --export-pilot
pnpm content:enrich -- --status
pnpm content:enrich -- --limit 200
```

### Outputs
| File | Committed? |
|---|---|
| `work/enriched.jsonl` | no (regenerate / continue) |
| `work/pilot.csv` | **yes** |
| `work/phase4-manifest.json` | **yes** |
| `work/enrich-failed.jsonl` | no (empty / absent) |
| `work/enrich-batches/*` | no |

**No DB import. Skeleton / sets untouched.** Every word: `reviewStatus = ai_generated`, `source = cefrj-1.5+ai`.

---

## 2. Numbers

| Metric | Value |
|---|---:|
| Enriched | **3,000** / 3,000 |
| Failed (final) | **0** |
| A1 / A2 / B1 / B2 | **800 / 900 / 800 / 500** |
| Prompt version | `enrich.v1` |
| Cash API cost | **$0** |
| Anthropic requests / tokens | **0** |

### Usage vs Phase 0
| | Phase 0 Batches estimate | This run |
|---|---|---|
| Runtime | Anthropic Batches (~$6–8) | **Cursor-only** |
| Requests / tokens | N/A under D7 | **0** Anthropic |
| Cash API cost | ~$6–8 | **$0** |

### Prompt versions
| Version | Change |
|---|---|
| `enrich.v1` | Initial spec + 12 few-shots (approved after pilot) |
| *(code)* | `DEF_HEADWORD` word-boundary; irregular forms (`leaf/leaves`, `cry/cried`, `die/died`, `arise/arose`, …) |

### Soft-validation retries during full run
Typical one-off fixes: `phone`/`telephone` false positive (code); `leaf`/`leaves`; short A1 examples; `right` containing itself in def; `cry`/`cried`; `die`/`died`; `arise`/`arose`; `speed`/`sped`. All retried and accepted — **no permanent failures**.

---

## 3. Decisions to confirm

| # | Decision | Notes |
|---|---|---|
| **P4-1** | Few-shots in `enrich.v1.md` approved | Confirmed |
| **P4-2** | Pilot quality OK → full run | Confirmed |
| **P4-3** | Full enrich complete with `enrich.v1` | Confirm phase close |
| P4-4 | Batch size 25 / session budget 200 | Worked; keep for Phase 5+ |

---

## 4. Risks / known issues

1. **Cursor quality variance** — many parallel fast-model batches; Phase 5 + Phase 6 sampling should catch bad senses.
2. **Homographs** — enrichment follows classified POS + topic only; secondary senses mostly in notes.
3. **Soft rules ≠ Phase 5** — no CEFR level-leak, banned-list, or Vietnamese-orthography hard fail yet.
4. **IPA from CMUdict** — known oddities unchanged (skeleton).
5. **Sensitive lemmas** (e.g. *suicide*, *terrorism*) — kept factual/neutral; review in Phase 6 flagged sample.

---

## 5. 30 random enriched entries (seed 42)

1. **[A1] bike** (noun) · Travel — *xe đạp; xe máy (thân mật)* · “a bicycle, or informally a motorcycle”
2. **[A1] blue** (noun) · Appearance — *màu xanh dương* · “the colour of a clear sky or the sea”
3. **[A1] change** (noun) · Shopping — *tiền thối, tiền lẻ* · “money you get back when you pay too much”
4. **[A1] important** (adjective) · Daily life — *quan trọng* · “having great meaning or value for someone”
5. **[A1] know** (verb) · School — *biết, quen biết* · “to have information or be familiar with someone”
6. **[A1] name** (noun) · People — *tên* · “the word people use to call you or a thing”
7. **[A1] pocket** (noun) · Appearance — *túi áo, túi quần* · “a small bag sewn inside clothes for small things”
8. **[A1] sale** (noun) · Shopping — *đợt giảm giá* · “a time when shops sell things cheaper”
9. **[A1] sorry** (adjective) · Feelings — *xin lỗi; tiếc* · “feeling bad about something you did”
10. **[A1] white** (adjective) · Appearance — *màu trắng* · “having the colour of milk or fresh snow”
11. **[A2] admit** (verb) · Daily life — *thừa nhận; cho vào* · “to say something is true, often unwillingly”
12. **[A2] aisle** (noun) · Travel — *lối đi (máy bay, cửa hàng)* · “a passage between rows of seats or shelves”
13. **[A2] attractive** (adjective) · Appearance — *hấp dẫn, thu hút (ngoại hình)* · “nice to look at in a pleasant way”
14. **[A2] cycling** (noun) · Sports — *đạp xe (như một hoạt động)* · “the activity of riding a bicycle for sport or fun”
15. **[A2] lemonade** (noun) · Food — *nước chanh* · “a sweet cold drink made from lemon juice”
16. **[A2] pasta** (noun) · Food — *mì Ý* · “food made from flour, often with sauce”
17. **[A2] policeman** (noun) · People — *nam cảnh sát* · “a man who works as a member of the police”
18. **[A2] position** (noun) · Daily life — *vị trí; chức vụ* · “the place where someone or something is”
19. **[A2] textbook** (noun) · School — *sách giáo khoa* · “a book used for study in a school subject”
20. **[A2] wonder** (verb) · Daily life — *tự hỏi, thắc mắc* · “to think about something and want to know more”
21. **[B1] fitness** (noun) · Sports — *thể lực, sức khỏe thể chất* · “the condition of being strong and healthy through exercise”
22. **[B1] nail** (noun) · Health — *móng tay, móng chân* · “the hard part at the end of a finger or toe”
23. **[B1] permit** (verb) · Daily life — *cho phép* · “to allow someone to do something”
24. **[B1] sickness** (noun) · Health — *ốm đau, tình trạng bệnh* · “the state of being ill or feeling unwell”
25. **[B2] fabric** (noun) · Appearance — *vải, chất liệu vải* · “material used for clothes, curtains, or furniture covers”
26. **[B2] identify** (verb) · Daily life — *nhận dạng, xác định* · “to recognize someone or say who they are”
27. **[B2] manufacture** (noun) · Work — *sản xuất công nghiệp* · “the business of making goods in factories”
28. **[B2] range** (verb) · Daily life — *dao động, nằm trong khoảng* · “to vary between two limits in size, amount, or level”
29. **[B2] rock** (verb) · Nature — *lay đưa, chao đảo* · “to move slowly back and forth or from side to side”
30. **[B2] wind** (verb) · Nature — *quấn, cuộn; uốn khúc* · “to turn or twist something around something else”

---

## 6. Plan for Phase 5

Per `content-plan/06-phase-5-validation.md`: automated validation on enriched JSONL (schema, meaningVi, definition rules, examples, banned content, IPA flags), write validation report + queue — **still no DB import**.

**Phase 4 complete pending your approval.** Do not start Phase 5 until you say go.
