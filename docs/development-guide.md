# 项目开发与部署指南

## 目的

本文档帮助开发者快速理解 `YanFeng_HomePage` 的开发、调试、部署、回滚和数据备份流程。

项目当前技术栈：

- 前端：React 19 + Vite，目录为 `frontend/`
- 后端：Go + Gin + GORM，目录为 `backend/`
- 数据库：MySQL 8，Docker 卷为 `mysql-data`
- 公众号同步：`we-mp-rss`，Docker 卷为 `wemp-rss-data`
- 生产部署：Docker Compose + `docker-compose.2c2g.yml`

## 目录说明

```text
.
├── frontend/                  # 前端页面与组件
├── backend/                   # Go API
│   ├── cmd/server/            # API 入口
│   ├── conf/                  # 配置加载
│   ├── dal/                   # 数据访问
│   ├── model/                 # GORM 模型
│   ├── router/                # HTTP 路由与 Handler
│   ├── service/               # 业务逻辑
│   └── util/                  # 通用工具
├── scripts/                   # 运维和开发脚本
├── deploy/                    # Nginx、MySQL、we-mp-rss 部署配置
├── docs/                      # 项目文档
├── docker-compose.yml
└── docker-compose.2c2g.yml    # 低配服务器覆盖配置
```

## 本地开发

### 前置要求

- Node.js 20+
- Go 1.25+
- Docker Desktop 或 Docker Engine

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

如果端口被占用：

```bash
npm run dev -- --port 5173
```

### 启动后端

复制环境变量：

```bash
cp .env.example .env
```

启动 Go API：

```bash
npm run dev:api
```

默认 API：

```text
http://localhost:3001/api/site-settings
```

### 本地 Docker 全量启动

```bash
cp .env.example .env
scripts/configure-we-mp-rss-env.sh --yes
docker compose up -d --build
```

默认访问：

- 官网：`http://localhost`
- API：`http://localhost/api/site-settings`
- we-mp-rss：`http://localhost:8001`

## 常用验证命令

后端测试：

```bash
cd backend
go test ./...
go build ./...
```

前端构建：

```bash
cd frontend
npm run build
```

公众号分页组件测试：

```bash
npm run test:wechat-archive
```

## 公众号同步

公众号文章同步链路：

```text
we-mp-rss SQLite -> RSS 接口 -> Go API -> MySQL wechat_articles -> 前端展示
```

`.env` 推荐配置：

```ini
WECHAT_RSS_BASE_URL=http://we-mp-rss:8001
WECHAT_RSS_FEED_URLS=/feed/MP_WXS_3274495481.rss?limit=50,/feed/MP_WXS_2392574275.rss?limit=50
WECHAT_RSS_MAX_ARTICLES=2000
WECHAT_RSS_DISPLAY_NAME_MAP=番剧鉴赏组=涧桐现视研
```

同步逻辑：

- 后端会自动按 `limit/offset` 翻页。
- 如果当前页返回数量达到 `limit`，继续请求下一页。
- 如果当前页返回数量小于 `limit`，认为已经到最后一页。
- 如果达到 `WECHAT_RSS_MAX_ARTICLES`，停止继续拉取。
- 去重优先使用 `wechat_url`，其次使用 `source_name + external_id`。

## 部署脚本

### scripts/deploy.sh

目的：

上线当前 GitHub 分支，并重建、重启指定 Docker Compose 服务。

使用方法：

```bash
scripts/deploy.sh
```

常用参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--branch NAME` | 要部署的分支 | `cyan_opt` |
| `--services "LIST"` | 要重建和重启的服务 | `api web` |
| `--no-pull` | 不执行 Git 拉取 | 不启用 |
| `--no-build` | 不重新构建镜像 | 不启用 |
| `--no-health-check` | 跳过健康检查 | 不启用 |
| `--allow-dirty` | 允许有本地已跟踪文件改动 | 不启用 |

返回值：

- 成功：退出码 `0`
- 失败：退出码非 `0`，终端会输出失败原因

示例：

```bash
# 标准生产上线
scripts/deploy.sh

# 只部署后端
scripts/deploy.sh --services "api"

# 部署指定分支
scripts/deploy.sh --branch cyan_opt
```

上线脚本会写入运行态文件：

```text
.deploy/current_revision
.deploy/previous_revision
.deploy/deployed_at
```

这些文件用于后续快速回滚，不会提交到 Git。

### scripts/rollback.sh

目的：

回滚到上一次部署前的 Git revision，并重建、重启服务。

使用方法：

```bash
scripts/rollback.sh
```

常用参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--revision SHA` | 指定回滚到某个 commit | `.deploy/previous_revision` |
| `--services "LIST"` | 要重建和重启的服务 | `api web` |
| `--no-build` | 不重新构建镜像 | 不启用 |
| `--no-health-check` | 跳过健康检查 | 不启用 |
| `--allow-dirty` | 允许有本地已跟踪文件改动 | 不启用 |

