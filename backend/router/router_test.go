package router_test

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"yanfeng-homepage/backend/conf"
	"yanfeng-homepage/backend/dal"
	"yanfeng-homepage/backend/model"
	"yanfeng-homepage/backend/router"
)

func TestAdminLoginAndProtectedRoute(t *testing.T) {
	router, _ := newTestRouter(t)

	unauthorized := performJSON(router, http.MethodPatch, "/api/site-settings", map[string]string{
		"mainGroupNumber": "123456",
	}, "")
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("expected protected route to reject missing token, got %d body=%s", unauthorized.Code, unauthorized.Body.String())
	}

	token := login(t, router)
	updated := performJSON(router, http.MethodPatch, "/site-settings", map[string]string{
		"mainGroupNumber": "123456",
	}, token)
	if updated.Code != http.StatusOK {
		t.Fatalf("expected settings update through naked path to pass, got %d body=%s", updated.Code, updated.Body.String())
	}

	var body map[string]string
	decodeJSON(t, updated.Body, &body)
	if body["mainGroupNumber"] != "123456" {
		t.Fatalf("expected frontend camelCase response, got %#v", body)
	}
}

func TestVideoCRUDKeepsFrontendContract(t *testing.T) {
	router, _ := newTestRouter(t)
	token := login(t, router)

	create := performJSON(router, http.MethodPost, "/api/videos", map[string]string{
		"title":     "测试视频",
		"url":       "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD",
		"thumbnail": "/uploads/thumbnail/2026/demo.jpg",
		"category":  "daily",
	}, token)
	if create.Code != http.StatusCreated {
		t.Fatalf("expected video create to return 201, got %d body=%s", create.Code, create.Body.String())
	}

	var created map[string]any
	decodeJSON(t, create.Body, &created)
	id, _ := created["id"].(string)
	if id == "" || created["type"] != "bilibili" {
		t.Fatalf("expected created video id and bilibili type, got %#v", created)
	}

	update := performJSON(router, http.MethodPatch, "/api/videos/"+id, map[string]string{
		"title":     "测试视频更新",
		"url":       "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD",
		"thumbnail": "/uploads/thumbnail/2026/demo.jpg",
		"category":  "daily",
	}, token)
	if update.Code != http.StatusOK {
		t.Fatalf("expected video update to return 200, got %d body=%s", update.Code, update.Body.String())
	}

	list := performJSON(router, http.MethodGet, "/videos", nil, "")
	if list.Code != http.StatusOK {
		t.Fatalf("expected naked list path to pass, got %d body=%s", list.Code, list.Body.String())
	}

	deleteResp := performJSON(router, http.MethodDelete, "/api/videos/"+id, nil, token)
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("expected video delete 204 empty body, got %d body=%q", deleteResp.Code, deleteResp.Body.String())
	}
}

func TestWechatArticlesFilteringAndOrdering(t *testing.T) {
	router, _ := newTestRouter(t)
	token := login(t, router)

	createWechatArticle(t, router, token, map[string]any{
		"title":       "草稿",
		"wechatUrl":   "https://mp.weixin.qq.com/s/draft",
		"publishedAt": "2026-06-01",
		"isPublished": false,
		"sortOrder":   99,
	})
	createWechatArticle(t, router, token, map[string]any{
		"title":       "低排序",
		"wechatUrl":   "https://mp.weixin.qq.com/s/low",
		"publishedAt": "2026-06-01",
		"isPublished": true,
		"sortOrder":   1,
	})
	createWechatArticle(t, router, token, map[string]any{
		"title":       "高排序",
		"wechatUrl":   "https://mp.weixin.qq.com/s/high",
		"publishedAt": "2026-06-02",
		"isPublished": true,
		"sortOrder":   5,
	})

	public := performJSON(router, http.MethodGet, "/api/wechat-articles", nil, "")
	if public.Code != http.StatusOK {
		t.Fatalf("expected public articles to pass, got %d body=%s", public.Code, public.Body.String())
	}

	var articles []map[string]any
	decodeJSON(t, public.Body, &articles)
	if len(articles) != 2 || articles[0]["title"] != "高排序" || articles[1]["title"] != "低排序" {
		t.Fatalf("expected only published articles sorted by sortOrder, got %#v", articles)
	}

	admin := performJSON(router, http.MethodGet, "/api/wechat-articles/admin", nil, token)
	if admin.Code != http.StatusOK {
		t.Fatalf("expected admin articles to pass, got %d body=%s", admin.Code, admin.Body.String())
	}
	var all []map[string]any
	decodeJSON(t, admin.Body, &all)
	if len(all) != 3 {
		t.Fatalf("expected admin list to include drafts, got %#v", all)
	}
}

