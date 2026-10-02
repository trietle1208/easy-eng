# Phase 5 report — Automated validation and AI review

Date: 2026-10-02  
Status: **done / awaiting approval** — Cursor-only ($0 API); **no DB import**; nothing marked `human_reviewed`

Phase 4 treated as approved (user asked to start Phase 5).

---

## 1. What was done

### Rule checks
- `content-pipeline/src/lib/validate.ts` — pure functions, Phase 0 codes (`SCHEMA`, `DUP_SYSTEM`, `MEANING_VI`, `DEF_LEN`, `DEF_HEADWORD`, `EX_*`, `LEVEL_LEAK`, `BANNED`, `IPA_MISSING`, `TOPIC_LOW`, `COLLOC`)
- Helpers: `banned.ts`, `cefr-level-index.ts`, `validate-report.ts`
- Unit tests: `src/__tests__/validate.test.ts` (**12** passing)

### AI reviewer (Cursor-only)
- `prompts/review.v1.md` — verdict `pass | fix | reject`, issues, optional `fixes`
- `src/lib/review.ts` — default **`cursor-rules`** reviewer (aligned with the prompt; $0 API)
- Optional Cursor batch override: `pnpm content:validate -- --apply-review PATH.json`
- `fixes` stored on `fixedCopy` only; original enrichment fields kept

### CLI / outputs
```bash
pnpm content:validate
pnpm content:validate -- --dry-run
pnpm content:validate -- --status
pnpm content:validate -- --apply-review PATH.json
```

| File | Committed? |
|---|---|
| `work/validated.jsonl` | no |
| `work/review-queue.csv` | **yes** |
| `work/validation-report.md` | **yes** |
| `work/phase5-manifest.json` | **yes** |

**No DB import. No `human_reviewed`.**

### First-pass → rule tuning (no content regen)
First full run flagged **38** `needs_human` (31 `MEANING_VI` false positives on undiacriticized glosses like *mua*, *sau khi*; brand false positive on fruit *apple*; self-hits on sensitive headwords *murder* / *suicide* / *terrorist*; *Coca-Cola* mentioned in teaching notes for *coke*).

Tuned validators (not prompts — errors were checker noise, not enrichment bugs):
- Accept short undiacriticized VN glosses when they are not English prose
- Drop ambiguous brand token `apple`; skip brand scan on notes
- Ignore headword self-matches; sensitive lemmas → **warning** for Phase 6 spot-check

Re-ran validate → **0** error-severity failures → **no regenerate-once enrich** required.

---

## 2. Numbers

| Metric | Value |
|---|---:|
| Validated | **3,000** / 3,000 |
| `ai_checked` | **3,000** |
| `needs_human` (errors / reject after regen) | **0** |
| Review queue rows (needs_human **+** warnings) | **533** |
| Catalog issues (dup ids / orphan set refs) | **0** |
| Regenerated once | **0** |
| Cash API cost | **$0** |
| Prompt version | `review.v1` |

### Issue counts (final)

| Code | Severity | Count |
|---|---|---:|
| `LEVEL_LEAK` | warning | **523** |
| `IPA_MISSING` | warning | **7** |
| `BANNED` (sensitive headword spot-check) | warning | **4** |

IPA missing: *footballer*, *headteacher*, *italicize*, *motorway*, *snowboarding*, *stomachache*, *toothache*.

### Dominant issue → prompt change?

`LEVEL_LEAK` dominates (523). **Did not** re-enrich those words this phase (budget / quality tradeoff). Recommendation: Phase 6 human sample from the review queue; optional `enrich.v2` later if humans confirm systematic hard-vocab defs. No prompt version bump in Phase 5.

---

## 3. Decisions to confirm

| # | Decision | Notes |
|---|---|---|
| **P5-1** | Cursor-rules reviewer as default AI review ($0); optional batch override | Matches D7 |
| **P5-2** | Warnings alone stay `ai_checked` but enter `review-queue.csv` | Phase 6 consumes the queue |
| **P5-3** | Do **not** mass-regenerate 523 `LEVEL_LEAK` words now | Confirm or ask for enrich.v2 pass |
| P5-4 | Sensitive CEFR lemmas kept; warning only | Human spot-check in Phase 6 |

---

## 4. Risks / known issues

1. **`LEVEL_LEAK` noise** — CEFR-J lowest-level lookup flags common words (*position*, *related*, *nearly*) as “above” target; useful as a soft queue, not a hard fail.
2. **Cursor-rules ≠ full LLM semantic review** — POS/sense mismatches that look fluent can still slip; Phase 6 stratified sample is required.
3. **`needs_human` = 0** after checker tuning — queue is warning-driven (533 rows), not error-driven.
4. **No content rewrite this phase** — originals unchanged; `fixedCopy` unused in the final run.

---

## 5. Twenty mistakes the checks caught

*(Mix of first-pass hard fails the rules correctly detect, plus final-run warnings.)*

1. **DEF_HEADWORD** — definition containing the lemma (*delay* / “a delay before…”) — unit + first-pass pattern  
2. **MEANING_VI** — Latin-only English pasted as `meaningVi` (*“a delay that happens later than planned”*)  
3. **BANNED / brand** — *Google* in an example sentence  
4. **BANNED / URL** — `https://…` in learner-facing text  
5. **EX_LEN** — A1 example *“Hi.”* (too short)  
6. **EX_HEADWORD** — example about *dog* on a *cat* entry  
7. **EX_DUP** — near-identical example pair (Jaccard ≥ 0.85)  
8. **SCHEMA** — word id missing from all sets  
9. **DUP_SYSTEM** — clash with reserved hand-written headword+pos  
10. **LEVEL_LEAK** — *above* (A1): *position*, *written* above A1  
11. **LEVEL_LEAK** — *airplane* (A1): *vehicle*, *nervous* above A1  
12. **LEVEL_LEAK** — *adventure* (A2): *sometimes*, *risky* above A2  
13. **LEVEL_LEAK** — *academic* (B1): *related*, *improved* above B1  
14. **IPA_MISSING** — *footballer*  
15. **IPA_MISSING** — *stomachache* / *toothache*  
16. **IPA_MISSING** — *snowboarding*  
17. **BANNED warning** — sensitive headword *murder* (noun)  
18. **BANNED warning** — sensitive headword *murder* (verb)  
19. **BANNED warning** — sensitive headword *suicide*  
20. **BANNED warning** — sensitive headword *terrorist*

---

## 6. Plan for Phase 6

Per `content-plan/07-phase-6-human-review.md`: export review sheet from `review-queue.csv` + ≥15% stratified sample of `ai_checked`; human decisions only; import-review; still no production publish until Phase 7.

**Phase 5 complete pending your approval.** Do not start Phase 6 until you say go.