返回值：

- 成功：退出码 `0`
- 失败：退出码非 `0`

示例：

```bash
# 回滚到上一个部署版本
scripts/rollback.sh

# 回滚到指定 commit
scripts/rollback.sh --revision 3ac8760

# 只回滚后端
scripts/rollback.sh --services "api"
```

注意：

回滚后仓库会进入 detached HEAD 状态。恢复正常上线流程时执行：

```bash
scripts/deploy.sh --branch cyan_opt
```

## 数据备份

### scripts/backup-db.sh

目的：

生成一个压缩备份包，包含：

- `mysql.sql`：官网 MySQL 数据库 dump
- `we-mp-rss.db`：we-mp-rss SQLite 数据库
- `manifest.txt`：备份时间、Git revision、备份路径等元信息

使用方法：

```bash
scripts/backup-db.sh
```

常用参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--backup-dir PATH` | 备份文件目录 | root 下为 `/var/backups/yanfeng-homepage/db`，非 root 下为 `backups/db` |
| `--retention N` | 最多保留 N 份备份 | `2` |

返回值：

- 成功：退出码 `0`，输出备份包路径
- 失败：退出码非 `0`

示例：

```bash
# 立即备份一次
scripts/backup-db.sh

# 指定目录并保留 2 份
scripts/backup-db.sh --backup-dir /var/backups/yanfeng-homepage/db --retention 2
```

### scripts/install-db-backup-cron.sh

目的：

在服务器上安装每日自动备份任务。

使用方法：

```bash
sudo scripts/install-db-backup-cron.sh
```

常用参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--project-dir PATH` | 服务器项目目录 | 当前仓库目录 |
| `--backup-dir PATH` | 备份目录 | `/var/backups/yanfeng-homepage/db` |
| `--retention N` | 最多保留 N 份 | `2` |
| `--schedule "CRON"` | cron 表达式 | `17 3 * * *` |
| `--log-file PATH` | 备份日志文件 | `/var/log/yanfeng-homepage-db-backup.log` |

返回值：

- 成功：退出码 `0`，写入 `/etc/cron.d/yanfeng-homepage-db-backup`
- 失败：退出码非 `0`

示例：

```bash
sudo scripts/install-db-backup-cron.sh \
  --project-dir /root/YanFeng_HomePage \
  --backup-dir /var/backups/yanfeng-homepage/db \
  --retention 2 \
  --schedule "17 3 * * *"
```

查看备份：

```bash
ls -lh /var/backups/yanfeng-homepage/db
tail -100 /var/log/yanfeng-homepage-db-backup.log
```

## 数据恢复

恢复前先停止写入流量，避免恢复过程中继续同步或写入：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml stop api
```

解压备份包：

```bash
mkdir -p /tmp/yanfeng-restore
tar -xzf /var/backups/yanfeng-homepage/db/yanfeng_homepage_db_YYYYMMDD_HHMMSS.tar.gz -C /tmp/yanfeng-restore
```

恢复 MySQL：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml exec -T mysql sh -lc \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < /tmp/yanfeng-restore/mysql.sql
```

恢复 we-mp-rss SQLite：

```bash
container="$(docker compose -f docker-compose.yml -f docker-compose.2c2g.yml ps -q we-mp-rss)"
docker cp /tmp/yanfeng-restore/we-mp-rss.db "$container:/app/data/db.db"
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml restart we-mp-rss
```

恢复后启动 API：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml up -d api
```

## HTTPS 与 Cloudflare

### 目的

生产环境使用 Cloudflare 橙云代理域名。当前大陆 ECS 未备案域名建议使用 Cloudflare `Flexible`，让 Cloudflare 到源站走 HTTP 80；源站 `443` 和 Let's Encrypt 保留给备案后、海外源站或 Cloudflare Tunnel 场景。

### Cloudflare Tunnel

目的：

让服务器通过 `cloudflared` 主动连接 Cloudflare，公网请求不再直接进入阿里云 `80/443`，适合未备案域名临时恢复访问。

服务器 `.env` 配置：

```ini
CLOUDFLARE_TUNNEL_TOKEN=replace-with-cloudflare-token
```

使用方法：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml up -d cloudflared
```

参数说明：

| 配置 | 说明 |
|------|------|
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Zero Trust 生成的 tunnel token，只写入服务器 `.env`，不要提交 Git |

返回值：

- 成功：`cloudflared` 容器保持 `Up`
- 失败：查看 `docker logs yanfeng_homepage-cloudflared-1 --tail 100`

Cloudflare Public Hostname 配置：

```text
yanfeng.club     -> http://web:80
www.yanfeng.club -> http://web:80
```