func TestWechatArticleSyncImportsRSSFeedAndSkipsDuplicates(t *testing.T) {
	feedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
		_, _ = w.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>番剧鉴赏组</title>
    <item>
      <title>第一次同步的推文</title>
      <link>https://mp.weixin.qq.com/s/sync-one</link>
      <guid>sync-one-guid</guid>
      <pubDate>Mon, 01 Jul 2026 10:00:00 +0800</pubDate>
      <description>这是一篇测试摘要。</description>
      <enclosure url="https://example.com/cover-from-enclosure.jpg" length="0" type="image/jpeg"></enclosure>
    </item>
    <item>
      <title>第二篇推文</title>
      <link>https://mp.weixin.qq.com/s/sync-two</link>
      <guid>sync-two-guid</guid>
      <pubDate>2026-07-02</pubDate>
      <description>第二篇摘要</description>
    </item>
  </channel>
</rss>`))
	}))
	defer feedServer.Close()

	router, _ := newTestRouterWithConfig(t, func(cfg *conf.Config) {
		cfg.WechatRSSFeedURLs = []string{feedServer.URL + "/feed.xml"}
		cfg.WechatRSSDisplayNames = map[string]string{"番剧鉴赏组": "涧桐现视研"}
	})
	token := login(t, router)

	unauthorized := performJSON(router, http.MethodPost, "/api/wechat-articles/sync", nil, "")
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("expected sync to require admin token, got %d body=%s", unauthorized.Code, unauthorized.Body.String())
	}

	firstSync := performJSON(router, http.MethodPost, "/api/wechat-articles/sync", nil, token)
	if firstSync.Code != http.StatusOK {
		t.Fatalf("expected first sync to pass, got %d body=%s", firstSync.Code, firstSync.Body.String())
	}
	var firstResult map[string]any
	decodeJSON(t, firstSync.Body, &firstResult)
	if firstResult["fetched"] != float64(2) || firstResult["created"] != float64(2) || firstResult["skipped"] != float64(0) {
		t.Fatalf("expected first sync to import two articles, got %#v", firstResult)
	}

	list := performJSON(router, http.MethodGet, "/api/wechat-articles", nil, "")
	var articles []map[string]any
	decodeJSON(t, list.Body, &articles)
	syncedArticles := make([]map[string]any, 0, 2)
	for _, article := range articles {
		if article["sourceName"] == "番剧鉴赏组" {
			syncedArticles = append(syncedArticles, article)
		}
	}
	if len(syncedArticles) != 2 {
		t.Fatalf("expected two synced articles, got %#v", articles)
	}
	if syncedArticles[0]["title"] != "第二篇推文" || syncedArticles[1]["title"] != "第一次同步的推文" {
		t.Fatalf("expected synced articles ordered by published date, got %#v", syncedArticles)
	}
	if syncedArticles[1]["sourceName"] != "番剧鉴赏组" || syncedArticles[1]["displaySourceName"] != "涧桐现视研" || syncedArticles[1]["externalId"] != "sync-one-guid" {
		t.Fatalf("expected source metadata to be exposed, got %#v", syncedArticles[1])
	}
	if syncedArticles[1]["coverUrl"] != "https://example.com/cover-from-enclosure.jpg" {
		t.Fatalf("expected cover URL from RSS enclosure, got %#v", syncedArticles[1])
	}

	secondSync := performJSON(router, http.MethodPost, "/api/wechat-articles/sync", nil, token)
	if secondSync.Code != http.StatusOK {
		t.Fatalf("expected second sync to pass, got %d body=%s", secondSync.Code, secondSync.Body.String())
	}
	var secondResult map[string]any
	decodeJSON(t, secondSync.Body, &secondResult)
	if secondResult["fetched"] != float64(2) || secondResult["created"] != float64(0) || secondResult["skipped"] != float64(2) {
		t.Fatalf("expected duplicate sync to skip both articles, got %#v", secondResult)
	}
}

func TestWechatArticleSyncBackfillsDuplicateCoverAndDisplaySource(t *testing.T) {
	feedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
		_, _ = w.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>番剧鉴赏组</title>
    <item>
      <title>已有旧文章</title>
      <link>https://mp.weixin.qq.com/s/existing-one</link>
      <guid>existing-one-guid</guid>
      <pubDate>Mon, 01 Jul 2026 10:00:00 +0800</pubDate>
      <description>已有旧文章摘要</description>
      <enclosure url="https://example.com/backfilled-cover.jpg" length="0" type="image/jpeg"></enclosure>
    </item>
  </channel>
</rss>`))
	}))
	defer feedServer.Close()

	router, db := newTestRouterWithConfig(t, func(cfg *conf.Config) {
		cfg.WechatRSSFeedURLs = []string{feedServer.URL + "/feed.xml"}
		cfg.WechatRSSDisplayNames = map[string]string{"番剧鉴赏组": "涧桐现视研"}
	})
	token := login(t, router)

	oldRow := model.WechatArticle{
		ID:          "existing-row",
		Title:       "已有旧文章",
		Summary:     "旧摘要",
		CoverURL:    "/uploads/wechat/missing.jpg",
		WechatURL:   "https://mp.weixin.qq.com/s/existing-one",
		PublishedAt: "2026-07-01",
		IsPublished: true,
		SourceName:  "番剧鉴赏组",
		ExternalID:  "existing-one-guid",
	}
	if err := db.Create(&oldRow).Error; err != nil {
		t.Fatalf("failed to seed old article: %v", err)
	}

	syncResp := performJSON(router, http.MethodPost, "/api/wechat-articles/sync", nil, token)
	if syncResp.Code != http.StatusOK {
		t.Fatalf("expected sync to pass, got %d body=%s", syncResp.Code, syncResp.Body.String())
	}
	var result map[string]any
	decodeJSON(t, syncResp.Body, &result)
	if result["created"] != float64(0) || result["skipped"] != float64(1) {
		t.Fatalf("expected duplicate article to be skipped without creating rows, got %#v", result)
	}

	var updated model.WechatArticle
	if err := db.First(&updated, "id = ?", oldRow.ID).Error; err != nil {
		t.Fatalf("failed to load updated article: %v", err)
	}
	if updated.CoverURL != "https://example.com/backfilled-cover.jpg" || updated.DisplaySourceName != "涧桐现视研" {
		t.Fatalf("expected duplicate sync to backfill metadata, got %#v", updated)
	}
}

