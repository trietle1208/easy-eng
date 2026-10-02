# Phase 5 — Automated validation and AI review

Read `content-plan/00-brief.md` and the approved earlier reports first.

## Goal
Catch as many mistakes as possible with code and a second model pass, so human time goes to what really needs a human.

## Do
1. **Rule checks** (`validate.ts`, pure functions with unit tests). Each failure has a code, a severity (error | warning) and a message:
   - schema valid, ids unique, no duplicate headword + pos among system words, set references exist;
   - `meaningVi` non-empty, contains Vietnamese letters or is a valid Vietnamese word, no Latin-only sentence copied from the definition;
   - `definitionEn` ≤ 15 words and does not contain the headword;
   - exactly 2 examples; length limits per level; the headword (or an inflected form: handle regular inflections and a small irregular-verb table) appears in each example; the two examples are not near-identical; the Vietnamese translation is present;
   - **level check using the dataset itself**: tokenize each example and the definition, look every word up in the CEFR-J list; warn when more than 1 content word is above the target level (words not in the list, such as names or numbers, are ignored);
   - banned content: profanity/sensitive-topic word list, real-person or brand names, URLs, digits-only strings;
   - topic confidence and IPA status (`missing` → warning).
2. **AI reviewer** (`review.ts`, `prompts/review.v1.md`): a separate model call that receives the finished entries and returns per word `verdict` (pass | fix | reject), `issues[]` (code + short explanation) and, for `fix`, the corrected fields. Checks: meaning matches the pos and the examples, translation is natural, example is natural English, nothing misleading for Vietnamese learners. Apply `fix` suggestions only to a copy; keep the original.
3. **Regenerate once** the words that fail with error severity or are rejected, then re-validate. Still failing → `needs_human`.
4. Set `reviewStatus = "ai_checked"` on words that pass everything. Output `work/validated.jsonl`, `work/review-queue.csv` (needs_human + warnings) and `work/validation-report.md` (counts per rule, per level and per topic, top 10 most frequent issue types).
5. Use the issue statistics to improve the prompts if one issue type dominates (e.g. wrong pos), re-run only the affected words, and note the prompt version change.

## Do NOT
- Mark anything `human_reviewed`. Do not import into the database.

## Done when
- Every word is `ai_checked` or in the review queue; the validation report exists; unit tests pass.
- Report with the issue statistics, how many words need a human, and 20 examples of mistakes the checks caught. Then STOP.
