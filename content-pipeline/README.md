# Vocabulary content pipeline

Intermediate tooling for building the system vocabulary catalog (~3,000 A1–B2 words).

- Plan / brief: `content-plan/`
- Reports: `content-plan/phase-*-report.md`
- Raw sources: `data/raw/` (CEFR-J, CMUdict, Google Books frequency)
- Corrections: `data/classify-corrections.jsonl`
- Prompts: `prompts/` (versioned; Cursor-only runtime)
- Work intermediates: `work/` (git-ignored except manifests / topic-report / pilot.csv)

Do not copy this folder into the Docker image.

## Commands

```bash
pnpm content:skeleton      # Phase 2 — CEFR-J → skeleton.jsonl
pnpm content:classify      # Phase 3 — topics → classified.jsonl + topic-report.csv
pnpm content:build-sets    # Phase 3 — sets.json (12–30 words each)
pnpm content:enrich        # Phase 4 — Cursor enrich (see flags)
pnpm content:validate      # Phase 5 — rules + Cursor review (see flags)
pnpm content:export-review # Phase 6 — review sheet (XLSX + CSV)
pnpm content:import-review # Phase 6 — import filled CSV (no DB)
pnpm content:refill        # Phase 6 — refill after drops
```

### Classify flags

```bash
pnpm content:classify -- --limit 100
pnpm content:classify -- --dry-run
```

Cursor-only: no Anthropic key. Classification = CEFR-J tags + POS rules + lexicon + patterns + `data/classify-corrections.jsonl`.

### Enrich flags (Phase 4)

```bash
pnpm content:enrich -- --pilot                 # select 100 pilot words + pending batches
pnpm content:enrich -- --apply PATH/done-01.json
pnpm content:enrich -- --export-pilot          # work/pilot.csv (UTF-8 BOM)
pnpm content:enrich -- --status
pnpm content:enrich -- --limit 50              # full-run prep (after pilot approval)
pnpm content:enrich -- --dry-run
```

Cursor agent fills `work/enrich-batches/pending-NN.json` using `prompts/enrich.v1.md`,
writes `done-NN.json` (JSON array), then `--apply`. Budget cap = 100 words/session ($0 API).

### Validate flags (Phase 5)

```bash
pnpm content:validate                    # rules + cursor-rules review → outputs
pnpm content:validate -- --dry-run
pnpm content:validate -- --status
pnpm content:validate -- --write-regen   # write regen enrich batches for failures
pnpm content:validate -- --apply-review PATH/done-review.json
pnpm content:validate -- --limit 100
```

Cursor-only: rule checks are pure code; AI review defaults to `cursor-rules`
(aligned with `prompts/review.v1.md`). Optional Cursor batches can override via
`--apply-review`. Failures → `work/regen-batches/` (re-enrich once), then
re-validate; still failing → `needs_human`. Pass → `ai_checked`.

### Human review flags (Phase 6)

```bash
pnpm content:export-review                 # work/review-sheet.xlsx (+ CSV)
pnpm content:export-review -- --status
pnpm content:export-review -- --dry-run
pnpm content:import-review -- path.csv     # apply decisions → validated.jsonl
pnpm content:import-review -- --dry-run path.csv
```

Guide (Vietnamese): [`REVIEW-GUIDE.md`](./REVIEW-GUIDE.md).  
Sheet `review` = must-include + stratified ≥15% sample; sheet `catalog` = full read-only.  
Import sets `human_reviewed` only for rows you decided; **no DB import**.  
After drops: `pnpm content:refill -- --dry-run` then `--apply` (Phase 2 next candidates → classify/enrich/validate).

### Outputs

| File | Committed? |
|---|---|
| `work/skeleton.jsonl` | no |
| `work/manifest.json` | yes |
| `work/classified.jsonl` | no |
| `work/sets.json` | no |
| `work/topic-report.csv` | yes |
| `work/phase3-manifest.json` | yes |
| `work/enriched.jsonl` | no |
| `work/pilot.csv` | yes (after pilot) |
| `work/phase4-manifest.json` | yes |
| `work/validated.jsonl` | no |
| `work/review-queue.csv` | yes |
| `work/validation-report.md` | yes |
| `work/phase5-manifest.json` | yes |
| `work/review-sheet.xlsx` / `.csv` | no |
| `work/review-filled.csv` | yes (after import) |
| `work/review-dropped.jsonl` | yes (after import) |
| `work/quality-gate.md` | yes |
| `work/phase6-manifest.json` | yes |
| `REVIEW-GUIDE.md` | yes |
