# Phase 0 — Audit and plan (no code)

Read `docs/ui-plan/00-brief.md` first; it applies to this phase.

## Goal
Understand the repo and the mockups, and produce a plan I can review before any code is written.

## Do
1. Read the repo structure, `package.json`, existing config (Tailwind, ESLint, tsconfig, next.config) and any existing app routes.
2. Read every file in `mockup/html/` and look at every file in `mockup/screenshot/`.
3. Extract the design tokens from the HTML (both Default and Blossom): colors, font families and sizes, radii, shadows, blur values, spacing patterns.

## Deliver (as `docs/ui-plan/phase-0-report.md`)
1. **Repo audit**: current structure, versions of Next.js/React/Tailwind, and a list of files/folders you must NOT touch (backend, DB, API).
2. **Token table**: token name → Default value → Blossom value → where it is used.
3. **Component inventory**: every shared component, its props, and which screens use it.
4. **Route tree**: final folder structure under `src/app/`.
5. **Mock data types**: every type with its fields, and which data-access functions will return it.
6. **Dependencies to install**, with versions.
7. **Risks and open questions**: anything ambiguous in the mockups, conflicts with the existing code, or decisions you need from me.

## Do NOT
- Create or modify any code or install anything.

## Done when
The report exists and covers all 7 sections. Then STOP and wait for my review.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-0-report.md`](./phase-0-report.md) (also mirrored at `docs/ui-plan/phase-0-report.md`)
- **Next:** await review, then Phase 1
