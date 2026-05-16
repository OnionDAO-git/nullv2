#!/usr/bin/env bash
# Deploy Null City v2 to Railway, INTO landing-2026's existing project.
#
# nullv2's four services (api, tick, inference, webapp) get added alongside
# landing-2026's own services, sharing the same Postgres via Railway's
# internal network. No DB URL prompted — services reference Postgres by name
# using Railway's ${{<service>.DATABASE_URL}} variable resolution.
#
# Assumes:
#  - landing-2026 is already deployed in a Railway project with a Postgres
#    service. nullv2 only writes to its own tables; users/sessions/magic_links
#    stay landing-2026's.
#  - Public routing is subdomain-based: city.oniondao.dev (webapp) +
#    api.city.oniondao.dev (api). Custom-domain DNS is up to you — this script
#    only generates the *.up.railway.app domains.
#
# Prereqs:
#  - Railway CLI v3+ installed and authenticated (`railway login`).
#  - Repo working tree is clean enough to upload (Railway tars the current dir).
#  - You are in or under the nullv2 repo root when running this.
#  - You know the name of the Postgres service in landing-2026's project
#    (Railway's default for managed Postgres is "Postgres").
#
# Re-running: safe-ish. Service creation is idempotent; variables overwrite;
# `railway up` redeploys. If a step fails, fix and re-run.

set -euo pipefail
cd "$(dirname "$0")/.."

# Load .env if present so any pre-filled values skip the prompts below.
# Anything not set here (or in the shell environment) will be prompted for.
if [ -f .env ]; then
  echo "▶ loading .env"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

COOKIE_DOMAIN="${AUTH_COOKIE_DOMAIN:-.oniondao.dev}"

# ---- preflight --------------------------------------------------------------

command -v railway >/dev/null 2>&1 || {
  echo "❌ railway CLI not installed. https://docs.railway.com/guides/cli" >&2
  exit 1
}

if ! railway whoami >/dev/null 2>&1; then
  echo "❌ not logged in. Run: railway login" >&2
  exit 1
fi

# ---- prompts ----------------------------------------------------------------

prompt_secret() {
  local var="$1" prompt="$2"
  if [ -n "${!var:-}" ]; then return; fi
  read -r -s -p "$prompt: " val
  echo
  printf -v "$var" '%s' "$val"
}

prompt_value() {
  local var="$1" prompt="$2" default="${3:-}"
  if [ -n "${!var:-}" ]; then return; fi
  if [ -n "$default" ]; then
    read -r -p "$prompt [$default]: " val
    val="${val:-$default}"
  else
    read -r -p "$prompt: " val
  fi
  printf -v "$var" '%s' "$val"
}

echo "▶ collecting config (pre-set as env vars to skip prompts)"
prompt_value  POSTGRES_SERVICE     "landing-2026's Postgres service name" "Postgres"
prompt_secret INFERENCE_API_KEY    "INFERENCE_API_KEY"
prompt_value  INFERENCE_BASE_URL   "INFERENCE_BASE_URL" "https://api.openai.com/v1"
prompt_value  INFERENCE_MODEL      "INFERENCE_MODEL"    "gpt-4o-mini"
prompt_value  INFERENCE_MAX_TOKENS "INFERENCE_MAX_TOKENS" "400"

# Railway variable references — resolved at deploy time by Railway, not bash.
# Single quotes + escaped braces so $POSTGRES_SERVICE interpolates but ${{...}}
# is sent verbatim. End result example: ${{Postgres.DATABASE_URL}}
DB_URL_REF="\${{${POSTGRES_SERVICE}.DATABASE_URL}}"
# Public proxy URL — needed for migrations + seed run from a local shell,
# because `railway run` injects vars but executes locally and can't resolve
# Railway's *.railway.internal DNS.
DB_PUBLIC_URL_REF="\${{${POSTGRES_SERVICE}.DATABASE_PUBLIC_URL}}"

echo
echo "⚠  This will add 4 nullv2 services into landing-2026's Railway project"
echo "   and reference its Postgres at: $DB_URL_REF"
echo "   Migrations will run against the SHARED prod DB. nullv2 only touches"
echo "   its own tables (drizzle.config.ts excludes the external/ schema)."
read -r -p "Continue? [y/N] " ok
[[ "$ok" =~ ^[Yy]$ ]] || { echo "aborted"; exit 1; }

# ---- project ----------------------------------------------------------------

if railway status >/dev/null 2>&1; then
  echo "▶ project already linked:"
  railway status | sed 's/^/    /'
