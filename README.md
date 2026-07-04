# YanFeng Club Portal

檐枫动漫社门户原型，包含资讯列表、社团历史、活动录像和 AI 助手。

## 项目结构

```text
.
├── frontend/          # React + Vite 前端
├── backend/           # Go + Gin + GORM API
├── deploy/            # Nginx、MySQL 等部署配置
├── third_party/        # 第三方源码，we-mp-rss 从源码构建
├── public/uploads/    # 本地上传目录占位，Docker 中由 uploads-data 卷挂载
├── docker-compose.yml
└── .env.example
```

## 本地启动

安装前端依赖：

```bash
cd frontend && npm install
```

启动 Go API：

```bash
npm run dev:api
```

启动前端：

```bash
npm run dev:frontend
```

默认地址：

- 前端：`http://localhost:3000`
- API：`http://localhost:3001`

如果 `3000` 端口不可用：

```bash
npm run dev:frontend -- --port 5173
```

## Docker Compose 部署

复制配置：

```bash
cp .env.example .env
```

启动前端、后端、MySQL 和 `we-mp-rss`：

```bash
scripts/configure-we-mp-rss-env.sh --yes
docker compose up -d --build
```

`we-mp-rss` 不拉取上游发布镜像。项目会从 `third_party/we-mp-rss` 源码目录构建本地镜像，配置脚本会按当前机器架构写入本地镜像 tag，例如 ARM Mac 使用 `yanfeng-homepage/we-mp-rss:arm64`。

如果部署到 `2核2G / 40G / 3M` 低配服务器，使用低资源覆盖配置：

```bash
scripts/configure-we-mp-rss-env.sh --yes
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml up -d --build
```

`docker-compose.2c2g.yml` 会限制各容器 CPU、内存和日志大小。建议服务器额外配置 `2G` swap，避免 `we-mp-rss` 的 Chromium 进程或 MySQL 偶发内存峰值导致容器被系统杀掉。
公众号 RSS 同步会自动按 `limit/offset` 翻页，低配服务器无需手工维护多个 offset URL。

默认访问：

- Web：`http://localhost`
- API：`http://localhost/api/site-settings`
- we-mp-rss 管理页：`http://localhost:8001`

`we-mp-rss` 默认只绑定 `127.0.0.1:8001`，本机可访问，服务器不会对公网暴露该端口。

便捷上线、回滚和备份脚本：

```bash
# 上线，默认拉取 cyan_opt 并重建 api/web
scripts/deploy.sh

# 回滚到上一次部署前的 revision
scripts/rollback.sh

# 立即备份 MySQL 与 we-mp-rss SQLite，默认最多保留 2 份
scripts/backup-db.sh

# 在服务器安装每日自动备份任务
sudo scripts/install-db-backup-cron.sh
```

完整开发与运维说明见 [`docs/development-guide.md`](docs/development-guide.md)。

## HTTPS 与 Cloudflare

生产环境通过 Cloudflare 橙云代理访问域名，源站 Docker Nginx 同时监听 `80` 和 `443`。当前大陆 ECS 未备案域名建议使用 Cloudflare `Flexible`，让 Cloudflare 到源站走 HTTP 80；`443` 和 Let's Encrypt 保留给备案后、海外源站或 Cloudflare Tunnel 场景。

使用 Cloudflare Tunnel 时，在服务器 `.env` 配置 Cloudflare 生成的 token：

```ini
CLOUDFLARE_TUNNEL_TOKEN=replace-with-cloudflare-token
```

启动隧道：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml up -d cloudflared
```

Tunnel 的 Public Hostname 推荐配置：

```text
yanfeng.club     -> http://web:80
www.yanfeng.club -> http://web:80
```

服务器 `.env` 需要包含：

```ini
HTTPS_PORT=443
TLS_DOMAIN=yanfeng.club
LETSENCRYPT_DIR=/etc/letsencrypt
CERTBOT_WEBROOT=/var/www/certbot
```

首次申请证书：

```bash
scripts/install-letsencrypt.sh --domain yanfeng.club --extra-domains www.yanfeng.club
```

脚本会启动 Web、申请证书、重启 Web，并安装每日续期任务。确认源站 HTTPS 正常后，如果域名备案或已迁移到海外源站，可在 Cloudflare 将 SSL/TLS 模式切到 `Full (strict)`。

如果申请失败，通常是 Cloudflare 把 HTTP 强制跳转到 HTTPS，但源站还没有正式证书。首次申请时需要临时关闭 Cloudflare 的 `Always Use HTTPS`，或把 DNS 记录临时切到 DNS only，证书签发后再开启橙云。

停止服务：

```bash
docker compose down
```

删除数据库和上传文件卷：

```bash
docker compose down -v
```

持久化卷：

- `mysql-data`：MySQL 数据。
- `uploads-data`：上传文件。
- `wemp-rss-data`：we-mp-rss 数据。

## 公众号 RSS 同步

项目通过自部署 `we-mp-rss` 获取公众号文章流，再由 Go API 拉取 RSS 并写入 `wechat_articles`，前端继续使用现有“公众号推文”模块展示。

本地验证流程：

1. 启动服务：

```bash
cp .env.example .env
scripts/configure-we-mp-rss-env.sh --yes
docker compose up -d --build
```

2. 打开 `http://localhost:8001`，在 `we-mp-rss` 中完成登录/授权，并添加需要同步的公众号。

