#!/usr/bin/env bash
# Runs on the VPS: switch to a commit, rebuild the stack, roll back if it never gets healthy.
set -euo pipefail

TARGET_SHA="${1:?usage: deploy.sh <commit-sha>}"
APP_DIR="${APP_DIR:-/opt/quizloom}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
HEALTH_ATTEMPTS=30
HEALTH_DELAY_SECONDS=5

cd "$APP_DIR"
PREVIOUS_SHA="$(git rev-parse HEAD)"

# reset --hard is safe: .env.production files are gitignored and stay on the host.
start_stack() {
  git reset --hard "$1"
  docker compose up -d --build --remove-orphans
}

is_stack_healthy() {
  local path
  for path in /api/health /api/auth/ready /api/questionbank/ready /api/quiz/ready \
              /api/analytics/ready /api/exam/ready; do
    curl -fsS --max-time 5 "${GATEWAY_URL}${path}" >/dev/null 2>&1 || return 1
  done
}

wait_for_health() {
  local attempt
  for attempt in $(seq 1 "$HEALTH_ATTEMPTS"); do
    is_stack_healthy && return 0
    sleep "$HEALTH_DELAY_SECONDS"
  done
  return 1
}

echo "==> deploying ${TARGET_SHA} (current ${PREVIOUS_SHA})"
git fetch --prune origin
start_stack "$TARGET_SHA"

if wait_for_health; then
  echo "==> healthy on ${TARGET_SHA}"
  docker image prune -f >/dev/null
  exit 0
fi

echo "health check failed on ${TARGET_SHA}; rolling back to ${PREVIOUS_SHA}" >&2
docker compose logs --tail=50 >&2
start_stack "$PREVIOUS_SHA"
wait_for_health || echo "rollback is unhealthy too; this host needs a look" >&2
exit 1
