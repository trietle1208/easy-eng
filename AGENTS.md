# Agent notes — Easy English (chill-english)

## Project

Next.js 15 app for **Easy English** (repo folder `chill-english`). Mockups in `mockup/`; UI plans in `ui-plan/`; backend plans in `be-plan/`. Package manager: **pnpm**.

## Current phase

**Backend** — All phases 0–9 complete (`be-plan/phase-9-report.md` — admin CMS at `/admin`). Promote an admin with `pnpm db:promote-admin -- <email>` or `pnpm db:seed -- --admin`.
UI is tagged `ui-v1` (phases 0–4 complete). Backend work follows `be-plan/`. Only work on the phase I name, and stop after its report.

## Backend phases

| Phase | Status | Notes |
|---|---|---|
| 0 — Audit and schema design | **done** (2026-09-30) | `be-plan/phase-0-report.md` |
| 1 — Infra and server boundary | **done** (2026-09-30) | `be-plan/phase-1-report.md` |
| 2 — Schema, migrations, seeders | **done** (2026-09-30) | `be-plan/phase-2-report.md` |
| 3 — Authentication | **done** (2026-09-30) | `be-plan/phase-3-report.md` |
| 4 — Content read from DB | **done** (2026-09-30) | `be-plan/phase-4-report.md` |
| 5 — Learning actions / progress | **done** (2026-09-30) | `be-plan/phase-5-report.md` |
| 6 — Vocabulary CRUD + FSRS | **done** (2026-09-30) | `be-plan/phase-6-report.md` |
| 7 — Home, progress, profile | **done** (2026-09-30) | `be-plan/phase-7-report.md` |
| 8 — Hardening, tests, deploy | **done** (2026-09-30) | `be-plan/phase-8-report.md` |
| 9 — Admin CMS (optional) | **done** (2026-09-30) | `be-plan/phase-9-report.md` |

## Conventions (from brief)

- Keep the `src/lib/data/` UI contract; replace mock implementations with DB-backed ones
- Tokens as CSS variables; themes `default` and `blossom` (`data-theme`)
- Server Components by default; `"use client"` only for interaction
- Product name: **Easy English**
- No hard-coded colors outside token definitions
- Backend work follows `be-plan/`. Only work on the phase I name, and stop after its report.

## Paths

| Brief path | Actual |
|---|---|
| `mockup/screenshot/` | `mockup/screenshots/` |
| `docs/ui-plan/` | plans + reports in `ui-plan/` (mirrored under `docs/ui-plan/` when useful) |
| Backend brief / phases | `be-plan/00-brief.md` and `be-plan/0N-phase-*.md` |

## After each completed phase

1. Note status on the phase markdown file / write `be-plan/phase-N-report.md`
2. Update this file and `CLAUDE.md`
3. Refresh GitNexus: `npx gitnexus analyze`

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **easy-eng** (3111 symbols, 5606 relationships, 143 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/easy-eng/context` | Codebase overview, check index freshness |
| `gitnexus://repo/easy-eng/clusters` | All functional areas |
| `gitnexus://repo/easy-eng/processes` | All execution flows |
| `gitnexus://repo/easy-eng/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