示例：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml up -d cloudflared
docker logs yanfeng_homepage-cloudflared-1 --tail 100
curl -I https://yanfeng.club
```

项目的 Docker Nginx 配置：

- `80`：直接服务前端、API 代理和 `/.well-known/acme-challenge/`
- `80` 和 `443`：都支持 `/.well-known/acme-challenge/`，用于 Let's Encrypt HTTP-01 验证
- `443`：使用 Let's Encrypt 免费证书
- 证书容器路径：`/etc/letsencrypt/live/yanfeng.club/fullchain.pem`
- 私钥容器路径：`/etc/letsencrypt/live/yanfeng.club/privkey.pem`

### 环境变量

服务器 `.env` 需要配置：

```ini
HTTPS_PORT=443
TLS_DOMAIN=yanfeng.club
LETSENCRYPT_DIR=/etc/letsencrypt
CERTBOT_WEBROOT=/var/www/certbot
```

`LETSENCRYPT_DIR` 是宿主机证书目录，会挂载进 Nginx 容器。`CERTBOT_WEBROOT` 是 HTTP-01 验证文件目录。

### 申请 Let's Encrypt 证书

使用方法：

```bash
scripts/install-letsencrypt.sh --domain yanfeng.club --extra-domains www.yanfeng.club
```

参数说明：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--domain NAME` | 主域名 | `yanfeng.club` |
| `--extra-domains LIST` | 逗号分隔的附加域名 | `www.yanfeng.club` |
| `--email EMAIL` | Let's Encrypt 通知邮箱 | 可不填 |
| `--letsencrypt-dir PATH` | 证书目录 | `/etc/letsencrypt` |
| `--webroot PATH` | ACME challenge 目录 | `/var/www/certbot` |
| `--staging` | 使用 Let's Encrypt 测试环境 | 不启用 |
| `--force-renewal` | 强制重新签发 | 不启用 |
| `--skip-challenge-check` | 跳过申请前的 HTTP 校验 | 不启用 |

返回值：

- 成功：退出码 `0`，证书写入 `LETSENCRYPT_DIR`，并安装自动续期 cron
- 失败：退出码非 `0`

示例：

```bash
scripts/install-letsencrypt.sh \
  --domain yanfeng.club \
  --extra-domains www.yanfeng.club
```

脚本会执行：

- 写入 `.env` 的 HTTPS 配置
- 启动 Web 容器
- 通过 `certbot/certbot` Docker 镜像申请证书
- 重启 Web 容器
- 写入 `/etc/cron.d/yanfeng-homepage-letsencrypt` 每日续期任务

### 验证

```bash
curl -k -I https://127.0.0.1
curl -I https://yanfeng.club
```

源站 `443` 正常后，在 Cloudflare 修改：

```text
SSL/TLS -> Overview -> Encryption mode -> Full (strict)
```

如果源站仍是大陆 ECS 且域名未备案，不要切 `Full (strict)`；保持 `Flexible`，否则可能出现 Cloudflare `525` 或阿里云 ICP 拦截。

首次申请如果失败，通常是 Cloudflare 已经把 HTTP 强制跳到 HTTPS，但源站还没有正式证书。处理方式：

- 临时关闭 Cloudflare 的 `Always Use HTTPS`
- 或将 DNS 记录临时切到 DNS only
- 证书签发成功后，再开启橙云

## 服务器部署流程

首次部署：

```bash
git clone https://github.com/erisyyds1/YanFeng_HomePage.git
cd YanFeng_HomePage
git checkout cyan_opt
cp .env.example .env
scripts/configure-we-mp-rss-env.sh --yes
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml up -d --build
sudo scripts/install-db-backup-cron.sh
```

日常上线：

```bash
cd /root/YanFeng_HomePage
scripts/deploy.sh
```

异常回滚：

```bash
cd /root/YanFeng_HomePage
scripts/rollback.sh
```

立即备份：

```bash
cd /root/YanFeng_HomePage
scripts/backup-db.sh
```

## 常见排查

查看容器：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml ps
```

查看 API 日志：

```bash
docker logs yanfeng_homepage-api-1 --tail 100
```

验证接口：

```bash
curl -s http://127.0.0.1/api/site-settings
curl -s http://127.0.0.1/api/wechat-articles | head
```

查看数据库数量：

```bash
docker compose -f docker-compose.yml -f docker-compose.2c2g.yml exec -T mysql sh -lc \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM wechat_articles;"'
```

查看磁盘和内存：

```bash
df -h
free -h
docker stats --no-stream
```

## 开发注意事项

- 不要提交 `.env`、密码、临时 SSH 脚本和备份文件。
- 前端变更后需要重建 `web` 镜像。
- 后端变更后需要重建 `api` 镜像。
- 公众号同步配置只需要配置基础 feed，后端会自动分页。
- 生产环境继续使用 `docker-compose.2c2g.yml`，避免低配服务器内存过载。