else
  if [ -n "${RAILWAY_PROJECT_ID:-}" ]; then
    echo "▶ linking landing-2026 project by ID: $RAILWAY_PROJECT_ID"
    railway link --project "$RAILWAY_PROJECT_ID"
  else
    echo "▶ pick landing-2026's project + environment from the list:"
    railway link
  fi
fi

# `railway link` doesn't always set an environment. Without one, every later
# CLI call (variables, up, etc.) fails. Force a pick if it's missing.
if railway status 2>/dev/null | grep -qi '^Environment:[[:space:]]*None'; then
  echo "▶ no environment selected — picking one now:"
  railway environment
fi

# Confirm the named Postgres service is actually visible in this env.
# Capture stderr so the user sees Railway's actual error if the probe fails.
if ! probe_err=$(railway variables --service "$POSTGRES_SERVICE" 2>&1 >/dev/null); then
  cat >&2 <<EOF
❌ couldn't see a service named '$POSTGRES_SERVICE' in the linked project/environment.

   Railway CLI said:
$(echo "$probe_err" | sed 's/^/     /')

   Fix options:
     1. Find the exact service name in the Railway dashboard sidebar for the
        oniondao project (case + spaces matter). Then re-run with:
          POSTGRES_SERVICE='<exact-name>' ./scripts/deploy-railway.sh
        or set POSTGRES_SERVICE in .env.
     2. If you picked the wrong environment, switch it:
          railway environment
     3. If the project link itself is wrong:
          railway unlink && ./scripts/deploy-railway.sh
EOF
  exit 1
fi

# ---- services ---------------------------------------------------------------

ensure_service() {
  local name="$1"
  # `railway add --service NAME` creates an empty service. If it already exists
  # the CLI errors; we swallow that and continue.
  if railway add --service "$name" >/dev/null 2>&1; then
    echo "  + created $name"
  else
    echo "  ✓ $name exists (or add failed — re-check if later steps complain)"
  fi
}

echo "▶ ensuring services"
ensure_service api
ensure_service tick
ensure_service inference
ensure_service webapp

# ---- env vars ---------------------------------------------------------------
#
# Railway's internal DNS: <service>.railway.internal — used for inter-service
# calls so we don't go out through the public domain.

INFERENCE_INTERNAL_URL="http://inference.railway.internal:3102"
API_INTERNAL_URL="http://api.railway.internal:3100"

set_vars() {
  local service="$1"; shift
  echo "▶ setting variables on $service"
  railway variables --service "$service" "$@" >/dev/null
}

set_vars api \
  --set "RAILWAY_DOCKERFILE_PATH=services/api/Dockerfile" \
  --set "DATABASE_URL=$DB_URL_REF" \
  --set "DATABASE_PUBLIC_URL=$DB_PUBLIC_URL_REF" \
  --set "AUTH_DATABASE_URL=$DB_URL_REF" \
  --set "AUTH_COOKIE_NAME=session" \
  --set "AUTH_COOKIE_DOMAIN=$COOKIE_DOMAIN" \
  --set "API_PORT=3100" \
  --set "PORT=3100" \
  --set "INFERENCE_URL=$INFERENCE_INTERNAL_URL"

set_vars tick \
  --set "RAILWAY_DOCKERFILE_PATH=services/tick/Dockerfile" \
  --set "DATABASE_URL=$DB_URL_REF" \
  --set "TICK_INTERVAL_MS=300000"

set_vars inference \
  --set "RAILWAY_DOCKERFILE_PATH=services/inference/Dockerfile" \
  --set "DATABASE_URL=$DB_URL_REF" \
  --set "INFERENCE_PORT=3102" \
  --set "PORT=3102" \
  --set "INFERENCE_BASE_URL=$INFERENCE_BASE_URL" \
  --set "INFERENCE_API_KEY=$INFERENCE_API_KEY" \
  --set "INFERENCE_MODEL=$INFERENCE_MODEL" \
  --set "INFERENCE_MAX_TOKENS=$INFERENCE_MAX_TOKENS"

set_vars webapp \
  --set "RAILWAY_DOCKERFILE_PATH=webapp/Dockerfile" \
  --set "DATABASE_URL=$DB_URL_REF" \
  --set "AUTH_DATABASE_URL=$DB_URL_REF" \
  --set "AUTH_COOKIE_NAME=session" \
  --set "AUTH_COOKIE_DOMAIN=$COOKIE_DOMAIN" \
  --set "PORT=3101" \
  --set "PUBLIC_API_URL=$API_INTERNAL_URL"
