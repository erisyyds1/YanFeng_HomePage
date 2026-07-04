# 檐枫网站本地 API 文档

本项目当前使用 `backend/` 中的 Go API 提供本地和 Docker 后端服务，默认地址为 `http://localhost:3001`。

## 数据源

- 文章和视频数据存储在 MySQL，首次启动时可从 `db.json` 导入演示数据
- AI 助手通过服务端读取 `DIFY_API_KEY` 后转发到 Dify
- 前端默认请求同源 `/api`；本地开发由 Vite 代理到 `http://localhost:3001`

## 文章接口

### GET `/articles`

返回最新资讯列表。当前项目已移除微信公众号爬虫脚本，文章列表默认为空，需要时可手动维护 `db.json`。

```json
[
  {
    "id": "1",
    "title": "【招新】2024秋季社团招新最终日程表",
    "date": "2024-09-01",
    "summary": "错过了百团大战？别担心！补招通道现已开启。",
    "link": "#",
    "coverUrl": "https://example.com/cover.jpg"
  }
]
```

前端也兼容正式后端常见的包装格式：

```json
{
  "data": {
    "list": []
  }
}
```

## 视频接口

### GET `/videos`

返回活动录像列表。

### POST `/videos`

新增一个 Bilibili 播放器视频。`url` 必须是 `https://player.bilibili.com/...`，也可以由前端从 iframe 嵌入代码中提取。

```json
{
  "title": "冬日祭舞台剧完整录像",
  "url": "https://player.bilibili.com/player.html?bvid=BVxxxxxxxxxx",
  "type": "bilibili",
  "thumbnail": "https://example.com/cover.jpg",
  "category": "winter"
}
```

`category` 可选值：

- `winter`
- `anniversary`
- `gma`
- `daily`

### DELETE `/videos/:id`

删除指定视频。

## 聊天接口

### POST `/chat-messages`

由本地 API 转发到 Dify，避免前端暴露 Dify App Key。

请求：

```json
{
  "query": "今年 GMA 是什么时候？",
  "conversation_id": "",
  "user": "user-xxxx"
}
```

响应：

```json
{
  "answer": "这里是 AI 助手返回的回答。",
  "conversation_id": "conversation-id",
  "message_id": "message-id"
}
```

如果未配置 `DIFY_API_KEY`，接口会返回一条可展示的配置提示，而不是让前端崩溃。

## 微信图片说明

RSS 同步会优先读取 `<enclosure type="image/*">` 中的封面地址，其次从正文 HTML 中提取第一张图片。同步后的 `coverUrl` 会返回给前端直接展示；如果旧数据中存在不可访问的本地 `/uploads/...` 封面，再次同步时会用 RSS 封面回填。

## 公众号 RSS 同步接口

### POST `/wechat-articles/sync`

管理员接口。后端会读取 `WECHAT_RSS_FEED_URLS` 配置，从 `we-mp-rss` 拉取 RSS/Atom 内容，按 `sourceName + externalId` 和文章 URL 去重后写入 `wechat_articles`。

`sourceName` 保留 RSS 同步名；`displaySourceName` 是官网展示名。两者不一致时，用环境变量配置映射：

```ini
WECHAT_RSS_DISPLAY_NAME_MAP=番剧鉴赏组=涧桐现视研
```

请求头：

```http
Authorization: Bearer <admin-token>
```

响应：

```json
{
  "fetched": 2,
  "created": 2,
  "skipped": 0,
  "failed": 0
}
```

同步后的文章示例：

```json
{
  "id": "uuid",
  "title": "公众号推文标题",
  "summary": "摘要",
  "coverUrl": "https://mmbiz.qpic.cn/...",
  "wechatUrl": "https://mp.weixin.qq.com/s/...",
  "publishedAt": "2026-07-02",
  "isPublished": true,
  "sortOrder": 0,
  "sourceName": "番剧鉴赏组",
  "displaySourceName": "涧桐现视研",
  "externalId": "rss-guid"
}
```

本地 Docker 部署时，`we-mp-rss` 由 `docker-compose.yml` 启动，默认只监听 `127.0.0.1:8001`，不会对公网开放。
