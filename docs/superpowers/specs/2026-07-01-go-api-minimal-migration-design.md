# Go API Minimal Migration Design

## 目的

将现有 `server.mjs` 提供的本地 API 迁移为 Go 后端，保持前端调用方式、接口路径和 JSON 响应结构不变。迁移目标是先获得一个可运行、可测试、可回退的 Go API，不在本阶段强行接入 Casbin、MinIO、Docker Compose 或 Nginx。

## 范围

本阶段包含：

- 新增 `backend/` Go 服务。
- 使用 Gin 提供 HTTP 路由。
- 使用 GORM 定义现有业务模型和数据库访问边界。
- 使用 Viper 读取配置。
- 使用 Zap 输出结构化日志。
- 使用 JWT 替换当前内存 token。
- 兼容现有前端默认的 `/api/*` 路径。
- 保留 `server.mjs` 作为临时回退路径。

本阶段不包含：

- 不删除 Node 后端。
- 不修改前端业务组件。
- 不实装 Casbin 策略管理，只预留鉴权接口边界。
- 不切换上传到 MinIO，继续使用本地 `public/uploads`。
- 不新增 Docker Compose、Nginx 生产部署链路。

## API 兼容性

Go 后端需要兼容以下接口：

- `POST /admin/login`
- `GET /articles`
- `GET /wechat-articles`
- `GET /wechat-articles/admin`
- `POST /wechat-articles/parse`
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
- `GET /uploads/*`
- `POST /chat-messages`

服务同时接受 `/api/*` 前缀和裸路径，避免前端默认配置需要改动。

关键行为必须保持兼容：

| 接口 | 鉴权 | 行为 |
| --- | --- | --- |
| `POST /admin/login` | 无 | 接受 `message` 或 `password`；错误密码返回 `401`；成功返回 `token`、`expiresAt`、`configured: true` |
| `GET /articles` | 无 | 按 `date DESC, created_at DESC` 返回 |
| `GET /wechat-articles` | 无 | 只返回 `isPublished !== false` 的文章，按 `sortOrder DESC, publishedAt DESC` 排序 |
| `GET /wechat-articles/admin` | JWT | 返回全部公众号文章，排序同公开列表 |
| `POST /wechat-articles/parse` | JWT | 校验微信文章 URL，解析失败时返回空标题、摘要、封面和发布时间，不把解析失败作为 5xx |
| `POST /wechat-articles` | JWT | 缺省 `id` 用 UUID，缺省 `title` 为 `未命名公众号推文`，缺省 `publishedAt` 为当天，缺省 `isPublished` 为 `true`，成功返回 `201` |
| `PATCH /wechat-articles/:id` | JWT | 不存在返回 `404`，成功返回更新后的文章 |
| `DELETE /wechat-articles/:id` | JWT | 不存在返回 `404`，成功返回 `204` 空响应 |
| `GET /videos` | 无 | 返回全部视频 |
| `POST /videos` | JWT | 校验标题、Bilibili player URL、分类、缩略图 URL；缺省 `id` 用毫秒时间戳；成功返回 `201` |
| `PATCH /videos/:id` | JWT | 不存在返回 `404`，成功返回更新后的视频 |
| `DELETE /videos/:id` | JWT | 不存在返回 `404`，成功返回 `204` 空响应 |
| `GET /site-settings` | 无 | 缺失时返回默认 `mainGroupNumber: "737508445"` |
| `PATCH /site-settings` | JWT | 校验 `mainGroupNumber` 非空，成功返回更新后的配置 |
| `GET /media-images` | 无 | 返回全部媒体图片 |
| `POST /media-images` | JWT | 校验标题、图片 URL、分类；缺省 `id` 用毫秒时间戳；成功返回 `201` |
| `PATCH /media-images/:id` | JWT | 不存在返回 `404`，成功返回更新后的图片 |
| `DELETE /media-images/:id` | JWT | 不存在返回 `404`，成功返回 `204` 空响应 |
| `POST /uploads` | JWT | 校验分类、图片类型和大小，保存文件和上传记录，成功返回 `201` |
| `GET /uploads/*` | 无 | 能访问 `POST /uploads` 返回的本地图片 URL |
| `POST /chat-messages` | 无 | 兼容 `query`/`message` 入参；空消息返回 `400`；未配置 Dify 返回兜底文案；上游失败返回 `502`；成功返回 `answer`、`conversation_id`、`message_id` |

