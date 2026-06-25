# 檐枫网站本地 API 文档

本项目当前使用 `server.mjs` 提供本地演示 API，默认地址为 `http://localhost:3001`。

## 数据源

- 文章和视频数据存储在 `db.json`
- AI 助手通过服务端读取 `DIFY_API_KEY` 后转发到 Dify
- 前端默认读取 `VITE_API_URL`，未配置时使用 `http://localhost:3001`

## 文章接口

### GET `/articles`

返回最新资讯列表。文章可以手动维护，也可以通过 `npm run crawl:wechat` 从微信公众号文章链接写入。

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
  "url": "https://player.bilibili.com/player.html?bvid=BV1GJ411x7h7",
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

## 公众号爬虫

脚本位置：`scripts/crawl-wechat.mjs`

默认读取：`scripts/wechat-urls.txt`

运行：

```bash
npm run crawl:wechat
```

临时指定链接：

```bash
npm run crawl:wechat -- https://mp.weixin.qq.com/s/xxx
```

Dry run：

```bash
npm run crawl:wechat -- --dry-run
```

当前爬虫解析字段：

- 标题
- 发布日期
- 摘要
- 来源公众号
- 原文链接
- 封面图

注意：这个脚本爬取“已知文章链接”。微信公众号公开侧没有稳定的文章列表接口，自动发现最新推文需要公众号后台权限或其他文章列表来源。

## 低频自动发现

脚本位置：`scripts/discover-wechat.mjs`

配置文件：`scripts/wechat-discover.config.json`

Dry run：

```bash
npm run discover:wechat -- --dry-run
```

发现并入库：

```bash
npm run discover:wechat
```

脚本会先尝试公众号公开历史页，再尝试搜狗微信搜索。发现新链接后会调用 `crawl-wechat.mjs` 完成解析、入库和封面下载。

这个方案适合低频定时任务，例如每天 `22:35` 或 `23:00` 执行一次。它不是官方接口，可能会遇到验证页或搜索延迟；如果要稳定生产化，仍建议接微信公众号官方后台接口。

日常同步推荐：

```bash
npm run discover:wechat -- --lookback-days=1
```

补漏同步推荐：

```bash
npm run discover:wechat -- --lookback-days=3
```
