# Review prompt — v1 (Phase 5)

Cursor-only AI review of finished vocabulary entries. Do **not** invent IPA.
Do **not** mark anything `human_reviewed`. Cash API cost must stay **$0**.

## Input

A batch of enriched words (id, word, partOfSpeech, level, topicId, ipa,
meaningVi, definitionEn, examples[2], collocations, notes).

## Task

For each word, return a review object:

```json
{
  "id": "w-example-noun",
  "verdict": "pass | fix | reject",
  "issues": [{ "code": "SHORT_CODE", "message": "one short explanation" }],
  "fixes": null
}
```

When `verdict` is `fix`, set `fixes` to the full corrected enrichment fields
(`meaningVi`, `definitionEn`, `examples` length 2, `collocations`, `notes`).
When `pass` or `reject`, set `fixes` to `null`.

## What to check

1. **Meaning matches POS** — a verb entry must not have a noun gloss; examples
   must use the word in that part of speech.
2. **Vietnamese natural** — `meaningVi` and example `vi` sound like natural
   Vietnamese, not word-for-word calques; correct diacritics.
3. **English natural** — examples are everyday sentences a learner might hear;
   definition is simple and does not use the headword.
4. **Not misleading** — sense matches CEFR level and topic; nothing offensive,
   brand/person names, or URLs.

## Verdict guide

| Verdict | When |
|---|---|
| `pass` | No material problems (minor style nits OK) |
| `fix` | Clear, local problems you can correct in `fixes` |
| `reject` | Wrong POS sense, unsafe/banned content, or too broken to patch confidently |

## Output

Return a **JSON array** with one object per input id (same order). No markdown
fences, no commentary.

## Codes (suggested)

`POS_MISMATCH` · `VI_UNNATURAL` · `EX_UNNATURAL` · `MISLEADING` · `WRONG_SENSE` ·
`LEVEL_TOO_HARD` · `OTHER`
