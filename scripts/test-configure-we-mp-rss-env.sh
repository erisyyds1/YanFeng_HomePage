#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/configure-we-mp-rss-env.sh"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

assert_contains() {
  local file="$1"
  local expected="$2"
  if ! grep -Fq "$expected" "$file"; then
    echo "expected '$expected' in $file" >&2
    echo "--- file content ---" >&2
    cat "$file" >&2
    exit 1
  fi
}

arm_env="$tmpdir/arm.env"
WE_MP_RSS_UNAME_M=arm64 "$SCRIPT" --env-file "$arm_env" --yes >/dev/null
assert_contains "$arm_env" "WE_MP_RSS_LOCAL_IMAGE=yanfeng-homepage/we-mp-rss:arm64"
assert_contains "$arm_env" "WE_MP_RSS_BROWSER_TYPE=chromium"
assert_contains "$arm_env" "WE_MP_RSS_AUTH_WEB=False"
assert_contains "$arm_env" "WE_MP_RSS_PAGE_SIZE=100"

amd_env="$tmpdir/amd.env"
WE_MP_RSS_UNAME_M=x86_64 "$SCRIPT" --env-file "$amd_env" --yes >/dev/null
assert_contains "$amd_env" "WE_MP_RSS_LOCAL_IMAGE=yanfeng-homepage/we-mp-rss:amd64"
assert_contains "$amd_env" "WE_MP_RSS_BROWSER_TYPE=chromium"
assert_contains "$amd_env" "WE_MP_RSS_AUTH_WEB=False"
assert_contains "$amd_env" "WE_MP_RSS_PAGE_SIZE=100"

echo "configure-we-mp-rss-env tests passed"
