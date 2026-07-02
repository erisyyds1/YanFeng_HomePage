FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/40-ensure-letsencrypt-placeholder.sh /docker-entrypoint.d/40-ensure-letsencrypt-placeholder.sh
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