3. 在 `we-mp-rss` 里复制对应公众号的 RSS 地址或路径，填入 `.env`：

```ini
WECHAT_RSS_BASE_URL=http://we-mp-rss:8001
WECHAT_RSS_FEED_URLS=/rss/example-a.xml,/rss/example-b.xml
```

`we-mp-rss` 的 RSS 接口按页输出。后端会自动按 `limit/offset` 翻页：当一页返回数量达到 `limit` 时继续请求下一页，直到返回不足一页或达到 `WECHAT_RSS_MAX_ARTICLES`。因此每个公众号只需要配置一个基础 RSS 地址；可按需带上 `limit` 控制单页大小。

```ini
WECHAT_RSS_FEED_URLS=/rss/MP_xxx?limit=50,/rss/MP_yyy?limit=50
WECHAT_RSS_MAX_ARTICLES=2000
WECHAT_RSS_DISPLAY_NAME_MAP=番剧鉴赏组=涧桐现视研
```

后续增量更新可以重复执行同步。后端会按 `sourceName + externalId` 和文章 URL 去重，已有文章会跳过，新文章会写入 MySQL。
其中 `sourceName` 保留 RSS 同步名，`displaySourceName` 用于官网展示；当公众号同步名和展示名不一致时，用 `WECHAT_RSS_DISPLAY_NAME_MAP` 配置映射。

也可以直接填完整 URL，适合非 Docker 本地调试：

```ini
WECHAT_RSS_FEED_URLS=http://127.0.0.1:8001/rss/example-a.xml,http://127.0.0.1:8001/rss/example-b.xml
```

4. 重启 API 让配置生效：

```bash
docker compose up -d --build api
```

5. 进入网站管理员模式，点击“同步公众号”。同步成功后，文章会写入 MySQL 并展示在“公众号推文”区域。

也可以直接调用接口：

```bash
curl -X POST http://localhost/api/wechat-articles/sync \
  -H "Authorization: Bearer <admin-token>"
```

服务器上不要开放 `8001` 公网端口。如需访问 `we-mp-rss` 管理页，使用 SSH 隧道：

```bash
ssh -L 8001:127.0.0.1:8001 user@your-server
```

然后在本机打开 `http://localhost:8001`。

## 环境变量

AI 助手通过本地 API 服务端转发到 Dify，密钥不要放到前端代码里。

复制 `.env.example` 为 `.env`，按需填写：

```ini
DIFY_API_KEY=app-xxxx
DIFY_API_URL=https://api.dify.ai/v1
```

Docker Compose 相关变量：

```ini
HTTP_PORT=80
MYSQL_DATABASE=yanfeng_homepage
MYSQL_USER=yanfeng
MYSQL_PASSWORD=<生成一个强密码>
MYSQL_ROOT_PASSWORD=<生成另一个强密码>
```

公众号 RSS 同步变量：

```ini
WE_MP_RSS_RUNTIME_ARCH=auto
WE_MP_RSS_LOCAL_IMAGE=yanfeng-homepage/we-mp-rss:local
WE_MP_RSS_BROWSER_TYPE=chromium
WE_MP_RSS_HEADLESS=true
WE_MP_RSS_AUTH_WEB=False
WE_MP_RSS_PAGE_SIZE=100
WE_MP_RSS_BIND=127.0.0.1
WE_MP_RSS_PORT=8001
WE_MP_RSS_SHM_SIZE=1gb
WECHAT_RSS_BASE_URL=http://we-mp-rss:8001
WECHAT_RSS_FEED_URLS=
WECHAT_RSS_MAX_ARTICLES=2000
WECHAT_RSS_DISPLAY_NAME_MAP=番剧鉴赏组=涧桐现视研
```

按机器架构更新 `we-mp-rss` 本地构建配置：

```bash
scripts/configure-we-mp-rss-env.sh --yes
docker compose build we-mp-rss
```

默认 `WE_MP_RSS_AUTH_WEB=False`，使用 `we-mp-rss` 的 API 二维码授权逻辑，避免浏览器页面结构变化导致二维码截图失败。如果后续确实需要浏览器授权流程，可以改成：

```ini
WE_MP_RSS_AUTH_WEB=True
```

然后重新构建并启动：

```bash
docker compose up -d --build we-mp-rss
```

## API

后端 API 当前由 `backend/` 的 Go 服务提供。前端默认请求同源 `/api`，Nginx 会反向代理到 Go API。

主要接口：

- `GET /articles`
- `GET /wechat-articles`
- `GET /wechat-articles/admin`
- `POST /wechat-articles/parse`
- `POST /wechat-articles/sync`
- `POST /wechat-articles`
- `PATCH /wechat-articles/:id`
- `DELETE /wechat-articles/:id`
- `GET /videos`
- `POST /videos`
- `PATCH /videos/:id`
- `DELETE /videos/:id`
- `GET /site-settings`
- `PATCH /site-settings`
- `GET /media-images`
- `POST /media-images`
- `PATCH /media-images/:id`
- `DELETE /media-images/:id`
- `POST /uploads`
- `POST /chat-messages`

Go API 使用 GORM 管理数据模型，运行时连接 MySQL 8，并在首次启动时可从根目录 `db.json` 导入演示数据。上传文件在 Docker 中保存到 `uploads-data` 卷。

## 构建

```bash
npm run build:frontend
npm run test:backend
docker compose config
```
