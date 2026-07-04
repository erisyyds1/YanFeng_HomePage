package wechatrss_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"yanfeng-homepage/backend/dal"
	"yanfeng-homepage/backend/model"
	"yanfeng-homepage/backend/service/wechatrss"
)

func TestSyncPaginatesRSSFeedAutomatically(t *testing.T) {
	requestedOffsets := []int{}
	feedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
		requestedOffsets = append(requestedOffsets, offset)

		if limit != 2 {
			t.Fatalf("expected limit=2, got %d", limit)
		}

		w.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
		switch offset {
		case 0:
			_, _ = w.Write([]byte(rssFeed(
				rssItem("第一页-1", "https://mp.weixin.qq.com/s/page-1", "guid-1"),
				rssItem("第一页-2", "https://mp.weixin.qq.com/s/page-2", "guid-2"),
			)))
		case 2:
			_, _ = w.Write([]byte(rssFeed(
				rssItem("第二页-1", "https://mp.weixin.qq.com/s/page-3", "guid-3"),
			)))
		default:
			_, _ = w.Write([]byte(rssFeed()))
		}
	}))
	defer feedServer.Close()

	db, err := dal.OpenSQLiteInMemory()
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := dal.Migrate(db); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	service := wechatrss.NewService(db, feedServer.Client(), wechatrss.Config{
		FeedURLs: []string{
			feedServer.URL + "/feed.xml?limit=2",
			feedServer.URL + "/feed.xml?limit=2&offset=2",
		},
		MaxArticles: 2000,
		DisplayNames: map[string]string{
			"番剧鉴赏组": "涧桐现视研",
		},
	})

	result, err := service.Sync(context.Background())
	if err != nil {
		t.Fatalf("sync rss: %v", err)
	}
	if result.Fetched != 3 || result.Created != 3 || result.Skipped != 0 || result.Failed != 0 {
		t.Fatalf("unexpected sync result: %#v", result)
	}
	if fmt.Sprint(requestedOffsets) != "[0 2]" {
		t.Fatalf("expected automatic pagination offsets [0 2], got %v", requestedOffsets)
	}

	var rows []model.WechatArticle
	if err := db.Order("published_at ASC").Find(&rows).Error; err != nil {
		t.Fatalf("load rows: %v", err)
	}
	if len(rows) != 3 {
		t.Fatalf("expected 3 synced articles, got %d", len(rows))
	}
	if rows[0].DisplaySourceName != "涧桐现视研" {
		t.Fatalf("expected display source name mapping, got %#v", rows[0])
	}
}

func rssFeed(items ...string) string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>番剧鉴赏组</title>
    ` + strings.Join(items, "\n") + `
  </channel>
</rss>`
}

func rssItem(title string, link string, guid string) string {
	return fmt.Sprintf(`<item>
      <title>%s</title>
      <link>%s</link>
      <guid>%s</guid>
      <pubDate>2026-07-02</pubDate>
      <description>测试摘要</description>
    </item>`, title, link, guid)
}
