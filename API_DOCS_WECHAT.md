# 檐枫网站本地 API 文档

本项目当前使用 `server.mjs` 提供本地演示 API，默认地址为 `http://localhost:3001`。

## 数据源

- 文章和视频数据存储在 `db.json`
- AI 助手通过服务端读取 `DIFY_API_KEY` 后转发到 Dify
- 前端默认读取 `VITE_API_URL`，未配置时使用 `http://localhost:3001`

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

微信公众号图片常有防盗链限制。正式接入时建议后端抓取并存储封面图，再把稳定的 `coverUrl` 返回给前端。