func TestUploadValidationAndStaticServing(t *testing.T) {
	router, _ := newTestRouter(t)
	token := login(t, router)

	invalid := performMultipartUpload(t, router, "/api/uploads", "invalid", "image.png", "image/png", []byte("not-real-png"), token)
	if invalid.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid category to return 400, got %d body=%s", invalid.Code, invalid.Body.String())
	}

	created := performMultipartUpload(t, router, "/api/uploads", "gallery", "image.png", "image/png", []byte("png bytes"), token)
	if created.Code != http.StatusCreated {
		t.Fatalf("expected upload create to return 201, got %d body=%s", created.Code, created.Body.String())
	}

	var upload map[string]any
	decodeJSON(t, created.Body, &upload)
	url, _ := upload["url"].(string)
	if url == "" {
		t.Fatalf("expected upload URL, got %#v", upload)
	}

	staticResp := performJSON(router, http.MethodGet, url, nil, "")
	if staticResp.Code != http.StatusOK || staticResp.Body.String() != "png bytes" {
		t.Fatalf("expected uploaded file to be publicly readable, got %d body=%q", staticResp.Code, staticResp.Body.String())
	}
}

func TestDifyFallbackAndEmptyMessage(t *testing.T) {
	router, _ := newTestRouter(t)

	empty := performJSON(router, http.MethodPost, "/api/chat-messages", map[string]string{}, "")
	if empty.Code != http.StatusBadRequest {
		t.Fatalf("expected empty chat message to return 400, got %d body=%s", empty.Code, empty.Body.String())
	}

	fallback := performJSON(router, http.MethodPost, "/api/chat-messages", map[string]string{
		"query": "你好",
	}, "")
	if fallback.Code != http.StatusOK {
		t.Fatalf("expected unconfigured Dify fallback to return 200, got %d body=%s", fallback.Code, fallback.Body.String())
	}

	var body map[string]string
	decodeJSON(t, fallback.Body, &body)
	if body["answer"] != "AI assistant is not configured yet." {
		t.Fatalf("expected compatibility fallback answer, got %#v", body)
	}
}

