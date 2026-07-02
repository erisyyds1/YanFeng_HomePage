#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${TLS_DOMAIN:-yanfeng.club}"
EXTRA_DOMAINS_VALUE="${LETSENCRYPT_EXTRA_DOMAINS:-www.yanfeng.club}"
EMAIL="${LETSENCRYPT_EMAIL:-}"
LETSENCRYPT_DIR_VALUE="${LETSENCRYPT_DIR:-/etc/letsencrypt}"
CERTBOT_WEBROOT_VALUE="${CERTBOT_WEBROOT:-/var/www/certbot}"
CRON_FILE="${LETSENCRYPT_CRON_FILE:-/etc/cron.d/yanfeng-homepage-letsencrypt}"
LOG_FILE="${LETSENCRYPT_LOG_FILE:-/var/log/yanfeng-homepage-letsencrypt.log}"
SCHEDULE="${LETSENCRYPT_RENEW_SCHEDULE:-23 4 * * *}"
STAGING=0
FORCE_RENEWAL=0
SKIP_CHALLENGE_CHECK=0
COMPOSE_FILES=("$ROOT_DIR/docker-compose.yml" "$ROOT_DIR/docker-compose.2c2g.yml")

usage() {
  cat <<'USAGE'
Usage: scripts/install-letsencrypt.sh [options]

Issue a free Let's Encrypt certificate for the Docker Nginx origin and install
a daily renewal cron job.

Options:
  --domain NAME              Primary domain. Default: yanfeng.club
  --extra-domains LIST       Comma-separated extra domains. Default: www.yanfeng.club
  --email EMAIL              Let's Encrypt registration email. Optional
  --letsencrypt-dir PATH     Host directory mounted to /etc/letsencrypt
  --webroot PATH             Host directory mounted to /var/www/certbot
  --compose-file PATH        Add a compose file. Can be repeated. Overrides defaults on first use
  --staging                  Use Let's Encrypt staging environment
  --force-renewal            Force certificate issuance even when an existing cert is valid
  --skip-challenge-check     Skip preflight HTTP challenge reachability check
  -h, --help                 Show this help

Cloudflare note:
  HTTP-01 validation must be reachable at:
    http://<domain>/.well-known/acme-challenge/<token>
  If Cloudflare redirects HTTP to HTTPS while the origin has no valid cert yet,
  temporarily disable "Always Use HTTPS" or set DNS record to DNS only during issuance.
USAGE
}

custom_compose_files=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --extra-domains)
      EXTRA_DOMAINS_VALUE="$2"
      shift 2
      ;;
    --email)
      EMAIL="$2"
      shift 2
      ;;
    --letsencrypt-dir)
      LETSENCRYPT_DIR_VALUE="$2"
      shift 2
      ;;
    --webroot)
      CERTBOT_WEBROOT_VALUE="$2"
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
    --staging)
      STAGING=1
      shift
      ;;
    --force-renewal)
      FORCE_RENEWAL=1
      shift
      ;;
    --skip-challenge-check)
      SKIP_CHALLENGE_CHECK=1
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

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  if grep -q "^${key}=" .env; then
    sed "s|^${key}=.*|${key}=${value}|" .env > "$tmp"
  else
    cat .env > "$tmp"
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi
  mv "$tmp" .env
}

upsert_env "HTTPS_PORT" "443"
upsert_env "TLS_DOMAIN" "$DOMAIN"
upsert_env "LETSENCRYPT_DIR" "$LETSENCRYPT_DIR_VALUE"
upsert_env "CERTBOT_WEBROOT" "$CERTBOT_WEBROOT_VALUE"

mkdir -p "$LETSENCRYPT_DIR_VALUE" "$CERTBOT_WEBROOT_VALUE" "$(dirname "$CRON_FILE")" "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

compose=(docker compose)
for compose_file in "${COMPOSE_FILES[@]}"; do
  compose+=(-f "$compose_file")
done

echo "starting web with ACME challenge support..."
"${compose[@]}" up -d --build web

