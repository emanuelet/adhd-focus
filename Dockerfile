FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/dist/client/sw.js ./dist/client/sw.js 2>/dev/null || true
EXPOSE 3000
ENV PORT=3000
CMD ["node", ".output/server/index.mjs"]
