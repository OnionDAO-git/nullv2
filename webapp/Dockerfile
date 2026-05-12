# Build context = nullv2 root.
# Build:  docker build -f webapp/Dockerfile -t nullv2-webapp .
FROM oven/bun:1.2 AS builder
WORKDIR /app

COPY package.json bunfig.toml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY webapp/package.json ./webapp/package.json

RUN bun install --frozen-lockfile

COPY webapp ./webapp
RUN bun run --filter webapp build

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/webapp/build ./webapp/build
COPY --from=builder /app/webapp/package.json ./webapp/package.json
COPY package.json ./

EXPOSE 3101
ENV PORT=3101
CMD ["bun", "run", "webapp/build/index.js"]
