#!/bin/sh
set -eu

domain="${TLS_DOMAIN:-yanfeng.club}"
cert_dir="/etc/letsencrypt/live/${domain}"
fullchain="${cert_dir}/fullchain.pem"
privkey="${cert_dir}/privkey.pem"
chain="${cert_dir}/chain.pem"

if [ -s "$fullchain" ] && [ -s "$privkey" ] && [ -s "$chain" ]; then
  exit 0
fi

mkdir -p "$cert_dir"
echo "creating temporary self-signed certificate for ${domain}; replace it with Let's Encrypt before enabling Full (strict)"
openssl req -x509 -nodes -newkey rsa:2048 -days 3 \
  -keyout "$privkey" \
  -out "$fullchain" \
  -subj "/CN=${domain}" >/dev/null 2>&1
cp "$fullchain" "$chain"
chmod 0600 "$privkey"
chmod 0644 "$fullchain" "$chain"