# ^ PUBLIC_API_URL is bootstrapped to the internal URL so SSR fetches work
#   immediately. Update it to https://api.city.oniondao.dev once DNS is live
#   so the browser-side fetches also resolve.

# ---- deploy -----------------------------------------------------------------

deploy() {
  local service="$1"
  echo "▶ deploying $service (detached — check logs in dashboard)"
  railway up --service "$service" --detach
}

deploy inference
deploy api
deploy tick
deploy webapp

# ---- domains ----------------------------------------------------------------

echo "▶ generating Railway domains (api + webapp only; tick/inference stay internal)"
railway domain --service api    || true
railway domain --service webapp || true

# ---- migrations -------------------------------------------------------------

echo
read -r -p "Run nullv2 migrations + flagship seed now via the api service? [y/N] " do_mig
if [[ "$do_mig" =~ ^[Yy]$ ]]; then
  # Migrations must be generated + committed before deploy. Bail early with
  # actionable instructions if the migrations dir is empty.
  if [ ! -f packages/db/migrations/meta/_journal.json ]; then
    cat >&2 <<EOF
❌ No generated drizzle migrations found at packages/db/migrations/.
   These need to be generated locally and committed before deploying.

   Run:
     DATABASE_URL='postgresql://dummy@localhost/dummy' \\
       bun run --filter @nullv2/db generate
     git add packages/db/migrations
     git commit -m 'generate initial drizzle migrations'

   Then re-run just the migration step:
     railway run --service api bun run db:migrate
     railway run --service api bun run db:seed
EOF
    exit 1
  fi
  # Fetch Postgres's public proxy URL via api's resolved env. `railway run`
  # injects api's vars but executes locally, so we can't use the internal URL
  # — pull DATABASE_PUBLIC_URL (set above) and use that.
  echo "▶ fetching DATABASE_PUBLIC_URL via api service"
  PUBLIC_DB_URL=$(railway run --service api printenv DATABASE_PUBLIC_URL 2>/dev/null | tail -1)
  if [ -z "$PUBLIC_DB_URL" ] || [[ "$PUBLIC_DB_URL" == *railway.internal* ]]; then
    cat >&2 <<EOF
❌ Couldn't fetch a usable DATABASE_PUBLIC_URL from the api service.
   The Postgres service may not expose DATABASE_PUBLIC_URL by default.
   Find a public URL in the Railway dashboard (Postgres → Variables) and run:
     DATABASE_URL='<paste-public-url>' bun run --filter @nullv2/db migrate
     DATABASE_URL='<paste-public-url>' bun run --filter @nullv2/db seed
EOF
    exit 1
  fi

  echo "▶ running db:migrate (via public proxy URL)"
  DATABASE_URL="$PUBLIC_DB_URL" bun run --filter @nullv2/db migrate
  echo "▶ running db:seed"
  DATABASE_URL="$PUBLIC_DB_URL" bun run --filter @nullv2/db seed
else
  echo "Skipped. Run later with the public DB URL (railway run can't reach"
  echo "*.railway.internal from your laptop):"
  echo "    PUBLIC_DB_URL=\$(railway run --service api printenv DATABASE_PUBLIC_URL | tail -1)"
  echo "    DATABASE_URL=\"\$PUBLIC_DB_URL\" bun run --filter @nullv2/db migrate"
  echo "    DATABASE_URL=\"\$PUBLIC_DB_URL\" bun run --filter @nullv2/db seed"
fi

# ---- next steps -------------------------------------------------------------

cat <<EOF

✅ deploy kicked off. What's next:

1. Watch builds in the Railway dashboard — first builds take a few minutes.

2. ⚠  Set AUTH_COOKIE_DOMAIN on landing-2026's own webapp service so it
   issues cookies that nullv2 can read:
     railway variables --service <landing-2026-service-name> \\
       --set 'AUTH_COOKIE_DOMAIN=.oniondao.dev'
   Then redeploy landing-2026 so the new cookie options take effect.

3. Attach custom domains in the Railway dashboard (Settings → Networking):
     webapp  →  city.oniondao.dev
     api     →  api.city.oniondao.dev
   Then add the printed CNAMEs at your DNS provider.

4. Once api.city.oniondao.dev is live, repoint webapp's PUBLIC_API_URL:
     railway variables --service webapp \\
       --set 'PUBLIC_API_URL=https://api.city.oniondao.dev'
   (and redeploy webapp so SSR picks it up:  railway up --service webapp --detach)

5. Verify the cookie:
     - Log in via oniondao.dev, then check the cookie has Domain=.oniondao.dev
     - GET https://api.city.oniondao.dev/v1/me with that cookie should return your user

EOF
