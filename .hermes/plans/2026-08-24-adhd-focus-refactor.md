# ADHD Focus Refactor Implementation Plan

> **For OpenCode agents:** Follow the assigned lane only. Do not edit files owned by another lane. Read this plan before work and record results under `Progress`.

**Goal:** Turn ADHD Focus into a reliable personal task, ideas, notes, and must-read manager with approved AI organization, Todoist/Karakeep integrations, GNOME desktop, and Capacitor mobile clients.

**Architecture:** PostgreSQL is the authority for local entities and a durable operation log. Todoist remains a single shared-token task provider; Karakeep is the canonical store for approved must-read URLs. Clients use optimistic UI backed by a local outbox, then reconcile through server-owned integrations. OpenRouter produces reviewable, schema-validated proposals only.

**Tech stack:** TanStack Start, TypeScript, PostgreSQL, Zustand, Workbox, OpenRouter, Todoist REST API, Karakeep API, Tauri, Capacitor.

---

## Product decisions

- Todoist remains a single personal shared-token account.
- AI proposals always require review before application.
- Must-read URLs create a Karakeep bookmark tagged `must-read` after approval.
- Offline scope is capture and task actions, queued for eventual sync.
- Tauri is the GNOME desktop shell. Warm first-interactive-frame target: under 400 ms.
- Start of day surfaces actionable work. Clock-off asks:
  1. What did I actually move forward today?
  2. What's the one thing that matters most tomorrow?
  3. What loose ends will nag at me if I don't write them down right now?
- Weekly review surfaces stale must-reads, ideas/projects, and loose ends.

## Ownership and dependency graph

| Lane | Owner | Scope | Depends on |
|---|---|---|---|
| A | Sync foundation | migrations, operation log, sync server contract | none |
| B | Todoist reliability | typed client updates, outbox-backed task mutation behavior | A contract |
| C | Notes and AI | ideas/notes/references, OpenRouter proposals, Karakeep apply | A migrations |
| D | Daily workflow | priority Today, clock-off, weekly review UI/server | A migrations |
| E | Tauri desktop | desktop shell and platform adapter | A sync contract, D routes |
| F | Capacitor mobile | mobile shell and platform adapter | A sync contract, D routes |
| G | Integration QA | cross-device, offline, failure-path tests | A-F completed |

Agents may research their dependencies but must not edit dependency-owned files until the owning lane has landed its contract. Shared files (`package.json`, route loader, `App.tsx`, `useMutations.ts`, types) are main-agent merge points.

## Data model

- `sync_operations`: idempotency key, device id, entity type/id, operation type, payload, base revision, status, error, timestamps.
- `sync_entities`: per-entity revision/version for conflict checks.
- `notes`: raw text, kind (`idea|note|loose_end`), lifecycle (`active|archived|promoted`), last_touched_at.
- `reference_items`: source capture, URL, title, status (`optional|must_read|done|archived`), Karakeep bookmark ID, last_touched_at.
- `organization_proposals`: capture, structured proposal JSON, OpenRouter model, status (`pending|applied|dismissed|failed`), applied target IDs.
- `daily_reviews`: extend with `moved_forward`, `tomorrow_most_important`, `loose_ends`.
- `user_preferences`: timezone, schedule, quiet hours, stale thresholds, notification settings.

## Conflict and retry policy

- Every client operation has a UUID idempotency key.
- Client queues operations locally and marks optimistic entities `pending` or `failed`.
- Captures/notes are append-only and deduplicated by operation ID.
- Todo completion is monotonic: an already-complete task is a successful replay.
- Today slots are validated server-side with a max of three selected focus tasks; collision responses return the authoritative state.
- Metadata/reviews/preferences use last-write-wins and retain remote revision metadata.
- Server-side Todoist and Karakeep effects are logged before execution and retried without duplicate remote creation.

## Work packages

### A. Sync foundation

