#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

usage() {
  cat <<'USAGE'
Usage: scripts/configure-we-mp-rss-env.sh [--env-file PATH] [--yes]

Detect the current machine architecture and write local we-mp-rss build
settings into the env file used by docker compose.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --yes)
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

machine="${WE_MP_RSS_UNAME_M:-$(uname -m)}"
case "$machine" in
  arm64|aarch64)
    runtime_arch="arm64"
    ;;
  x86_64|amd64)
    runtime_arch="amd64"
    ;;
  *)
    echo "unsupported machine architecture: $machine" >&2
    exit 1
    ;;
esac

mkdir -p "$(dirname "$ENV_FILE")"
touch "$ENV_FILE"

remove_key() {
  local key="$1"
  if grep -q "^${key}=" "$ENV_FILE"; then
    tmp="$(mktemp)"
    grep -v "^${key}=" "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  fi
}

upsert_key() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    tmp="$(mktemp)"
    sed "s|^${key}=.*|${key}=${value}|" "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

remove_key "WE_MP_RSS_IMAGE"
upsert_key "WE_MP_RSS_RUNTIME_ARCH" "$runtime_arch"
upsert_key "WE_MP_RSS_LOCAL_IMAGE" "yanfeng-homepage/we-mp-rss:${runtime_arch}"
upsert_key "WE_MP_RSS_BROWSER_TYPE" "chromium"
upsert_key "WE_MP_RSS_HEADLESS" "true"
upsert_key "WE_MP_RSS_AUTH_WEB" "False"
upsert_key "WE_MP_RSS_PAGE_SIZE" "100"
upsert_key "WE_MP_RSS_BIND" "127.0.0.1"
upsert_key "WE_MP_RSS_PORT" "8001"
upsert_key "WE_MP_RSS_SHM_SIZE" "1gb"

echo "Configured we-mp-rss for ${runtime_arch}:"
echo "  env file: $ENV_FILE"
echo "  image: yanfeng-homepage/we-mp-rss:${runtime_arch}"
echo "  browser: chromium"