if [ "$SKIP_CHALLENGE_CHECK" -eq 0 ]; then
  token="preflight-$(date +%s)"
  mkdir -p "$CERTBOT_WEBROOT_VALUE/.well-known/acme-challenge"
  printf 'ok\n' > "$CERTBOT_WEBROOT_VALUE/.well-known/acme-challenge/$token"
  if ! curl -fsSL --max-time 20 "http://${DOMAIN}/.well-known/acme-challenge/${token}" | grep -q '^ok$'; then
    rm -f "$CERTBOT_WEBROOT_VALUE/.well-known/acme-challenge/$token"
    cat >&2 <<ERROR
ACME HTTP-01 preflight failed.

Please check:
1. DNS for ${DOMAIN} points to this server or Cloudflare proxy can reach it.
2. Alibaba Cloud security group allows port 80 and 443.
3. If Cloudflare is enabled, temporarily disable "Always Use HTTPS" before the first issuance,
   or set the DNS record to DNS only until the certificate is issued.

Then rerun this script.
ERROR
    exit 1
  fi
  rm -f "$CERTBOT_WEBROOT_VALUE/.well-known/acme-challenge/$token"
fi

placeholder_live_dir="$LETSENCRYPT_DIR_VALUE/live/$DOMAIN"
managed_renewal_conf="$LETSENCRYPT_DIR_VALUE/renewal/$DOMAIN.conf"
if [ -f "$managed_renewal_conf" ] && ! grep -q '^fullchain =' "$managed_renewal_conf"; then
  echo "removing invalid renewal config before Let's Encrypt issuance..."
  rm -f "$managed_renewal_conf"
fi
if [ -d "$placeholder_live_dir" ] && { [ ! -f "$managed_renewal_conf" ] || ! grep -q '^fullchain =' "$managed_renewal_conf"; }; then
  echo "removing temporary placeholder certificate before Let's Encrypt issuance..."
  rm -rf "$placeholder_live_dir"
fi

certbot_args=(certonly --webroot -w /var/www/certbot --cert-name "$DOMAIN" --agree-tos --non-interactive --keep-until-expiring)
if [ "$STAGING" -eq 1 ]; then
  certbot_args+=(--staging)
fi
if [ "$FORCE_RENEWAL" -eq 1 ]; then
  certbot_args+=(--force-renewal)
fi
if [ -n "$EMAIL" ]; then
  certbot_args+=(--email "$EMAIL")
else
  certbot_args+=(--register-unsafely-without-email)
fi
certbot_args+=(-d "$DOMAIN")

IFS=',' read -r -a extra_domains <<< "$EXTRA_DOMAINS_VALUE"
for extra_domain in "${extra_domains[@]}"; do
  extra_domain="$(echo "$extra_domain" | xargs)"
  if [ -n "$extra_domain" ] && [ "$extra_domain" != "$DOMAIN" ]; then
    certbot_args+=(-d "$extra_domain")
  fi
done

docker run --rm \
  -v "$LETSENCRYPT_DIR_VALUE:/etc/letsencrypt" \
  -v "$CERTBOT_WEBROOT_VALUE:/var/www/certbot" \
  certbot/certbot:latest "${certbot_args[@]}"

"${compose[@]}" up -d --build web

cat > "$CRON_FILE" <<CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

$SCHEDULE root cd "$ROOT_DIR" && { docker run --rm -v "$LETSENCRYPT_DIR_VALUE:/etc/letsencrypt" -v "$CERTBOT_WEBROOT_VALUE:/var/www/certbot" certbot/certbot:latest renew --webroot -w /var/www/certbot --quiet && docker compose -f docker-compose.yml -f docker-compose.2c2g.yml restart web; } >> "$LOG_FILE" 2>&1
CRON
chmod 0644 "$CRON_FILE"

curl -k -fsS -I "https://127.0.0.1" >/dev/null
echo "Let's Encrypt certificate installed for ${DOMAIN}."
echo "cron installed: $CRON_FILE"
echo "Now set Cloudflare SSL/TLS mode to Full (strict)."