1. Add an append-only migration for sync entities, operations, preferences, and review fields.
2. Add typed runtime validation for sync operation input and server responses.
3. Implement authenticated pull-by-cursor and idempotent push endpoints.
4. Add operation state transitions and retry-safe external-effect records.
5. Test duplicate operation, revision collision, max-three collision, and retry behavior.

**Files:** `src/lib/db/migrations/002_sync.sql`, `src/lib/db/run-migrations.ts`, `src/server/sync.ts`, `src/types/sync.ts`, `src/lib/__tests__/sync.test.ts`.

### B. Todoist reliability

1. Add typed `updateTask` support to the Todoist client and server wrapper.
2. Move task mutations to command operations with idempotency identifiers.
3. Add optimistic rollback/error states rather than leaving divergent Zustand data.
4. Invalidate/reconcile after successful remote effects.
5. Test create, complete, update, failure, and replay behavior.

**Files:** `src/lib/todoist-client.ts`, `src/server/todoist.ts`, `src/hooks/useMutations.ts`, `src/store/useAppStore.ts`, tests.

### C. Notes, AI, and Karakeep

1. Add migrations and types for notes, references, and proposals.
2. Preserve instant raw capture; add explicit `Organize` action.
3. Implement a server-only OpenRouter client with timeout, strict schema validation, and minimal prompt data.
4. Implement proposal apply/dismiss; model output never executes directly.
5. Implement a server-only Karakeep client that creates an approved must-read bookmark tagged `must-read`.
6. Test malformed model output, dismissed proposal, Todoist create/update, and Karakeep failure/retry.

**Files:** `src/lib/openrouter-client.ts`, `src/lib/karakeep-client.ts`, `src/server/organizer.ts`, `src/server/karakeep.ts`, `src/components/capture/`, `src/components/organize/`, types/tests.

### D. Daily and weekly workflow

1. Add `Needs doing` ordering: overdue, due today, then focus-selected tasks.
2. Keep the focus-task limit separate from actionable work.
3. Add a `Clock off` flow with the three agreed prompts.
4. Add next-day selection, loose-end capture, and durable review save.
5. Add weekly stale review using configurable thresholds: must-read 7d, ideas/projects 30d, loose ends 7d.
6. Test ordering, review persistence, next-day action, and stale classification.

**Files:** `src/components/today/TodayView.tsx`, `src/components/review/`, `src/server/review.ts`, `src/server/state.ts`, `src/components/App.tsx`, `src/components/layout/Nav.tsx`, tests.

### E. Tauri desktop

1. Add Tauri workspace and a platform adapter without putting secrets in the shell.
2. Add local SQLite operation outbox and sync-on-launch/reconnect.
3. Add global quick-capture shortcut, notifications, tray action, and deep link to clock-off/review.
4. Benchmark warm launch to first interactive frame; record result and investigate any result above 400 ms.
5. Test native adapter boundaries and build a Linux package.

**Files:** `src-tauri/`, `src/platform/desktop.ts`, `src/platform/index.ts`, Tauri configuration/tests.

### F. Capacitor mobile

1. Add Capacitor config, Android/iOS shells, and a platform adapter.
2. Add secure session storage and local SQLite operation outbox.
3. Sync on launch, resume, reconnect, and manual refresh.
4. Add scheduled local start-of-day, clock-off, and weekly review notifications.
5. Test platform adapter boundaries; manually verify Android/iOS notification permission and offline replay.

**Files:** `capacitor.config.ts`, `android/`, `ios/`, `src/platform/mobile.ts`, mobile adapter tests.

### G. Integration QA and release

1. Run unit, type, lint, and production build checks.
2. Test two clients editing Today concurrently.
3. Test offline capture, completion, metadata, and replay.
4. Test AI proposal approval/dismissal and Karakeep failure recovery.
5. Verify desktop warm startup and phone notification paths.
6. Update README, deployment environment variables, and runbook.

## Verification commands

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Progress

