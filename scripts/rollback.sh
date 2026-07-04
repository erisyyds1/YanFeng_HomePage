#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REVISION=""
SERVICES_VALUE="${ROLLBACK_SERVICES:-api web}"
SKIP_BUILD=0
SKIP_HEALTH_CHECK=0
ALLOW_DIRTY=0
COMPOSE_FILES=("$ROOT_DIR/docker-compose.yml" "$ROOT_DIR/docker-compose.2c2g.yml")

usage() {
  cat <<'USAGE'
Usage: scripts/rollback.sh [options]

Rollback Docker Compose services to a previous Git revision.

Options:
  --revision SHA        Revision to rollback to. Default: .deploy/previous_revision
  --services "LIST"     Compose services to rebuild/restart. Default: "api web"
  --compose-file PATH   Add a compose file. Can be repeated. Overrides defaults on first use.
  --no-build            Do not rebuild images
  --no-health-check     Skip HTTP health checks
  --allow-dirty         Allow tracked local changes
  -h, --help            Show this help

Environment:
  ROLLBACK_SERVICES     Same as --services
USAGE
}

custom_compose_files=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --revision)
      REVISION="$2"
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

if [ "$ALLOW_DIRTY" -eq 0 ] && { ! git diff --quiet || ! git diff --cached --quiet; }; then
  echo "tracked working tree changes detected; commit/stash them or pass --allow-dirty" >&2
  git status --short
  exit 1
fi

if [ -z "$REVISION" ]; then
  if [ ! -f "$ROOT_DIR/.deploy/previous_revision" ]; then
    echo "no rollback revision found; pass --revision SHA" >&2
    exit 1
  fi
  REVISION="$(tr -d '[:space:]' < "$ROOT_DIR/.deploy/previous_revision")"
fi

target_revision="$(git rev-parse --verify "$REVISION^{commit}")"
current_revision="$(git rev-parse HEAD)"

mkdir -p "$ROOT_DIR/.deploy"
echo "$current_revision" > "$ROOT_DIR/.deploy/rollback_from_revision"
echo "$target_revision" > "$ROOT_DIR/.deploy/current_revision"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$ROOT_DIR/.deploy/rolled_back_at"

git checkout --detach "$target_revision"

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

echo "rolled back from: $current_revision"
echo "rolled back to:   $target_revision"
echo "to resume normal deployment, run: scripts/deploy.sh --branch cyan_opt"
