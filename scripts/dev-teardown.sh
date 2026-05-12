#!/usr/bin/env bash
# Stop Postgres and delete the local data volume. Destructive — wipes dev DB.
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose down -v
rm -rf postgres-data
echo "✅ dev environment torn down"
