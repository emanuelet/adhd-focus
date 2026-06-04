# ADHD Focus — Plan Patch: pnpm + Vite 8
> Apply on top of `adhd-focus-plan.md`. Where this conflicts, this takes precedence.

---

## What Changes

- All package management: `npm` → `pnpm`
- Vite version: `^8.0.0` (Rolldown-powered, ~10–30× faster builds)
- Two new config files: `.npmrc`, `pnpm-workspace.yaml`
- Dockerfile updated for pnpm
- One Vite 8 deprecation to avoid: `inlineDynamicImports` → `codeSplitting: false`

Everything else in the main plan is unchanged.

---

## New File: `.npmrc`

Create at project root. Required for pnpm's strict node_modules to work correctly
with TanStack Start's Vite plugin (which expects some packages to be hoisted):

```ini
shamefully-hoist=true
strict-peer-dependencies=false
```

---

## New File: `pnpm-workspace.yaml`

Even for a single-app project, this signals to pnpm that this is the workspace root:

```yaml
packages:
  - '.'
```

---

## Replace Section 4: Package Dependencies

```bash
# Runtime
pnpm add @tanstack/react-start @tanstack/react-router react react-dom
pnpm add zustand postgres jose

# Dev
pnpm add -D vite@^8.0.0 @vitejs/plugin-react vite-tsconfig-paths typescript
pnpm add -D workbox-build workbox-precaching workbox-routing workbox-strategies workbox-expiration tsx
pnpm add -D tailwindcss @tailwindcss/vite
```

### `package.json` additions

```json
{
  "packageManager": "pnpm@10.11.0",
  "scripts": {
    "dev":       "vite dev",
    "build":     "vite build && tsx scripts/generate-sw.ts",
    "start":     "node .output/server/index.mjs",
    "typecheck": "tsc --noEmit"
  }
}
```

Pin pnpm version in `packageManager` to match your homelab install
(`pnpm --version` to check). Corepack uses this field to auto-select the right version.

---

## Replace Section 5: `vite.config.ts`

Vite 8 uses Rolldown everywhere — no config changes needed to enable it, it's the default.
One deprecation to know: if you see `inlineDynamicImports` in any plugin output,
it now means `codeSplitting: false` (Rolldown renamed it). This doesn't affect your
config directly but good to know if a plugin warns.

```typescript
import { defineConfig }   from 'vite'
import { tanstackStart }  from '@tanstack/react-start/plugin/vite'
import viteReact          from '@vitejs/plugin-react'
import tsConfigPaths      from 'vite-tsconfig-paths'

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart(),
    viteReact(),
    // vite-plugin-pwa intentionally excluded — see PWA note in main plan.
    // Service worker generated post-build via scripts/generate-sw.ts.
  ],
  // Vite 8: tsconfigPaths is also available via resolve.tsconfigPaths: true,
  // but the plugin approach is preferred for TanStack Start.
})
```

---

## Replace Section 21 Dockerfile

```dockerfile
FROM node:22-alpine AS base
# Enable corepack so pnpm is available without a separate install step
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
EXPOSE 3000
ENV PORT=3000
CMD ["node", ".output/server/index.mjs"]
```

Key difference from the npm version: `corepack enable` in the base stage activates
pnpm via the `packageManager` field in `package.json`. `--frozen-lockfile` is the
pnpm equivalent of `npm ci` — fails if `pnpm-lock.yaml` is out of sync.

---

## `docker-compose.yml`

Unchanged from main plan. The `build:` context picks up the new Dockerfile automatically.

---

## Phase 1 Scaffold — Updated Commands

```bash
# 1. Scaffold with pnpm
pnpm create @tanstack/start@latest adhd-focus
cd adhd-focus

# 2. Create .npmrc BEFORE installing anything else
echo "shamefully-hoist=true" >> .npmrc
echo "strict-peer-dependencies=false" >> .npmrc

# 3. Create pnpm-workspace.yaml
echo "packages:\n  - '.'" > pnpm-workspace.yaml

# 4. Install all deps
pnpm add @tanstack/react-start @tanstack/react-router react react-dom zustand postgres jose
pnpm add -D vite@^8.0.0 @vitejs/plugin-react vite-tsconfig-paths typescript
pnpm add -D workbox-build workbox-precaching workbox-routing workbox-strategies workbox-expiration tsx
pnpm add -D tailwindcss @tailwindcss/vite

# 5. Verify
pnpm dev
```

Create `.npmrc` **before** running `pnpm install`. If you install first and add it
after, re-run `pnpm install` to rebuild the node_modules layout with hoisting applied.

---

## All Other `npm` → `pnpm` Substitutions

Anywhere the main plan shows an `npm` command, use the pnpm equivalent:

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npm run dev` | `pnpm dev` |
| `npm run build` | `pnpm build` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |

---

## Vite 8 Gotcha — `build.target`

Vite 8's default `build.target` updated to newer browser baselines:
Chrome 111, Firefox 114, Safari 16.4 (Baseline Widely Available as of 2026-01-01).
This is fine for a homelab personal app — you control the browsers.
No action needed unless you need to support older devices.

---

## No Other Changes

All server functions, routes, components, hooks, DB schema, auth, and
deployment config in `adhd-focus-plan.md` remain exactly as written.