- 2026-08-24: Scope and product decisions confirmed. No implementation started.
- 2026-08-24: OpenCode lanes A-D dispatched for implementation/research. E-F remain blocked on the sync contract.
- 2026-08-24: Lane A completed in `/tmp/opencode/adhd-sync`; reported typecheck clean and 11 isolated validation tests passing. Database-backed tests need PostgreSQL.
- 2026-08-24: Lane B completed in `/tmp/opencode/adhd-todoist`; reported unit suite and typecheck clean. Its changes are large for the requested boundary and require review before integration.
- 2026-08-24: Lane C completed in `/tmp/opencode/adhd-organizer`; reported unit suite and typecheck clean. Its migration, proposed schema, and external API assumptions require review before integration.
- 2026-08-24: Lane D completed in `/tmp/opencode/adhd-workflow`; reported unit suite and typecheck clean. It conflicts with lanes A/C on migration registration and shared types, so it requires merge review.
- 2026-08-24: No lane has been integrated into the main worktree. Next gate: audit each diff, reconcile migrations/types, then run the combined suite before opening Tauri and Capacitor lanes.
- 2026-08-24: Workbox removed from the main app. Native clients will own durable offline queues; the web client remains online-first until a separate IndexedDB outbox is deliberately added.
- 2026-08-24: Paseo workspaces registered under ADHD Focus project `prj_4b939d1a550f4767`: sync `wks_bb6d20f939615708`, Todoist `wks_1a12d8b2fb3e9c75`, organizer `wks_9485f7876732b833`, daily workflow `wks_da3fa85842994689`. Their OpenCode sessions are resumed in Paseo terminals: `f760af04-1950-4ca8-b515-ef65abc47587`, `e21fb0f3-93ed-4d17-82d3-6bf385f50b96`, `be10c9ce-3c0f-4f7c-a431-ef305366bc96`, `a0d1c322-5ef8-4f51-9b0a-10b4618214a6`.
- 2026-08-25: `/tmp/opencode` was cleared after restart. The four lane worktrees were prunable and their uncommitted changes were lost. Recreate lanes under `.worktrees/`; the plan and branch names survived.
- 2026-08-25: Persistent Paseo workspaces recreated under ADHD Focus project `prj_4b939d1a550f4767`: sync `wks_1ee090e6ac1b5482`, Todoist `wks_ffd0b03ce4002aaf`, organizer `wks_ea17084ab914fcc8`, daily workflow `wks_e7659b64c07bcb95`.
- 2026-08-25: Preserved OpenCode sessions resumed in their respective persistent Paseo terminals: sync `049e91b1-a67d-4f24-95ee-699a7e1d3415`, Todoist `cdb442b1-0e2d-4d32-8d22-627871492a98`, organizer `608887da-5255-447a-904d-102c309f2cbe`, daily workflow `c32c360d-3dad-4330-969d-8f63bd22b9cf`. Sessions retain context but their prior uncommitted filesystem changes must be recreated.
- 2026-08-25: The manually-created `.worktrees/` paths were removed. Replacement Paseo-managed worktrees now use `~/.paseo/worktrees/3uoadt4m/`: sync `wks_980f48a1ba7036ed`, Todoist `wks_8dabf461302389b1`, organizer `wks_cf783db8b010f4d1`, daily workflow `wks_52df5e564c64c38f`.
- 2026-08-25: Recreating the lanes is blocked: OpenCode session resume returned server errors, and fresh runs exhausted the configured OpenRouter weekly key limit before any files were written. All four replacement worktrees remain clean.
- 2026-08-25: Reconstruction completed with OpenCode `openai/gpt-5.6-luna`, not OpenRouter. Lane A sync: `pnpm typecheck` and 85 tests passed. Lane B Todoist reliability: typecheck and 84 tests passed. Lane C organizer/Karakeep: typecheck and 87 tests passed. Lane D daily workflow: typecheck, 84 tests, Biome, and diff checks passed.
- 2026-08-25: All four lane PRs merged. GitHub resolved the migration registry as `002_sync.sql`, `003_organizer.sql`, and `004_review.sql`.
