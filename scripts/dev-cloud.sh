#!/usr/bin/env bash
# Run nullv2 services locally against the Railway (prod) Postgres for BOTH
# game data and auth/sessions. Lets you log in with your real oniondao.dev
# account: copy the `session` cookie from oniondao.dev devtools and paste it
# at localhost.
#
#   DATABASE_URL       → Railway Postgres (humans, residents, inventory, ...)
#   AUTH_DATABASE_URL  → Railway Postgres (users, sessions — landing-2026's)
#
# Why no migrations: DATABASE_URL points at prod — running `db:migrate` from
# here would migrate prod. Use scripts/deploy-railway.sh for that.
#
# Usage:
#   ./scripts/dev-cloud.sh
#   RAILWAY_DATABASE_URL='postgresql://...' ./scripts/dev-cloud.sh   # skip railway CLI hop

set -euo pipefail
cd "$(dirname "$0")/.."

# ---- env --------------------------------------------------------------------

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# ---- preflight --------------------------------------------------------------

command -v bun >/dev/null 2>&1 || { echo "❌ bun not installed" >&2; exit 1; }

# ---- resolve Railway DATABASE_URL ------------------------------------------

if [ -n "${RAILWAY_DATABASE_URL:-}" ]; then
  CLOUD_DB_URL="$RAILWAY_DATABASE_URL"
  echo "▶ using RAILWAY_DATABASE_URL from env"
else
  command -v railway >/dev/null 2>&1 || {
    echo "❌ railway CLI not installed and no RAILWAY_DATABASE_URL set." >&2
    echo "   Install: https://docs.railway.com/guides/cli" >&2
    echo "   Or set RAILWAY_DATABASE_URL='postgresql://...' in .env" >&2
    exit 1
  }
  railway whoami >/dev/null 2>&1 || { echo "❌ run: railway login" >&2; exit 1; }
  railway status >/dev/null 2>&1 || {
    echo "❌ no Railway project linked. Run: railway link" >&2
    exit 1
  }
  echo "▶ fetching DATABASE_PUBLIC_URL from Railway api service"
  CLOUD_DB_URL=$(railway run --service api printenv DATABASE_PUBLIC_URL 2>/dev/null | tail -1)
  if [ -z "$CLOUD_DB_URL" ] || [[ "$CLOUD_DB_URL" == *railway.internal* ]]; then
    echo "❌ couldn't fetch a usable DATABASE_PUBLIC_URL." >&2
    echo "   Grab it from Railway dashboard (Postgres → Variables) and set:" >&2
    echo "     RAILWAY_DATABASE_URL='postgresql://...' ./scripts/dev-cloud.sh" >&2
    exit 1
  fi
fi

SAFE_CLOUD_URL=$(echo "$CLOUD_DB_URL" | sed -E 's|//[^@]+@|//***@|')
echo "  ✓ cloud DB: $SAFE_CLOUD_URL"

# ---- export overrides + launch ---------------------------------------------

export DATABASE_URL="$CLOUD_DB_URL"
export AUTH_DATABASE_URL="$CLOUD_DB_URL"
export AUTH_COOKIE_NAME="${AUTH_COOKIE_NAME:-session}"
# Empty cookie domain so any new cookies the local services set are scoped to
# localhost. The session lookup itself is by token value, not domain — so a
# real oniondao.dev cookie pasted at localhost still resolves correctly.
export AUTH_COOKIE_DOMAIN=""

API_PORT="${API_PORT:-3100}"
WEBAPP_PORT="${WEBAPP_PORT:-3101}"
INFERENCE_PORT="${INFERENCE_PORT:-3102}"

# Track child PIDs so a single Ctrl-C tears the whole stack down.
PIDS=()
cleanup() {
  echo
  echo "▶ stopping services"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

start() {
  local label="$1" cmd="$2"
  echo "▶ starting $label"
  ( eval "$cmd" 2>&1 | sed -u "s/^/[$label] /" ) &
  PIDS+=($!)
}

start api       "bun run dev:api"
start inference "bun run dev:inference"
start tick      "bun run dev:tick"
start web       "bun run dev:web"

cat <<EOF

✅ services launched. Ctrl-C to stop everything.

   API       http://localhost:${API_PORT}
   webapp    http://localhost:${WEBAPP_PORT}
   inference http://localhost:${INFERENCE_PORT}

═══ log in with your oniondao.dev account ═══

  The 'session' cookie on oniondao.dev is HttpOnly — JS can't read it, so
  you have to grab it from devtools once. Takes ~10 seconds:

  1. Open https://oniondao.dev (logged in).
  2. DevTools → Application (Chrome) or Storage (Firefox) → Cookies
     → https://oniondao.dev → click the 'session' row → copy the Value.
  3. Open this URL (replace <PASTE>):

       http://localhost:${WEBAPP_PORT}/dev-login#session=<PASTE>

  The /dev-login route sets the cookie and redirects you to / signed in.
  Good for 30 days.

EOF

wait
