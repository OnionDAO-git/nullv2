# Build context = nullv2 root.
# Build:  docker build -f services/tick/Dockerfile -t nullv2-tick .
FROM oven/bun:1.2 AS deps
WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY packages ./packages
COPY services/api/package.json ./services/api/package.json
COPY services/tick/package.json ./services/tick/package.json
COPY services/inference/package.json ./services/inference/package.json
COPY webapp/package.json ./webapp/package.json

RUN bun install --frozen-lockfile

COPY services/tick ./services/tick

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app /app

CMD ["bun", "run", "services/tick/src/index.ts"]
