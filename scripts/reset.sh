#!/usr/bin/env bash
# Rebuild and restart the whole stack from a clean state. Use after migration or
# event-schema changes. Flushes Redis so consumer groups and streams re-bootstrap.
#
# Usage:
#   scripts/reset.sh            rebuild images, recreate containers, flush Redis
#   scripts/reset.sh --no-build skip image rebuild (just recreate + flush)
#   scripts/reset.sh --hard     also drop dangling images/build cache
set -euo pipefail

cd "$(dirname "$0")/.."

# reset is a local action, so it targets the dev overlay and .env.local
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.dev.yml"

BUILD=1
HARD=0
for arg in "$@"; do
  case "$arg" in
    --no-build) BUILD=0 ;;
    --hard) HARD=1 ;;
    *) echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done

echo "==> stopping stack"
$COMPOSE down

if [ "$HARD" -eq 1 ]; then
  echo "==> pruning build cache"
  docker builder prune -f
fi

if [ "$BUILD" -eq 1 ]; then
  echo "==> building images"
  $COMPOSE build
fi

echo "==> starting stack"
$COMPOSE up -d

echo "==> flushing Redis (resets streams + consumer groups)"
docker exec quizloom-redis redis-cli FLUSHALL

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
echo "==> waiting for gateway at ${GATEWAY_URL}/api/health"
for _ in $(seq 1 30); do
  if curl -fsS "${GATEWAY_URL}/api/health" >/dev/null 2>&1; then
    echo "==> stack is up. Run the smoke checklist: tests/SMOKE_CHECKLIST.md"
    exit 0
  fi
  sleep 2
done

echo "gateway did not become healthy in time; check '$COMPOSE logs'" >&2
exit 1
