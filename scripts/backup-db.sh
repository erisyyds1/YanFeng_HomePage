#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="${PROJECT_NAME:-yanfeng_homepage}"
RETENTION="${BACKUP_RETENTION:-2}"
COMPOSE_FILES=("$ROOT_DIR/docker-compose.yml" "$ROOT_DIR/docker-compose.2c2g.yml")

if [ -n "${BACKUP_DIR:-}" ]; then
  BACKUP_TARGET_DIR="$BACKUP_DIR"
elif [ "$(id -u)" -eq 0 ]; then
  BACKUP_TARGET_DIR="/var/backups/yanfeng-homepage/db"
else
  BACKUP_TARGET_DIR="$ROOT_DIR/backups/db"
fi

usage() {
  cat <<'USAGE'
Usage: scripts/backup-db.sh [options]

Create one compressed DB backup archive. The archive contains:
  - mysql.sql: dump from the MySQL container
  - we-mp-rss.db: SQLite database copied from we-mp-rss when available
  - manifest.txt: backup metadata

Options:
  --backup-dir PATH    Directory for backup archives
  --retention N        Keep latest N backup archives. Default: 2
  --compose-file PATH  Add a compose file. Can be repeated. Overrides defaults on first use.
  -h, --help           Show this help

Environment:
  BACKUP_DIR           Same as --backup-dir
  BACKUP_RETENTION     Same as --retention
USAGE
}

custom_compose_files=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --backup-dir)
      BACKUP_TARGET_DIR="$2"
      shift 2
      ;;
    --retention)
      RETENTION="$2"
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

case "$RETENTION" in
  ''|*[!0-9]*)
    echo "--retention must be a positive integer" >&2
    exit 1
    ;;
esac
if [ "$RETENTION" -lt 1 ]; then
  echo "--retention must be greater than 0" >&2
  exit 1
fi

cd "$ROOT_DIR"

compose=(docker compose)
for compose_file in "${COMPOSE_FILES[@]}"; do
  compose+=(-f "$compose_file")
done

mkdir -p "$BACKUP_TARGET_DIR"
tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

timestamp="$(date +"%Y%m%d_%H%M%S")"
backup_file="$BACKUP_TARGET_DIR/${PROJECT_NAME}_db_${timestamp}.tar.gz"

echo "dumping MySQL database..."
"${compose[@]}" exec -T mysql sh -lc 'mysqldump --single-transaction --quick --default-character-set=utf8mb4 --no-tablespaces -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > "$tmp_dir/mysql.sql"

we_container="$("${compose[@]}" ps -q we-mp-rss 2>/dev/null || true)"
if [ -n "$we_container" ]; then
  echo "copying we-mp-rss SQLite database..."
  if ! docker cp "$we_container:/app/data/db.db" "$tmp_dir/we-mp-rss.db" 2>/dev/null; then
    echo "warning: failed to copy we-mp-rss SQLite database; continuing with MySQL dump only" >&2
  fi
fi

{
  echo "project=$PROJECT_NAME"
  echo "created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "git_revision=$(git rev-parse HEAD 2>/dev/null || true)"
  echo "backup_file=$backup_file"
  echo "compose_files=${COMPOSE_FILES[*]}"
} > "$tmp_dir/manifest.txt"

tar -czf "$backup_file" -C "$tmp_dir" .

count=0
find "$BACKUP_TARGET_DIR" -maxdepth 1 -type f -name "${PROJECT_NAME}_db_*.tar.gz" | sort -r | while IFS= read -r file; do
  count=$((count + 1))
  if [ "$count" -gt "$RETENTION" ]; then
    rm -f "$file"
    echo "removed old backup: $file"
  fi
done

echo "backup created: $backup_file"