func TestSeedFromDBJSONImportsExistingContent(t *testing.T) {
	router, db := newTestRouter(t)
	seedPath := filepath.Join(t.TempDir(), "db.json")
	seed := []byte(`{
		"videos": [{"id":"v1","title":"Seed Video","url":"https://player.bilibili.com/player.html?bvid=BV1xx411c7mD","type":"bilibili","thumbnail":"","category":"daily"}],
		"wechatArticles": [{"id":"w1","title":"Seed WeChat","summary":"","coverUrl":"","wechatUrl":"https://mp.weixin.qq.com/s/seed","publishedAt":"2026-06-01","isPublished":true,"sortOrder":0}],
		"mediaImages": [{"id":"m1","title":"Seed Image","imageUrl":"/uploads/gallery/2026/demo.jpg","category":"gallery"}],
		"siteSettings": {"mainGroupNumber":"737508445"},
		"uploads": []
	}`)
	if err := os.WriteFile(seedPath, seed, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := dal.SeedFromDBJSON(db, seedPath); err != nil {
		t.Fatalf("seed from db.json failed: %v", err)
	}

	videos := performJSON(router, http.MethodGet, "/api/videos", nil, "")
	var videoRows []map[string]any
	decodeJSON(t, videos.Body, &videoRows)
	if len(videoRows) != 1 || videoRows[0]["title"] != "Seed Video" {
		t.Fatalf("expected seeded videos through API, got %#v", videoRows)
	}
}

func newTestRouter(t *testing.T) (*gin.Engine, *gorm.DB) {
	t.Helper()
	return newTestRouterWithConfig(t, nil)
}

func newTestRouterWithConfig(t *testing.T, customize func(*conf.Config)) (*gin.Engine, *gorm.DB) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := dal.OpenSQLiteInMemory()
	if err != nil {
		t.Fatalf("open sqlite db: %v", err)
	}
	if err := dal.Migrate(db); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	publicDir := filepath.Join(t.TempDir(), "public")
	cfg := conf.Config{
		Port:          3001,
		CORSOrigin:    "*",
		AdminPassword: "secret",
		JWTSecret:     "test-secret",
		JWTTTL:        6 * time.Hour,
		PublicDir:     publicDir,
		DifyAPIURL:    "https://api.dify.ai/v1",
	}
	if customize != nil {
		customize(&cfg)
	}

	engine := router.NewRouter(router.Dependencies{
		Config: cfg,
		DB:     db,
		Logger: zap.NewNop(),
	})
	return engine, db
}

func login(t *testing.T, router http.Handler) string {
	t.Helper()

	resp := performJSON(router, http.MethodPost, "/api/admin/login", map[string]string{
		"message": "secret",
	}, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("login failed with %d body=%s", resp.Code, resp.Body.String())
	}

	var body map[string]any
	decodeJSON(t, resp.Body, &body)
	token, _ := body["token"].(string)
	if token == "" {
		t.Fatalf("expected token in login response, got %#v", body)
	}
	return token
}

func createWechatArticle(t *testing.T, router http.Handler, token string, payload map[string]any) {
	t.Helper()
	resp := performJSON(router, http.MethodPost, "/api/wechat-articles", payload, token)
	if resp.Code != http.StatusCreated {
		t.Fatalf("create wechat article failed with %d body=%s", resp.Code, resp.Body.String())
	}
}

func performJSON(router http.Handler, method string, path string, payload any, token string) *httptest.ResponseRecorder {
	var body io.Reader
	if payload != nil {
		raw, _ := json.Marshal(payload)
		body = bytes.NewReader(raw)
	}

	req := httptest.NewRequest(method, path, body)
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	return recorder
}

func performMultipartUpload(t *testing.T, router http.Handler, path string, category string, filename string, contentType string, content []byte, token string) *httptest.ResponseRecorder {
	t.Helper()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if err := writer.WriteField("category", category); err != nil {
		t.Fatal(err)
	}
	part, err := writer.CreatePart(map[string][]string{
		"Content-Disposition": {`form-data; name="file"; filename="` + filename + `"`},
		"Content-Type":        {contentType},
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodPost, path, &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	return recorder
}

func decodeJSON(t *testing.T, reader io.Reader, target any) {
	t.Helper()
	if err := json.NewDecoder(reader).Decode(target); err != nil {
		t.Fatalf("decode json failed: %v", err)
	}
}
