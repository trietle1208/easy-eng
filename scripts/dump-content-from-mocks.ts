/**
 * Historical one-shot: content was dumped from `src/lib/mock/*` into `content/*.json`.
 * Content mocks for grammar/reading/listening/quiz were removed in Phase 4.
 * Edit `content/*.json` (and re-run `pnpm db:seed -- --content`) instead.
 */
console.error(
  "[dump] Content JSON already lives under content/. Edit those files; content mocks were removed in Phase 4.",
);
process.exit(1);
