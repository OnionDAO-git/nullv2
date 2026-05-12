# Build context = nullv2 root.
# Build:  docker build -f services/tick/Dockerfile -t nullv2-tick .
FROM oven/bun:1.2 AS deps
WORKDIR /app

COPY package.json bunfig.toml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services/tick/package.json ./services/tick/package.json

RUN bun install --frozen-lockfile

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json bunfig.toml tsconfig.base.json ./
COPY packages ./packages
COPY services/tick ./services/tick

CMD ["bun", "run", "services/tick/src/index.ts"]
