#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$ROOT_DIR}"
BACKUP_DIR_VALUE="${BACKUP_DIR:-/var/backups/yanfeng-homepage/db}"
RETENTION="${BACKUP_RETENTION:-2}"
SCHEDULE="${BACKUP_CRON_SCHEDULE:-17 3 * * *}"
CRON_FILE="${CRON_FILE:-/etc/cron.d/yanfeng-homepage-db-backup}"
LOG_FILE="${LOG_FILE:-/var/log/yanfeng-homepage-db-backup.log}"

usage() {
  cat <<'USAGE'
Usage: scripts/install-db-backup-cron.sh [options]

Install a cron job for daily DB backups.

Options:
  --project-dir PATH    Project directory on the server
  --backup-dir PATH     Backup archive directory. Default: /var/backups/yanfeng-homepage/db
  --retention N         Keep latest N backup archives. Default: 2
  --schedule "CRON"     Cron schedule. Default: "17 3 * * *"
  --cron-file PATH      Cron file path. Default: /etc/cron.d/yanfeng-homepage-db-backup
  --log-file PATH       Cron log file. Default: /var/log/yanfeng-homepage-db-backup.log
  -h, --help            Show this help

Environment:
  PROJECT_DIR
  BACKUP_DIR
  BACKUP_RETENTION
  BACKUP_CRON_SCHEDULE
  CRON_FILE
  LOG_FILE
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project-dir)
      PROJECT_DIR="$2"
      shift 2
      ;;
    --backup-dir)
      BACKUP_DIR_VALUE="$2"
      shift 2
      ;;
    --retention)
      RETENTION="$2"
      shift 2
      ;;
    --schedule)
      SCHEDULE="$2"
      shift 2
      ;;
    --cron-file)
      CRON_FILE="$2"
      shift 2
      ;;
    --log-file)
      LOG_FILE="$2"
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

if [ "$(id -u)" -ne 0 ]; then
  echo "this installer must run as root because it writes $CRON_FILE" >&2
  exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
  echo "project dir not found: $PROJECT_DIR" >&2
  exit 1
fi

if [ ! -f "$PROJECT_DIR/scripts/backup-db.sh" ]; then
  echo "backup script not found: $PROJECT_DIR/scripts/backup-db.sh" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR_VALUE" "$(dirname "$LOG_FILE")" "$(dirname "$CRON_FILE")"
chmod +x "$PROJECT_DIR/scripts/backup-db.sh"
touch "$LOG_FILE"

cat > "$CRON_FILE" <<CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

$SCHEDULE root cd "$PROJECT_DIR" && BACKUP_DIR="$BACKUP_DIR_VALUE" BACKUP_RETENTION="$RETENTION" bash scripts/backup-db.sh >> "$LOG_FILE" 2>&1
CRON

chmod 0644 "$CRON_FILE"

echo "installed cron: $CRON_FILE"
echo "schedule: $SCHEDULE"
echo "backup dir: $BACKUP_DIR_VALUE"
echo "retention: $RETENTION"
echo "log file: $LOG_FILE"
