# Docker Compose Monorepo Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目整理为 `frontend/`、`backend/`、`deploy/` 分层结构，并通过 Docker Compose 一条命令启动前端、Go API 和 MySQL。

**Architecture:** `web` 容器使用 Nginx 托管 Vite 构建产物并反代 `/api`、`/uploads` 到 `api`；`api` 容器运行 Go 后端并连接 Compose 内部的 `mysql` 服务；MySQL 和上传文件通过 named volume 持久化。

**Tech Stack:** React + Vite、Go + Gin + GORM、MySQL 8、Nginx、Docker Compose。

---

### Task 1: 迁移前基线验证

**Files:**
- Read: `package.json`
- Read: `backend/go.mod`
- Read: `.env.example`
- Read: `README.md`

- [ ] **Step 1: 记录当前工作区状态**

Run:

```bash
git status --short
```

Expected: 明确当前已有未提交的 Go 后端、README、`.env.example`、`package.json` 等改动；后续修改必须在这些文件现有内容基础上合并，不覆盖。

- [ ] **Step 2: 读取将要修改的配置文件**

Run:

```bash
sed -n '1,220p' package.json
sed -n '1,220p' .env.example
sed -n '1,260p' README.md
sed -n '1,180p' index.html
sed -n '1,220p' vite.config.ts
sed -n '1,220p' tsconfig.json
```

Expected: 已掌握现有脚本、环境变量、文档、Vite 入口、Vite alias 和 TypeScript 配置内容。

- [ ] **Step 3: 运行 Go 后端测试**

Run:

```bash
cd backend && go test ./...
```

Expected: PASS。

- [ ] **Step 4: 运行当前前端构建**

Run:

```bash
npm run build
```

Expected: PASS。

### Task 2: 移动前端到 `frontend/`

**Files:**
- Move to `frontend/`: `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`
- Move to `frontend/src/`: `App.tsx`, `index.tsx`, `constants.ts`, `types.ts`, `vite-env.d.ts`
- Move to `frontend/src/`: `components/`, `pages/`, `services/`, `hooks/`, `data/`, `utils/`, `assets/`
- Move to `frontend/public/`: current `public/` except `public/uploads/`
- Preserve: `db.json`, `docs/`, `backend/`; remove the obsolete Node demo API after Go API migration

- [ ] **Step 1: 创建目标目录**

Run:

```bash
mkdir -p frontend/src frontend/public
```

- [ ] **Step 2: 用 `git mv` 移动前端配置文件**

Run:

```bash
git mv package.json package-lock.json index.html vite.config.ts tsconfig.json frontend/
```

- [ ] **Step 3: 用 `git mv` 移动前端源码**

Run:

```bash
git mv App.tsx index.tsx constants.ts types.ts vite-env.d.ts frontend/src/
git mv components pages services hooks data utils assets frontend/src/
```

- [ ] **Step 4: 移动前端静态资源，不移动上传目录**

Run:

```bash
git mv public/_routes.json public/default_cover.png public/favicon.svg frontend/public/
git mv public/image public/music frontend/public/
```

Expected: `public/uploads/.gitkeep` 仍留在根目录，`frontend/public/` 不包含 `uploads/`。

### Task 3: 修正前端构建路径

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`

- [ ] **Step 1: 更新 Vite 入口**

Change `frontend/index.html` script entry to:

```html
<script type="module" src="/src/index.tsx"></script>
```

- [ ] **Step 2: 更新 Vite alias**

Change `frontend/vite.config.ts` env loading and alias to:

```ts
const env = loadEnv(mode, process.cwd(), '');

// ...
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}
```

- [ ] **Step 3: 确认 dev proxy 保持 `/api` 到 `localhost:3001`**

Keep:

```ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

- [ ] **Step 4: 运行前端构建**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS。

- [ ] **Step 5: 更新 tsconfig 路径**

Ensure `frontend/tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "src/**/*"
  ]
}
```

Expected: TypeScript 不再依赖仓库根目录作为前端源码根。

### Task 4: 增加 Docker 部署配置

**Files:**
- Create: `backend/Dockerfile`
- Create: `deploy/nginx/Dockerfile`
- Create: `deploy/nginx/default.conf`
- Create: `deploy/mysql/README.md`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Modify: `.env.example`

- [ ] **Step 1: 创建部署目录**

Run:

```bash
mkdir -p deploy/nginx deploy/mysql
```

- [ ] **Step 2: 创建 Go API Dockerfile**

Create `backend/Dockerfile` using multi-stage build. It must copy `backend/` source, build `./cmd/server`, copy `db.json` to `/app/seed/db.json`, expose `3001`, and run the binary.

- [ ] **Step 3: 创建 Nginx Dockerfile**

Create `deploy/nginx/Dockerfile` using a Node builder stage for `frontend/` and an Nginx runtime stage that copies `frontend/dist` to `/usr/share/nginx/html`.

- [ ] **Step 4: 创建 Nginx 配置**

Create `deploy/nginx/default.conf`:

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://api:3001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    proxy_pass http://api:3001/uploads/;
    proxy_set_header Host $host;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 5: 创建 Compose 文件**

