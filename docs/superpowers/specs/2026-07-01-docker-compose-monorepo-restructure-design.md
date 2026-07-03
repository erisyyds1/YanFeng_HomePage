# Docker Compose Monorepo Restructure Design

## 目的

将当前项目整理为清晰的前后端分层结构，并提供 Docker Compose 部署方式。目标是让服务器只需要 Docker 和 Docker Compose，就能通过一个项目目录、一条命令启动前端、后端和数据库。

## 范围

本阶段包含：

- 将现有 React + Vite 前端移动到 `frontend/`。
- 保留并使用现有 Go 后端目录 `backend/`。
- 新增 `deploy/` 存放 Nginx、MySQL 等部署依赖配置。
- 新增 `docker-compose.yml` 管理 `web`、`api`、`mysql` 三个服务。
- 新增 Dockerfile：
  - `backend/Dockerfile` 构建 Go API 镜像。
  - `deploy/nginx/Dockerfile` 构建前端静态资源并产出 Nginx 镜像。
- 更新 README 和配置示例，说明本地构建、服务器部署和数据卷。

本阶段不包含：

- 不把 MySQL 塞进 API 或 Nginx 的单一容器。
- 不引入 Kubernetes、CI/CD、远程镜像仓库流程。
- 不实装 MinIO 和 Casbin 策略管理。
- 不改变前端业务功能和页面样式。

## 目标目录结构

```text
YanFeng_HomePage/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── App.tsx
│       ├── index.tsx
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── data/
│       ├── utils/
│       ├── assets/
│       ├── constants.ts
│       ├── types.ts
│       └── vite-env.d.ts
├── backend/
│   ├── cmd/server/
│   ├── internal/
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
├── deploy/
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── default.conf
│   └── mysql/
│       └── README.md
├── docker-compose.yml
├── .dockerignore
├── .env.example
└── README.md
```

## Docker 服务设计

| 服务 | 镜像来源 | 职责 |
| --- | --- | --- |
| `web` | `deploy/nginx/Dockerfile` | 构建并托管前端静态文件，反代 `/api/` 和 `/uploads/` 到 `api` |
| `api` | `backend/Dockerfile` | 运行 Go API，连接 MySQL，处理上传和 Dify 转发 |
| `mysql` | `mysql:8` | 提供 MySQL 8 数据库，使用 named volume 持久化数据 |

Compose 环境变量映射：

- `mysql`
  - `MYSQL_DATABASE=${MYSQL_DATABASE:-yanfeng_homepage}`
  - `MYSQL_USER=${MYSQL_USER:-yanfeng}`
  - `MYSQL_PASSWORD=${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}`
  - `MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}`
- `api`
  - `PORT=3001`
  - `DB_DRIVER=mysql`
  - `DB_DSN=${MYSQL_USER:-yanfeng}:${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}@tcp(mysql:3306)/${MYSQL_DATABASE:-yanfeng_homepage}?charset=utf8mb4&parseTime=True&loc=Local`
  - `PUBLIC_DIR=/app/public`
  - `SEED_PATH=/app/seed/db.json`
  - `ADMIN_PASSWORD=${ADMIN_PASSWORD}`
  - `ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}`
  - `DIFY_API_KEY=${DIFY_API_KEY}`
  - `DIFY_API_URL=${DIFY_API_URL:-https://api.dify.ai/v1}`

## 网络和路径

- 外部只暴露 `web` 服务的 HTTP 端口，默认映射为 `80:80`。
- 前端继续请求同源 `/api`。
- Nginx 将 `/api/` 反向代理到 `api:3001`。
- Nginx 将 `/uploads/` 反向代理到 `api:3001`，由 Go API 继续服务上传文件。
- `api` 通过 Compose 内部网络连接 `mysql:3306`。
- `mysql` 配置 `healthcheck`，使用 `mysqladmin ping` 检查数据库可用性。
- `api` 通过 `depends_on: condition: service_healthy` 等待 MySQL 健康后启动，降低数据库启动竞态。

## 数据和持久化

- MySQL 数据使用 named volume：`mysql-data`。
- 上传文件使用 named volume：`uploads-data`，挂载到 API 容器的 `/app/public/uploads`。
- Go API 的 `PUBLIC_DIR` 配置为 `/app/public`。
- Go API 的 `DB_DSN` 指向 `mysql` 服务。
- `db.json` 作为初始演示数据随 API 镜像复制到 `/app/seed/db.json`，首次启动由现有 seed 逻辑导入。

## 前端迁移规则

- 将 `App.tsx`、`index.tsx`、`components/`、`pages/`、`services/`、`hooks/`、`data/`、`utils/`、`assets/`、`constants.ts`、`types.ts`、`vite-env.d.ts` 移动到 `frontend/src/`。
- 将 `index.html`、`vite.config.ts`、`tsconfig.json`、`package.json`、`package-lock.json` 移动到 `frontend/`。
- 将 `public/` 中的前端静态资源移动到 `frontend/public/`。
- `public/uploads/` 不作为前端静态资源迁移，上传文件由 API 容器的数据卷负责。
- 更新 Vite 入口为 `/src/index.tsx`。
- 更新 `frontend/vite.config.ts`：
  - `loadEnv(mode, '.', '')` 改为以 `frontend/` 为项目根读取。
  - `resolve.alias['@']` 指向 `frontend/src`。
  - dev server `/api` 代理仍指向 `http://localhost:3001`。
- 更新 `frontend/tsconfig.json`，保证 `include` 覆盖 `src/**/*`，路径不再依赖仓库根目录。
- 保持前端 service 里的 `/api` 调用不变。

## 后端迁移规则

- `backend/` 保持 Go 后端源码目录。
- 更新默认容器配置：
  - `PORT=3001`
  - `DB_DRIVER=mysql`
  - `PUBLIC_DIR=/app/public`
  - `SEED_PATH=/app/seed/db.json`
- Dockerfile 构建 Go 二进制并运行 `cmd/server`。
- 保留本地测试能力：`cd backend && go test ./...`。

## 部署方式

本地或服务器部署：

```bash
cp .env.example .env
docker compose up -d --build
```

停止服务：

```bash
docker compose down
```

保留数据停止：

```bash
docker compose down
```

删除数据库和上传数据：

```bash
docker compose down -v
```

## 验收标准

- `docker compose config` 通过。
- `docker compose build` 能构建 `web` 和 `api` 镜像。
- `docker compose up -d` 能启动 `web`、`api`、`mysql`。
- 访问 `http://localhost/` 返回前端页面。
- 访问 `http://localhost/api/site-settings` 返回 JSON。
- 上传一张测试图片后，返回的 `/uploads/...` URL 可通过 `http://localhost/uploads/...` 访问。
- `docker compose restart` 后，MySQL 数据仍保留。
- `docker compose restart` 后，上传文件仍可通过原 `/uploads/...` URL 访问。
- 后端测试 `cd backend && go test ./...` 通过。
- 前端构建 `cd frontend && npm run build` 通过。
- 原根目录前端源码已移动到 `frontend/`，根目录只保留项目级配置、文档、部署文件。
