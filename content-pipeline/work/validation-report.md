# Validation report (Phase 5)

Generated: 2026-10-02T09:42:36.591Z  
Prompt: `review.v1` · Cursor-only ($0 API)

## Summary

| Metric | Count |
|---|---:|
| Total words | 3000 |
| `ai_checked` | 3000 |
| `needs_human` | 0 |
| With warnings (any) | 533 |
| Catalog-level issues | 0 |
| Regenerated once | 0 |
| Still failing after regen | 0 |

## By level

| Level | Total | ai_checked | needs_human |
|---|---:|---:|---:|
| A1 | 800 | 800 | 0 |
| A2 | 900 | 900 | 0 |
| B1 | 800 | 800 | 0 |
| B2 | 500 | 500 | 0 |

## By topic

| Topic | Total | ai_checked | needs_human |
|---|---:|---:|---:|
| Appearance | 87 | 87 | 0 |
| Communication | 54 | 54 | 0 |
| Daily life | 769 | 769 | 0 |
| Feelings | 72 | 72 | 0 |
| Food | 133 | 133 | 0 |
| Grammar words | 79 | 79 | 0 |
| Health | 116 | 116 | 0 |
| Home | 218 | 218 | 0 |
| Media | 91 | 91 | 0 |
| Nature | 53 | 53 | 0 |
| People | 203 | 203 | 0 |
| School | 221 | 221 | 0 |
| Shopping | 176 | 176 | 0 |
| Society | 198 | 198 | 0 |
| Sports | 148 | 148 | 0 |
| Technology | 29 | 29 | 0 |
| Travel | 161 | 161 | 0 |
| Work | 192 | 192 | 0 |

## Counts per rule / issue code

| Code | Count |
|---|---:|
| LEVEL_LEAK | 523 |
| IPA_MISSING | 7 |
| BANNED | 4 |

## Top 10 issue types

| # | Code | Count |
|---|---|---:|
| 1 | LEVEL_LEAK | 523 |
| 2 | IPA_MISSING | 7 |
| 3 | BANNED | 4 |

## 20 example mistakes caught

1. `w-above-adverb` **above** — `LEVEL_LEAK`: >1 content word above A1: position, written _(def: in a higher place or position)_
2. `w-academic-adjective` **academic** — `LEVEL_LEAK`: >1 content word above B1: related, improved _(def: related to schools, study, or formal education)_
3. `w-adventure-noun` **adventure** — `LEVEL_LEAK`: >1 content word above A2: sometimes, risky _(def: an exciting and sometimes risky experience)_
4. `w-advertising-noun` **advertising** — `LEVEL_LEAK`: >1 content word above A2: known, firm _(def: the activity of making products known)_
5. `w-airplane-noun` **airplane** — `LEVEL_LEAK`: >1 content word above A1: vehicle, nervous _(def: a flying vehicle that carries people)_
6. `w-almost-adverb` **almost** — `LEVEL_LEAK`: >1 content word above A1: nearly, completely _(def: very nearly but not completely)_
7. `w-along-adverb` **along** — `LEVEL_LEAK`: >1 content word above A1: forward, moving _(def: forward with someone, or continuing a way)_
8. `w-already-adverb` **already** — `LEVEL_LEAK`: >1 content word above A1: expected, report _(def: before now, or sooner than expected)_
9. `w-although-conjunction` **although** — `LEVEL_LEAK`: >1 content word above A2: main, working _(def: used to show contrast with the main idea)_
10. `w-always-adverb` **always** — `LEVEL_LEAK`: >1 content word above A1: times, staff _(def: at all times; every time)_
11. `w-angel-noun` **angel** — `LEVEL_LEAK`: >1 content word above A2: spirit, main _(def: a kind spirit, often shown with wings in stories)_
12. `w-angry-adjective` **angry** — `LEVEL_LEAK`: >1 content word above A1: dislike, delay _(def: feeling strong dislike because of something bad)_
13. `w-ankle-noun` **ankle** — `LEVEL_LEAK`: >1 content word above A2: joint, foot _(def: the joint where your foot joins your leg)_
14. `w-apply-verb` **apply** — `LEVEL_LEAK`: >1 content word above A2: formally, surface, skin, gently _(def: to request something formally, or put on a surface)_
15. `w-appreciate-verb` **appreciate** — `LEVEL_LEAK`: >1 content word above A2: highly, service _(def: to feel grateful, or to value something highly)_
16. `w-apron-noun` **apron** — `LEVEL_LEAK`: >1 content word above A1: worn, cooking _(def: a cloth worn over clothes when cooking or cleaning)_
17. `w-arm-noun` **arm** — `LEVEL_LEAK`: >1 content word above A1: part, last _(def: the part of the body between the shoulder and the hand)_
18. `w-art-noun` **art** — `LEVEL_LEAK`: >1 content word above A1: drawing, similar, creative, modern _(def: painting, drawing, and similar creative school subjects)_
19. `w-article-noun` **article** — `LEVEL_LEAK`: >1 content word above A1: single, useful, payment _(def: a single item that you can buy in a shop)_
20. `w-artificial-adjective` **artificial** — `LEVEL_LEAK`: >1 content word above A2: found, sunset _(def: made by people, not found in nature)_

## First-pass note

Initial run: 38 error-severity hits (mostly undiacriticized VN glosses + brand/self-hit false positives). Validators tuned; **no enrich regenerate**. See `content-plan/phase-5-report.md`.

## Notes

- Fixes from AI review are stored on `fixedCopy` only; originals kept.
- Nothing marked `human_reviewed`; no DB import.
- Dominant `LEVEL_LEAK` (523): not mass-regenerated; Phase 6 samples the queue.
