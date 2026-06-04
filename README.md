# ADHD Focus

> Self-hosted ADHD productivity app wrapping Todoist, synced across laptop + phone via PostgreSQL. Built with TanStack Start.

## Features

- **3-slot Today view** — Force-pick exactly 3 tasks per day to avoid overwhelm
- **Inbox** — Full Todoist backlog with quick promote-to-Today
- **Pomodoro timer** — Configurable sprint lengths (25/52/90/120 min) with break tracking and Web Notifications
- **Pre-flight ritual** — Checklist prompt before each sprint (phone away, water, etc.)
- **Energy tagging** — 🌱⚡🔥 per task, persisted to DB
- **Quick capture** — Floating drawer, local + send to Todoist inbox
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
| PWA | `workbox-build` post-build |
| Deploy | Docker |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm dev       # Start dev server
pnpm build     # Build for production
pnpm test      # Run tests (Vitest)
pnpm lint      # Lint with Biome
pnpm format    # Format with Biome
pnpm check     # Lint + format check
pnpm typecheck # TypeScript type checking
```

## Deployment

```bash
pnpm build
node dist/server/index.mjs
```

## Project Structure

See [`plan/`](plan/) for implementation plans and product notes.
