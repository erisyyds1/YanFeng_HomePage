# YanFeng Club Portal

檐枫动漫社门户原型，包含资讯列表、社团历史、活动录像和 AI 助手。

## 本地启动

安装依赖：

```bash
npm install
```

启动本地 API：

```bash
npm run api
```

启动前端：

```bash
npm run dev
```

默认地址：

- 前端：`http://localhost:3000`
- API：`http://localhost:3001`

如果 `3000` 端口不可用，可以使用：

```bash
npm run dev -- --port 5173
```

## 环境变量

AI 助手通过本地 API 服务端转发到 Dify，密钥不要放到前端代码里。

复制 `.env.example` 为 `.env`，按需填写：

```ini
DIFY_API_KEY=app-xxxx
DIFY_API_URL=https://api.dify.ai/v1
```

为了兼容旧配置，`server.mjs` 会临时读取 `VITE_DIFY_API_KEY`，但新配置请使用 `DIFY_API_KEY`。

## API

本地 API 由 `server.mjs` 提供：

- `GET /articles`
- `GET /videos`
- `POST /videos`
- `DELETE /videos/:id`
- `POST /chat-messages`

数据存储在 `db.json`，适合本地演示和内容录入，不适合作为正式生产数据库。

## 构建

```bash
npm run build
```
