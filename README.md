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

## 爬取微信公众号文章

把文章链接写入 `scripts/wechat-urls.txt`，每行一个链接，然后运行：

```bash
npm run crawl:wechat
```

也可以临时传入链接：

```bash
npm run crawl:wechat -- https://mp.weixin.qq.com/s/xxx
```

只测试解析、不写入 `db.json`：

```bash
npm run crawl:wechat -- --dry-run
```

当前版本爬取的是“指定文章链接”。如果要自动发现公众号最新推文，需要公众号后台接口权限，或额外提供文章列表来源。

## 低频自动发现公众号文章

没有公众号后台权限时，可以用非官方低频发现脚本试探最新文章：

```bash
npm run discover:wechat -- --dry-run
```

确认发现结果没问题后，运行：

```bash
npm run discover:wechat
```

配置文件在 `scripts/wechat-discover.config.json`。当前默认目标是“涧桐现视研”，会尝试：

- 公众号公开历史页
- 搜狗微信搜索结果

发现新文章后会自动调用 `crawl:wechat`，写入 `db.json` 并下载封面。这个方案适合每天跑一次，例如公众号 22:22 发文后，可以在 22:35 或 23:00 执行。

如果只想同步当天/最近一天的新文章：

```bash
npm run discover:wechat -- --lookback-days=1
```

如果担心某天漏抓，可以把窗口放宽到 3 天：

```bash
npm run discover:wechat -- --lookback-days=3
```

注意：这是没有后台/API 权限时的折中方案，可能受到验证页、搜索延迟、反爬策略影响。官方稳定方案仍然是公众号后台接口。

## 构建

```bash
npm run build
```
