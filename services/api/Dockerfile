# Build context = nullv2 root.
# Build:  docker build -f services/api/Dockerfile -t nullv2-api .
FROM oven/bun:1.2 AS deps
WORKDIR /app

COPY package.json bunfig.toml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services/api/package.json ./services/api/package.json

RUN bun install --frozen-lockfile

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json bunfig.toml tsconfig.base.json ./
COPY packages ./packages
COPY services/api ./services/api

EXPOSE 3100
CMD ["bun", "run", "services/api/src/index.ts"]
