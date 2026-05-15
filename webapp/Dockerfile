# Build context = nullv2 root.
# Build:  docker build -f webapp/Dockerfile -t nullv2-webapp .
FROM oven/bun:1.2 AS builder
WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY packages ./packages
COPY services/api/package.json ./services/api/package.json
COPY services/tick/package.json ./services/tick/package.json
COPY services/inference/package.json ./services/inference/package.json
COPY webapp/package.json ./webapp/package.json

RUN bun install --frozen-lockfile

COPY webapp ./webapp
RUN bun run --filter webapp build

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 3101
ENV PORT=3101
CMD ["bun", "run", "webapp/build/index.js"]
