# Easy English (chill-english)

Notebook-style English learning UI. Product name in the app: **Easy English**. Folder / GitNexus repo: `chill-english`.

## Status — UI (tagged `ui-v1`)

| Phase | Status | Notes |
|---|---|---|
| 0 — Audit | **done** (2026-09-29) | `ui-plan/phase-0-report.md` |
| 1 — Foundation | **done** (2026-09-29) | `ui-plan/phase-1-report.md` · showcase `/dev/components` |
| 2 — Layout shell | **done** (2026-09-29) | `ui-plan/phase-2-report.md` · AppShell + routes |
| 3a — Home | **done** (2026-09-29) | `ui-plan/phase-3a-report.md` · `/` |
| 3b — Grammar | **done** (2026-09-29) | `ui-plan/phase-3b-report.md` · `/grammar/[lessonSlug]` |
| 3c — Vocabulary | **done** (2026-09-29) | `ui-plan/phase-3c-report.md` · `/vocabulary`, `/vocabulary/new` |
| 3d — Reading | **done** (2026-09-29) | `ui-plan/phase-3d-report.md` · `/reading/[slug]` |
| 3e — Listening | **done** (2026-09-29) | `ui-plan/phase-3e-report.md` · `/listening/[slug]` |
| 3f — Quiz | **done** (2026-09-29) | `ui-plan/phase-3f-report.md` · `/quiz/[slug]` |
| 3g — Profile | **done** (2026-09-29) | `ui-plan/phase-3g-report.md` · `/profile` |
| 4 — Polish | **done** (2026-09-29) | `ui-plan/phase-4-report.md` · a11y/responsive/states |

## Status — Backend phases

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

## Stack

- Next.js 15 App Router + React 19 + TypeScript + Tailwind **v4** + **pnpm**
- next-themes: `default` / `blossom` via `data-theme` on `<html>`
- Fonts: Be Vietnam Pro (body, `vietnamese`), Patrick Hand (hand), JetBrains Mono (IPA/timers)
- Radix (shadcn-style) + lucide-react + motion + RHF + Zod 4
- Backend target: PostgreSQL 16 + Drizzle + Better Auth (see `be-plan/00-brief.md`)

## Source of truth

- Values: `mockup/html/` · Look: `mockup/screenshots/` · UI plans: `ui-plan/` · Backend plans: `be-plan/` · Briefs: `ui-plan/00-brief.md`, `be-plan/00-brief.md`

## Do not

- Paste mockup HTML 1:1; rebuild behavior in React
- Hard-code colors outside design tokens
- Backend work follows `be-plan/`. Only work on the phase I name, and stop after its report.
- Start the next phase without approval after the previous report

## GitNexus

Indexed as **chill-english**. After substantive code changes: `npx gitnexus analyze` (or `node .gitnexus/run.cjs analyze`).

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **easy-eng** (4507 symbols, 9333 relationships, 364 execution flows).

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
