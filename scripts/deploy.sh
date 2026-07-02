#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${DEPLOY_BRANCH:-cyan_opt}"
SERVICES_VALUE="${DEPLOY_SERVICES:-api web}"
SKIP_PULL=0
SKIP_BUILD=0
SKIP_HEALTH_CHECK=0
ALLOW_DIRTY=0
COMPOSE_FILES=("$ROOT_DIR/docker-compose.yml" "$ROOT_DIR/docker-compose.2c2g.yml")

usage() {
  cat <<'USAGE'
Usage: scripts/deploy.sh [options]

Deploy the project from Git and restart Docker Compose services.

Options:
  --branch NAME          Git branch to deploy. Default: cyan_opt
  --services "LIST"      Compose services to rebuild/restart. Default: "api web"
  --compose-file PATH    Add a compose file. Can be repeated. Overrides defaults on first use.
  --no-pull              Do not fetch/pull Git changes
  --no-build             Do not rebuild images
  --no-health-check      Skip HTTP health checks
  --allow-dirty          Allow tracked local changes
  -h, --help             Show this help

Environment:
  DEPLOY_BRANCH          Same as --branch
  DEPLOY_SERVICES        Same as --services
USAGE
}

custom_compose_files=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --services)
      SERVICES_VALUE="$2"
      shift 2
      ;;
    --compose-file)
      if [ "$custom_compose_files" -eq 0 ]; then
        COMPOSE_FILES=()
        custom_compose_files=1
      fi
      COMPOSE_FILES+=("$2")
      shift 2
      ;;
    --no-pull)
      SKIP_PULL=1
      shift
      ;;
    --no-build)
      SKIP_BUILD=1
      shift
      ;;
    --no-health-check)
      SKIP_HEALTH_CHECK=1
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo ".env is required. Copy .env.example and fill production values first." >&2
  exit 1
fi

if [ "$ALLOW_DIRTY" -eq 0 ] && { ! git diff --quiet || ! git diff --cached --quiet; }; then
  echo "tracked working tree changes detected; commit/stash them or pass --allow-dirty" >&2
  git status --short
  exit 1
fi

mkdir -p "$ROOT_DIR/.deploy"
before_revision="$(git rev-parse HEAD)"

if [ "$SKIP_PULL" -eq 0 ]; then
  git fetch origin "$BRANCH"
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -B "$BRANCH" "origin/$BRANCH"
  fi
  git pull --ff-only origin "$BRANCH"
fi

after_revision="$(git rev-parse HEAD)"
echo "$before_revision" > "$ROOT_DIR/.deploy/previous_revision"
echo "$after_revision" > "$ROOT_DIR/.deploy/current_revision"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$ROOT_DIR/.deploy/deployed_at"

compose=(docker compose)
for compose_file in "${COMPOSE_FILES[@]}"; do
  compose+=(-f "$compose_file")
done

read -r -a services <<< "$SERVICES_VALUE"
if [ "${#services[@]}" -eq 0 ]; then
  echo "at least one service is required" >&2
  exit 1
fi

if [ "$SKIP_BUILD" -eq 0 ]; then
  "${compose[@]}" build "${services[@]}"
fi

"${compose[@]}" up -d "${services[@]}"
"${compose[@]}" ps

if [ "$SKIP_HEALTH_CHECK" -eq 0 ]; then
  curl -fsS http://127.0.0.1/api/site-settings >/dev/null
  curl -fsS http://127.0.0.1/ >/dev/null
fi

echo "deployed revision: $after_revision"
echo "previous revision: $before_revision"