Create `docker-compose.yml` with this structure:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: deploy/nginx/Dockerfile
    ports:
      - "${HTTP_PORT:-80}:80"
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      PORT: "3001"
      DB_DRIVER: mysql
      DB_DSN: "${MYSQL_USER:-yanfeng}:${MYSQL_PASSWORD:-yanfeng_password}@tcp(mysql:3306)/${MYSQL_DATABASE:-yanfeng_homepage}?charset=utf8mb4&parseTime=True&loc=Local"
      PUBLIC_DIR: /app/public
      SEED_PATH: /app/seed/db.json
      ADMIN_PASSWORD: "${ADMIN_PASSWORD:-18522}"
      ADMIN_SESSION_SECRET: "${ADMIN_SESSION_SECRET:-replace-with-a-long-random-secret}"
      DIFY_API_KEY: "${DIFY_API_KEY:-}"
      DIFY_API_URL: "${DIFY_API_URL:-https://api.dify.ai/v1}"
    volumes:
      - uploads-data:/app/public/uploads
    depends_on:
      mysql:
        condition: service_healthy

  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: "${MYSQL_DATABASE:-yanfeng_homepage}"
      MYSQL_USER: "${MYSQL_USER:-yanfeng}"
      MYSQL_PASSWORD: "${MYSQL_PASSWORD:-yanfeng_password}"
      MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD:-root_password}"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 20

volumes:
  mysql-data:
  uploads-data:
```

Expected: `build.context` 都是仓库根目录，保证 Dockerfile 能访问 `frontend/`、`backend/`、`db.json` 和 `deploy/`。

- [ ] **Step 6: 更新 `.env.example`**

Add Compose variables while preserving existing variables:

- Keep `DIFY_API_KEY`
- Keep `DIFY_API_URL`
- Keep `ADMIN_PASSWORD`
- Keep `ADMIN_SESSION_SECRET`
- Keep `JWT_TTL`
- Keep `DB_DRIVER`
- Keep `DB_DSN`
- Keep `PUBLIC_DIR`
- Keep `SEED_PATH`
- Keep `VITE_API_URL`

Add:

```ini
MYSQL_DATABASE=yanfeng_homepage
MYSQL_USER=yanfeng
MYSQL_PASSWORD=yanfeng_password
MYSQL_ROOT_PASSWORD=root_password
HTTP_PORT=80
```

### Task 5: 根目录脚本和文档

**Files:**
- Create: root `package.json`
- Preserve: `frontend/package.json`
- Modify: `README.md`

- [ ] **Step 1: 新增根目录脚本**

Create a new root `package.json` only after the original has been moved to `frontend/package.json`.

Do not remove anything from `frontend/package.json`; it must retain the original frontend `dependencies`, `devDependencies`, `type: module`, and frontend scripts.

Root `package.json` should contain orchestration scripts only:

```json
{
  "scripts": {
    "dev:frontend": "cd frontend && npm run dev",
    "dev:api": "cd backend && go run ./cmd/server",
    "build:frontend": "cd frontend && npm run build",
    "test:backend": "cd backend && go test ./...",
    "compose:up": "docker compose up -d --build",
    "compose:down": "docker compose down"
  }
}
```

- [ ] **Step 2: 更新 README**

Document:

- 新目录结构。
- 本地前端启动：`npm run dev:frontend`。
- 本地 Go API：`npm run dev:api`。
- Docker 部署：`cp .env.example .env && docker compose up -d --build`。
- 数据卷：`mysql-data`、`uploads-data`。

### Task 6: 最终验证

**Files:**
- Verify: all changed files

- [ ] **Step 1: 运行后端测试**

Run:

```bash
cd backend && go test ./...
```

Expected: PASS。

- [ ] **Step 2: 运行前端构建**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS。

- [ ] **Step 3: 校验 Compose 配置**

Run:

```bash
docker compose config
```

Expected: exit 0。

- [ ] **Step 4: 如本机 Docker 可用，构建镜像**

Run:

```bash
docker compose build
```

Expected: `web` 和 `api` build 成功。

- [ ] **Step 5: 如本机 Docker 可用，启动 Compose**

Run:

```bash
docker compose up -d
```

Expected: `web`、`api`、`mysql` 均启动。

- [ ] **Step 6: 验证首页和 API**

Run:

```bash
curl -fsS http://localhost:${HTTP_PORT:-80}/ >/tmp/yanfeng-home.html
curl -fsS http://localhost:${HTTP_PORT:-80}/api/site-settings
```

Expected: 首页 HTML 可获取，`/api/site-settings` 返回 JSON。

- [ ] **Step 7: 验证数据库和上传卷持久化**

If Docker is available, get an admin JWT:

```bash
TOKEN=$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"message":"18522"}' \
  http://localhost:${HTTP_PORT:-80}/api/admin/login \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
```

Create a tiny test upload file:

```bash
printf 'test image bytes' >/tmp/yanfeng-upload-test.png
```

Upload through multipart form fields `file` and `category`:

```bash
UPLOAD_URL=$(curl -fsS \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "category=gallery" \
  -F "file=@/tmp/yanfeng-upload-test.png;type=image/png" \
  http://localhost:${HTTP_PORT:-80}/api/uploads \
  | sed -n 's/.*"url":"\([^"]*\)".*/\1/p')
```

Record the returned `/uploads/...` URL, then run:

```bash
docker compose restart
curl -fsS http://localhost:${HTTP_PORT:-80}/api/site-settings
curl -fsS "http://localhost:${HTTP_PORT:-80}${UPLOAD_URL}"
```

Expected: 重启后 API 仍可读数据库，上传文件 URL 仍可访问。

- [ ] **Step 8: 检查工作区状态**

Run:

```bash
git status --short
```

Expected: 只包含本次前端迁移、Docker 配置、文档和上一步 Go 后端相关变更；不包含无关文件删除。
