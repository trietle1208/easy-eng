# Phase 9 Report — Admin CMS

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was built

An admin area under `/admin` for grammar lessons, reading passages, listening lessons, quizzes and system word sets.

| Capability | Where |
|---|---|
| Create / edit / list per kind | `/admin/[kind]`, `/admin/[kind]/new`, `/admin/[kind]/[id]` |
| Publish / unpublish / delete (drafts only) | `src/components/admin/status-actions.tsx`, `setContentStatusAction`, `deleteContentAction` |
| Save intents | `save` (keep status; new = draft), `publish`, `draft` |
| Preview of drafts | `/admin/[kind]/[id]/preview` (renders the learner views) |
| Import JSON (same schemas as `content/*.json`) | `/admin/import-export`, `importContentAction` |
| Export JSON | `/admin/export/[kind]?status=draft\|published` (route handler, admin-gated) |
| Audio upload (listening) | `uploadListeningAudioAction` → `listening/<slug>-<8hex>.<ext>` (`.wav .mp3 .ogg .m4a .webm`, max 25 MB) |
| Grammar taxonomy (families / groups) | forms on `/admin/grammar` |
| Audit log | `/admin/audit`, dashboard `/admin` |

**Every write** (save, publish, unpublish, delete, import, upload) inserts an `admin_audit_log` row inside the same transaction, then calls `revalidateTag` for the kind's cache tag plus `catalog`, and `revalidatePath` for `/admin` and `/` (`src/lib/admin/revalidate.ts`).

**Access:** `(admin)/layout.tsx` and every action call `requireAdmin()` — signed-out → sign-in redirect, non-admin → `notFound()` (404). Middleware also gates `/admin` by cookie. `requireUser` is unchanged.

### Learner data layer: published only

Only `status = 'published'` is visible to learners in `grammar.ts`, `reading.ts`, `listening.ts`, `quiz.ts`, the catalog counts / word of the day / continue items in `home.ts`, level totals in `user-activity.ts`, and system word sets in `vocabulary.ts` (set list, word lookup, review-due queries; a user's own sets are unaffected).

### Publish gating and validation

- Forms and imports are validated with the `content/schema.ts` Zod schemas plus cross-field rules (`src/lib/admin/validate.ts`): slug format, unique ids and sort orders, reading `correctIndex` in range, vocab segment ids exist, listening `endMs >= startMs`, quiz per-type payload.
- `publishBlockers()` blocks publishing incomplete items from the editor.
- Unique-violation on slug / child id → friendly field error.

### Seed compatibility

`pnpm db:seed -- --content` upserts content with `status: "published"` so a re-seed restores learner visibility for seeded ids (admin drafts on those ids are overwritten).

## 2. File map

- `src/lib/admin/` — `validate.ts`, `forms.ts` (client-safe); `service.ts`, `common.ts`, `audit.ts`, `revalidate.ts`, `load.ts`, `preview.ts`, `action-result.ts`, plus `grammar.ts`, `reading.ts`, `listening.ts`, `quiz.ts`, `vocabulary.ts`
- `src/lib/actions/admin-content.ts`, `admin-import.ts`, `admin-taxonomy.ts`, `admin-upload.ts`
- `src/components/admin/` — `entity-form`, `status-actions`, `import-form`, `taxonomy-forms`, `admin-page`
- `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/**`
- `scripts/seed.ts` (`--admin` + published status on upsert), `scripts/promote-admin.ts`
- Tests: `src/lib/auth/__tests__/require-admin.test.ts`, `src/lib/admin/__tests__/admin-content.test.ts`, `src/lib/admin/__tests__/admin-import-export.test.ts`, `e2e/admin.spec.ts`

**Deviation from the plan:** one dynamic `[kind]` route instead of five separate folders (same behavior, less duplication).

## 3. Creating an admin

Any of these works (migration `0004` already adds `user.role`):

```bash
# 1. Seed flag — promotes SEED_ADMIN_EMAIL if the user exists; otherwise creates a
#    verified admin (needs SEED_ADMIN_PASSWORD, >= 8 chars; optional SEED_ADMIN_NAME)
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=change-me-123 pnpm db:seed -- --admin

# 2. Promote / revoke an existing user
pnpm db:promote-admin -- you@example.com
pnpm db:promote-admin -- you@example.com --revoke

# 3. Raw SQL
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

`--admin` alone does not re-seed content. Docs: `.env.example` (commented `SEED_ADMIN_*`), README **Admin CMS** section.

`next.config.ts` raises the Server Action body limit to 26 MB for audio upload.

## 4. GitNexus impact (pre-edit)

- `visibleSetFilter` — HIGH, `assertSetAccessible` — CRITICAL: change only narrows visibility of **draft system** sets; owned sets unaffected.
- `isNavigationControl` (`_helpers.ts`) — CRITICAL: **not edited**. `notFound()` from `requireAdmin` would be swallowed by `throwActionError` inside a `try`, so admin actions call `requireAdmin()` outside the `try`.
- `requireUser` / `requireAdmin` / `setContentStatus` hubs: gap-fill did not change their signatures; tests + seed status upsert + test-utils only.
- `resetTestDatabase` — UNKNOWN callers (test-only); confirmed via text search before deadlock/retry fix.

## 5. Tests / checks

| Check | Result |
|---|---|
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` | **92** passed (16 files) |
| `pnpm build` | pass (admin routes present) |
| `pnpm test:e2e` | **7** passed (access + admin + learner journey) |
| `pnpm db:migrate` | up to date (`0004` applied in phase 8) |

Coverage:

- `requireAdmin`: signed-out → redirect, `user` / missing / unknown role → 404, `admin` passes; `requireUser` unchanged
- All six admin Server Actions gated the same way
- Draft grammar/reading/quiz hidden from learner reads; publish/unpublish toggles visibility + audit
- Export → re-import for every kind; import status `keep` / `draft` / `published`; invalid imports write nothing; published cannot be deleted; audio upload validation
- Playwright: signed-out `/admin` → sign-in; normal user `/admin` → 404; admin opens dashboard + grammar list

Test harness: `resetTestDatabase` uses the app Drizzle pool + deadlock retry; `seedTestContent` verifies rows after seed (avoids empty-DB flakes when truncate races a seed subprocess). Do not run two `pnpm test` processes against the same test DB.

## 6. Known caveats

- Previews render learner views, but checking answers on a draft only works after it is published.
- Re-running `db:seed --content` overwrites admin *content* edits to seeded ids and forces `status: published`.
- A grammar lesson's `practiceQuizSlug` may point at a draft quiz (link 404s for learners).
- Imports skip `publishBlockers`; vocabulary import is additive (never prunes words), whereas editor saves prune removed system words.
- `audioPath` file existence is not verified on save.
- Rate limiter is in-process (single instance).

## 7. Next

Nothing further is planned in `be-plan/`. Stopping here per project rule.

---

## 8. STOP

Phase 9 complete. Backend phases 0–9 are done.
