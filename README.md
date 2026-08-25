# ADHD Focus

> Self-hosted ADHD productivity app wrapping Todoist, synced across laptop + phone via PostgreSQL. Built with TanStack Start.

## Features

- **3-slot Today view** — Force-pick exactly 3 tasks per day to avoid overwhelm
- **Inbox** — Full Todoist backlog with quick promote-to-Today
- **Pomodoro timer** — Configurable sprint lengths (25/52/90/120 min) with break tracking and Web Notifications
- **Pre-flight ritual** — Checklist prompt before each sprint (phone away, water, etc.)
- **Energy tagging** — 🌱⚡🔥 per task, persisted to DB
- **Quick capture** — Floating drawer, local + send to Todoist inbox
- **Explicit organizer** — Generate strict AI proposals for Todoist or Karakeep, then approve or reject them manually
- **Done log** — Session completion tracking with sprint stats

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start (v1) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + dark theme CSS variables |
| State | Zustand |
| Database | PostgreSQL |
| DB client | `postgres` |
| Auth | Single-user JWT (`jose`) |
| Organizer SDKs | `@openrouter/sdk`, `@doist/todoist-sdk`, `@karakeep/sdk` |
| Clients | Web app today; Tauri and Capacitor planned |
| Deploy | Docker |

## Getting Started

```bash
pnpm install
pnpm dev
```

### Organizer configuration

Set these server-side environment variables before using organizer proposals:

```bash
DATABASE_URL=postgres://...
APP_SECRET=...
TODOIST_API_TOKEN=...
OPENROUTER_API_KEY=...
KARAKEEP_API_KEY=...
KARAKEEP_BASE_URL=http://localhost:3000 # optional
OPENROUTER_MODEL=openai/gpt-5.6-luna # optional override
```

The default OpenRouter model is `openai/gpt-5.6-luna`. Organizer generation only stores a runtime-validated pending proposal. It never applies AI output automatically. Approval explicitly creates or updates a Todoist task, or creates a Karakeep bookmark tagged `must-read`.

## Scripts

```bash
pnpm dev       # Start dev server
pnpm build     # Build for production
pnpm test      # Run tests (Vitest)
pnpm lint      # Lint with Biome
pnpm format    # Format with Biome
pnpm check     # Lint + format check
pnpm typecheck # TypeScript type checking
pnpm tauri:dev # Run the Linux desktop shell
pnpm tauri:build:linux # Build deb and AppImage packages
pnpm capacitor # Run Capacitor commands
```

## Native shells

Android and Tauri desktop shells load `https://adhdfocus.etonello.work`.
They contain no API credentials and rely on the existing HTTPS session cookie. Native
clients keep a local SQLite outbox for sync operations; retries for Todoist commands
remain server-owned until those commands are added to the sync contract.

```bash
pnpm exec cap sync
pnpm exec cap open android
pnpm tauri:dev
```

Tauri Linux builds require Rust and the system WebKitGTK development packages.
Run database integration tests only against a disposable PostgreSQL database:

```bash
TEST_DATABASE_URL=postgres://... pnpm test
```

### Cloudflare Tunnel

Set `CLOUDFLARED_TUNNEL_TOKEN` in the Compose environment to expose the app
through an existing Cloudflare Tunnel. The `cloudflared` sidecar waits for the
app health check and does not contain tunnel credentials in the repository.

## Deployment

```bash
pnpm build
node dist/server/index.mjs
```

## Project Structure

See [`.plans/`](.plans/) for implementation plans and product notes.
