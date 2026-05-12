#!/usr/bin/env bash
# Bootstrap the local dev environment for nullv2.
#
# 1. Start Postgres in Docker
# 2. Wait for it to be ready
# 3. Generate + apply Drizzle migrations against the local DB
# 4. Seed the four flagship faction reps
#
# In dev we run nullv2's owned tables against a local DB. We do NOT migrate
# users/sessions/magic_links — those are owned by landing-2026. To verify a
# real session locally, point AUTH_DATABASE_URL at your landing-2026 dev DB
# (or run a manual INSERT into local users/sessions for testing).

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Creating .env from .env.example"
  cp .env.example .env
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "▶ starting postgres"
docker compose up -d postgres

echo "▶ waiting for postgres to be ready"
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U nullv2 -d nullv2 >/dev/null 2>&1; then
    echo "  ✓ postgres ready"
    break
  fi
  sleep 1
done

# nullv2 reads users/sessions from the same DB. In dev we create stubs so
# the auth path is testable end-to-end without landing-2026.
echo "▶ creating local stubs for users/sessions (dev only)"
docker compose exec -T postgres psql -U nullv2 -d nullv2 <<'SQL'
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  is_admin        BOOLEAN DEFAULT false,
  org             TEXT, city TEXT, bio TEXT, link TEXT,
  profile_claimed BOOLEAN DEFAULT false,
  notion_id       TEXT, handle TEXT, avatar_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_login_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
SQL

echo "▶ generating + applying Drizzle migrations"
bun run --filter @nullv2/db generate
bun run --filter @nullv2/db migrate

echo "▶ seeding faction flagships"
bun run --filter @nullv2/db seed

echo "✅ dev-setup complete. Next:"
echo "    bun run dev:api    # API on :${API_PORT:-3100}"
echo "    bun run dev:web    # webapp on :${WEBAPP_PORT:-3101}"