## 架构

`backend/` 采用小型分层结构：

- `cmd/server`：程序入口，装配配置、日志、数据库、路由。
- `internal/config`：Viper 配置读取。
- `internal/logger`：Zap 初始化。
- `internal/database`：GORM 连接和迁移入口。
- `internal/models`：GORM 模型。
- `internal/http`：Gin 路由、中间件、响应处理。
- `internal/auth`：JWT 签发、校验和 Casbin 预留接口。
- `internal/services`：业务逻辑，包括内容管理、上传、微信解析、Dify 转发。

## 数据模型

优先沿用 `docs/cloudflare-d1-schema.sql` 和 `db.json` 的业务字段，转换为 MySQL/GORM 友好的模型：

- `site_settings`
- `articles`
- `wechat_articles`
- `videos`
- `media_images`
- `uploads`

Go JSON 响应必须保持前端类型命名：

- `coverUrl`
- `wechatUrl`
- `publishedAt`
- `isPublished`
- `sortOrder`
- `imageUrl`
- `mainGroupNumber`

最小迁移阶段使用 GORM 管理表结构。运行时默认面向 MySQL；测试使用 SQLite 内存库验证业务行为。首次启动时，如果核心表为空，Go 服务会从仓库根目录 `db.json` 导入现有演示数据，保证迁移后能返回当前页面已有内容。导入规则：

- `wechatArticles` -> `wechat_articles`
- `videos` -> `videos`
- `mediaImages` -> `media_images`
- `siteSettings.mainGroupNumber` -> `site_settings` 的 `main_group_number`
- `uploads` -> `uploads`

数据库列使用 snake_case，HTTP JSON 使用现有前端需要的 camelCase。

## 鉴权

`POST /admin/login` 继续接受前端传入的 `{ "message": "..." }`，同时兼容 `{ "password": "..." }`。校验通过后返回：

```json
{
  "token": "jwt-token",
  "expiresAt": 1780000000,
  "configured": true
}
```

管理接口通过 `Authorization: Bearer <token>` 校验。Casbin 本阶段只通过 `Authorizer` 接口预留，不引入策略文件和权限表。

## 上传

`POST /uploads` 继续接受 `multipart/form-data`：

- `file`：图片文件。
- `category`：`gallery`、`album`、`thumbnail`、`wechat`。

限制保持不变：

- 只允许 JPG、PNG、WebP。
- 最大 8 MB。
- 保存到 `public/uploads/<category>/<year>/<uuid>.<ext>`。
- 返回 `id`、`key`、`url`、`filename`、`contentType`、`byteSize`。
- 通过 `GET /uploads/<category>/<year>/<file>` 公开访问已上传文件，确保返回的 `url` 可直接作为图片地址使用。

## 错误处理

HTTP 错误统一返回：

```json
{
  "error": "message"
}
```

业务错误返回 4xx；未预期错误返回 500，并通过 Zap 记录请求上下文和错误详情。

## 测试

实现时按测试优先：

- `/api/*` 前缀和裸路径都能命中相同处理逻辑。
- JWT 登录成功和失败。
- 管理接口缺少 token 返回 401。
- 公开接口不需要 token，管理接口需要 token。
- 视频、媒体图片、公众号文章的新增、修改、删除。
- 公开公众号文章过滤未发布内容并按排序规则返回。
- 删除成功返回 `204` 空响应。
- 站点配置读取和更新。
- 启动后能从 `db.json` 导入当前演示数据。
- 上传类型、大小、分类校验。
- 上传后返回的 `/uploads/...` URL 能被访问。
- Dify 未配置时返回兼容兜底文案，空消息返回 `400`，上游失败返回 `502`。

完成前必须执行：

```bash
cd backend && go test ./...
npm run build
```

## 验收标准

- 前端不需要改业务调用代码。
- Go 后端能提供现有 API 的等价能力。
- 管理接口使用 JWT。
- `server.mjs` 保留作为回退。
- 测试和前端构建通过。
