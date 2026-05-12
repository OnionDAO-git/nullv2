#!/usr/bin/env bash
# Mint a fake session for local API testing.
#
# Usage: ./scripts/dev-fake-session.sh you@example.com "Your Name"
# Prints a curl command you can paste to hit /v1/me as that user.

set -euo pipefail
cd "$(dirname "$0")/.."

EMAIL="${1:-test@nullv2.dev}"
NAME="${2:-Test Visitor}"
TOKEN="$(openssl rand -hex 32)"

docker compose exec -T postgres psql -U nullv2 -d nullv2 <<SQL >/dev/null
INSERT INTO users (email, name) VALUES ('${EMAIL}', '${NAME}')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO sessions (user_id, token, expires_at)
SELECT id, '${TOKEN}', now() + interval '30 days' FROM users WHERE email = '${EMAIL}';
SQL

echo "Session minted for ${EMAIL}."
echo
echo "Test it:"
echo "  curl -H 'Cookie: session=${TOKEN}' http://localhost:${API_PORT:-3100}/v1/me"
