package httpserver

import (
	"bytes"
	"encoding/json"
	"errors"
	"html"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"yanfeng-homepage/backend/internal/auth"
	"yanfeng-homepage/backend/internal/config"
	"yanfeng-homepage/backend/internal/models"
	"yanfeng-homepage/backend/internal/wechatrss"
)

const maxUploadBytes = 8 * 1024 * 1024

var (
	allowedVideoCategories  = map[string]bool{"winter": true, "anniversary": true, "gma": true, "daily": true}
	allowedImageCategories  = map[string]bool{"gallery": true, "album": true}
	allowedUploadCategories = map[string]bool{"gallery": true, "album": true, "thumbnail": true, "wechat": true}
	allowedUploadTypes      = map[string]string{"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
)

type Dependencies struct {
	Config     config.Config
	DB         *gorm.DB
	Logger     *zap.Logger
	HTTPClient *http.Client
}

type Handler struct {
	cfg        config.Config
	db         *gorm.DB
	logger     *zap.Logger
	httpClient *http.Client
	auth       *auth.Service
}

type httpError struct {
	status  int
	message string
}

func (e httpError) Error() string {
	return e.message
}

func NewRouter(deps Dependencies) *gin.Engine {
	logger := deps.Logger
	if logger == nil {
		logger = zap.NewNop()
	}
	client := deps.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}

	h := &Handler{
		cfg:        deps.Config,
		db:         deps.DB,
		logger:     logger,
		httpClient: client,
		auth: auth.NewService(
			deps.Config.AdminPassword,
			deps.Config.SigningSecret(),
			deps.Config.JWTTTL,
			auth.AllowAllAuthorizer{},
		),
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(corsMiddleware(deps.Config.CORSOrigin))

	registerRoutes(router.Group(""), h)
	registerRoutes(router.Group("/api"), h)

	uploadDir := filepath.Join(deps.Config.PublicDir, "uploads")
	router.StaticFS("/uploads", gin.Dir(uploadDir, false))
	router.StaticFS("/api/uploads", gin.Dir(uploadDir, false))

	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})
	return router
}

func registerRoutes(group *gin.RouterGroup, h *Handler) {
	group.POST("/admin/login", h.login)

	group.GET("/articles", h.listArticles)
	group.GET("/wechat-articles", h.listPublicWechatArticles)
	group.GET("/wechat-articles/admin", h.requireAdmin("wechat_articles", "read"), h.listAdminWechatArticles)
	group.POST("/wechat-articles/parse", h.requireAdmin("wechat_articles", "parse"), h.parseWechatArticle)
	group.POST("/wechat-articles/sync", h.requireAdmin("wechat_articles", "sync"), h.syncWechatArticles)
	group.POST("/wechat-articles", h.requireAdmin("wechat_articles", "create"), h.createWechatArticle)
	group.PATCH("/wechat-articles/:id", h.requireAdmin("wechat_articles", "update"), h.updateWechatArticle)
	group.DELETE("/wechat-articles/:id", h.requireAdmin("wechat_articles", "delete"), h.deleteWechatArticle)

	group.GET("/videos", h.listVideos)
	group.POST("/videos", h.requireAdmin("videos", "create"), h.createVideo)
	group.PATCH("/videos/:id", h.requireAdmin("videos", "update"), h.updateVideo)
	group.DELETE("/videos/:id", h.requireAdmin("videos", "delete"), h.deleteVideo)

	group.GET("/site-settings", h.getSiteSettings)
	group.PATCH("/site-settings", h.requireAdmin("site_settings", "update"), h.updateSiteSettings)

	group.GET("/media-images", h.listMediaImages)
	group.POST("/media-images", h.requireAdmin("media_images", "create"), h.createMediaImage)
	group.PATCH("/media-images/:id", h.requireAdmin("media_images", "update"), h.updateMediaImage)
	group.DELETE("/media-images/:id", h.requireAdmin("media_images", "delete"), h.deleteMediaImage)

	group.POST("/uploads", h.requireAdmin("uploads", "create"), h.uploadFile)
	group.POST("/chat-messages", h.proxyDifyChat)
}

func corsMiddleware(origin string) gin.HandlerFunc {
	if origin == "" {
		origin = "*"
	}
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
		c.Next()
	}
}

func (h *Handler) login(c *gin.Context) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		respondError(c, err)
		return
	}

	password := strings.TrimSpace(stringValue(payload["message"]))
	if password == "" {
		password = strings.TrimSpace(stringValue(payload["password"]))
	}

	session, err := h.auth.Login(password)
	if err != nil {
		respondError(c, httpError{status: http.StatusUnauthorized, message: "Invalid admin password"})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (h *Handler) requireAdmin(object string, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		if !strings.HasPrefix(header, "Bearer ") {
			token = ""
		}
		if _, err := h.auth.Verify(token, object, action); err != nil {
			respondError(c, httpError{status: http.StatusUnauthorized, message: "Admin token is required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func (h *Handler) listArticles(c *gin.Context) {
	var rows []models.Article
	if err := h.db.Order("date DESC").Order("created_at DESC").Find(&rows).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *Handler) listPublicWechatArticles(c *gin.Context) {
	h.listWechatArticles(c, true)
}

func (h *Handler) listAdminWechatArticles(c *gin.Context) {
	h.listWechatArticles(c, false)
}

func (h *Handler) listWechatArticles(c *gin.Context, publicOnly bool) {
	query := h.db.Order("sort_order DESC").Order("published_at DESC").Order("created_at DESC")
	if publicOnly {
		query = query.Where("is_published = ?", true)
	}

	var rows []models.WechatArticle
	if err := query.Find(&rows).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *Handler) parseWechatArticle(c *gin.Context) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		respondError(c, err)
		return
	}

	wechatURL := strings.TrimSpace(firstString(payload, "wechatUrl", "wechat_url"))
	if !isAllowedWechatArticleURL(wechatURL) {
		respondError(c, httpError{status: http.StatusBadRequest, message: "A valid WeChat article URL is required"})
		return
	}

	result := gin.H{"wechatUrl": wechatURL, "title": "", "summary": "", "coverUrl": "", "publishedAt": ""}
	req, err := http.NewRequest(http.MethodGet, wechatURL, nil)
	if err != nil {
		c.JSON(http.StatusOK, result)
		return
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 YanfengClubBot/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, result)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.JSON(http.StatusOK, result)
		return
	}
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusOK, result)
		return
	}
	meta := extractWechatArticleMeta(string(raw))
	meta["wechatUrl"] = wechatURL
	c.JSON(http.StatusOK, meta)
}

func (h *Handler) syncWechatArticles(c *gin.Context) {
	if len(h.cfg.WechatRSSFeedURLs) == 0 {
		respondError(c, httpError{status: http.StatusBadRequest, message: "WECHAT_RSS_FEED_URLS is required"})
		return
	}

	service := wechatrss.NewService(h.db, h.httpClient, wechatrss.Config{
		BaseURL:      h.cfg.WechatRSSBaseURL,
		FeedURLs:     h.cfg.WechatRSSFeedURLs,
		MaxArticles:  h.cfg.WechatRSSMaxArticles,
		DisplayNames: h.cfg.WechatRSSDisplayNames,
	})
	result, err := service.Sync(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) createWechatArticle(c *gin.Context) {
	row, err := normalizeWechatArticle(c, "")
	if err != nil {
		respondError(c, err)
		return
	}
	if err := h.db.Create(&row).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *Handler) updateWechatArticle(c *gin.Context) {
	id := c.Param("id")
	row, err := normalizeWechatArticle(c, id)
	if err != nil {
		respondError(c, err)
		return
	}

	var existing models.WechatArticle
	if err := h.db.First(&existing, "id = ?", id).Error; err != nil {
		respondNotFoundOrError(c, err, "Wechat article not found")
		return
	}
	existing.Title = row.Title
	existing.Summary = row.Summary
	existing.CoverURL = row.CoverURL
	existing.WechatURL = row.WechatURL
	existing.PublishedAt = row.PublishedAt
	existing.IsPublished = row.IsPublished
	existing.SortOrder = row.SortOrder
	existing.SourceName = row.SourceName
	existing.DisplaySourceName = row.DisplaySourceName
	existing.ExternalID = row.ExternalID
	if err := h.db.Save(&existing).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, existing)
}

func (h *Handler) deleteWechatArticle(c *gin.Context) {
	h.deleteByID(c, &models.WechatArticle{}, "Wechat article not found")
}

func (h *Handler) listVideos(c *gin.Context) {
	var rows []models.Video
	if err := h.db.Order("sort_order DESC").Order("created_at DESC").Find(&rows).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *Handler) createVideo(c *gin.Context) {
	row, err := normalizeVideo(c, "")
	if err != nil {
		respondError(c, err)
		return
	}
	if err := h.db.Create(&row).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *Handler) updateVideo(c *gin.Context) {
	id := c.Param("id")
	row, err := normalizeVideo(c, id)
	if err != nil {
		respondError(c, err)
		return
	}

	var existing models.Video
	if err := h.db.First(&existing, "id = ?", id).Error; err != nil {
		respondNotFoundOrError(c, err, "Video not found")
		return
	}
	existing.Title = row.Title
	existing.URL = row.URL
	existing.Type = row.Type
	existing.Thumbnail = row.Thumbnail
	existing.Category = row.Category
	if err := h.db.Save(&existing).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, existing)
}

func (h *Handler) deleteVideo(c *gin.Context) {
	h.deleteByID(c, &models.Video{}, "Video not found")
}

func (h *Handler) getSiteSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"mainGroupNumber": h.mainGroupNumber()})
}

func (h *Handler) updateSiteSettings(c *gin.Context) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		respondError(c, err)
		return
	}
	mainGroupNumber := strings.TrimSpace(stringValue(payload["mainGroupNumber"]))
	if mainGroupNumber == "" {
		respondError(c, httpError{status: http.StatusBadRequest, message: "Main QQ group number is required"})
		return
	}

	row := models.SiteSetting{Key: "main_group_number", Value: mainGroupNumber}
	if err := h.db.Save(&row).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"mainGroupNumber": mainGroupNumber})
}

func (h *Handler) mainGroupNumber() string {
	var row models.SiteSetting
	if err := h.db.First(&row, "`key` = ?", "main_group_number").Error; err != nil || row.Value == "" {
		return "737508445"
	}
	return row.Value
}

func (h *Handler) listMediaImages(c *gin.Context) {
	var rows []models.MediaImage
	if err := h.db.Order("sort_order DESC").Order("created_at DESC").Find(&rows).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *Handler) createMediaImage(c *gin.Context) {
	row, err := normalizeMediaImage(c, "")
	if err != nil {
		respondError(c, err)
		return
	}
	if err := h.db.Create(&row).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *Handler) updateMediaImage(c *gin.Context) {
	id := c.Param("id")
	row, err := normalizeMediaImage(c, id)
	if err != nil {
		respondError(c, err)
		return
	}

	var existing models.MediaImage
	if err := h.db.First(&existing, "id = ?", id).Error; err != nil {
		respondNotFoundOrError(c, err, "Image not found")
		return
	}
	existing.Title = row.Title
	existing.ImageURL = row.ImageURL
	existing.Category = row.Category
	if err := h.db.Save(&existing).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, existing)
}

func (h *Handler) deleteMediaImage(c *gin.Context) {
	h.deleteByID(c, &models.MediaImage{}, "Image not found")
}

func (h *Handler) uploadFile(c *gin.Context) {
	category := strings.TrimSpace(c.PostForm("category"))
	if category == "" {
		category = "gallery"
	}
	if !allowedUploadCategories[category] {
		respondError(c, httpError{status: http.StatusBadRequest, message: "Invalid upload category"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		respondError(c, httpError{status: http.StatusBadRequest, message: "Image file is required"})
		return
	}
	if file.Size > maxUploadBytes {
		respondError(c, httpError{status: http.StatusBadRequest, message: "Image must be 8 MB or smaller"})
		return
	}

	contentType := strings.ToLower(file.Header.Get("Content-Type"))
	extension := allowedUploadTypes[contentType]
	if extension == "" {
		respondError(c, httpError{status: http.StatusBadRequest, message: "Only JPG, PNG, and WebP uploads are allowed"})
		return
	}

	id := uuid.NewString()
	year := strconv.Itoa(time.Now().Year())
	key := filepath.ToSlash(filepath.Join("uploads", category, year, id+"."+extension))
	outputPath := filepath.Join(h.cfg.PublicDir, key)
	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		respondError(c, err)
		return
	}
	if err := c.SaveUploadedFile(file, outputPath); err != nil {
		respondError(c, err)
		return
	}

	row := models.Upload{
		ID:          id,
		Key:         key,
		URL:         "/" + key,
		Filename:    file.Filename,
		ContentType: contentType,
		ByteSize:    file.Size,
	}
	if err := h.db.Create(&row).Error; err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *Handler) proxyDifyChat(c *gin.Context) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		respondError(c, err)
		return
	}

	query := strings.TrimSpace(firstString(payload, "query", "message"))
	if query == "" {
		respondError(c, httpError{status: http.StatusBadRequest, message: "Message is required"})
		return
	}

	if h.cfg.DifyAPIKey == "" {
		c.JSON(http.StatusOK, gin.H{"answer": "AI assistant is not configured yet."})
		return
	}

	apiURL := strings.TrimRight(h.cfg.DifyAPIURL, "/")
	if apiURL == "" {
		apiURL = "https://api.dify.ai/v1"
	}

	requestBody := map[string]any{
		"inputs":          valueOrDefault(payload["inputs"], map[string]any{}),
		"query":           query,
		"response_mode":   "blocking",
		"conversation_id": stringValue(payload["conversation_id"]),
		"user":            valueOrDefault(payload["user"], "yanfeng-web"),
		"files":           valueOrDefault(payload["files"], []any{}),
	}
	raw, _ := json.Marshal(requestBody)
	req, err := http.NewRequest(http.MethodPost, apiURL+"/chat-messages", bytes.NewReader(raw))
	if err != nil {
		respondError(c, err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+h.cfg.DifyAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		h.logger.Warn("dify request failed", zap.Error(err))
		c.JSON(http.StatusBadGateway, gin.H{"answer": "Chat service is temporarily unavailable."})
		return
	}
	defer resp.Body.Close()

	responseText, _ := io.ReadAll(resp.Body)
	var data map[string]any
	if err := json.Unmarshal(responseText, &data); err != nil {
		data = map[string]any{"answer": string(responseText)}
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		h.logger.Warn("dify returned non-2xx", zap.Int("status", resp.StatusCode))
		c.JSON(http.StatusBadGateway, gin.H{"answer": "Chat service is temporarily unavailable."})
		return
	}

	answer := stringValue(data["answer"])
	if answer == "" {
		answer = "I do not have an answer yet."
	}
	c.JSON(http.StatusOK, gin.H{
		"answer":          answer,
		"conversation_id": data["conversation_id"],
		"message_id":      data["message_id"],
	})
}

func (h *Handler) deleteByID(c *gin.Context, model any, notFound string) {
	result := h.db.Delete(model, "id = ?", c.Param("id"))
	if result.Error != nil {
		respondError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 {
		respondError(c, httpError{status: http.StatusNotFound, message: notFound})
		return
	}
	c.Status(http.StatusNoContent)
}

func normalizeWechatArticle(c *gin.Context, id string) (models.WechatArticle, error) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		return models.WechatArticle{}, err
	}

	wechatURL := strings.TrimSpace(firstString(payload, "wechatUrl", "wechat_url"))
	if !isAllowedWechatArticleURL(wechatURL) {
		return models.WechatArticle{}, httpError{status: http.StatusBadRequest, message: "A valid WeChat article URL is required"}
	}

	title := strings.TrimSpace(stringValue(payload["title"]))
	if title == "" {
		title = "未命名公众号推文"
	}
	publishedAt := strings.TrimSpace(firstString(payload, "publishedAt", "published_at"))
	if publishedAt == "" {
		publishedAt = time.Now().Format("2006-01-02")
	}
	coverURL := strings.TrimSpace(firstString(payload, "coverUrl", "cover_url"))
	if coverURL != "" && !isAllowedImageURL(coverURL) {
		return models.WechatArticle{}, httpError{status: http.StatusBadRequest, message: "A valid cover image URL is required"}
	}

	isPublished := true
	if value, ok := firstValue(payload, "isPublished", "is_published"); ok {
		isPublished = boolValue(value)
	}
	sortOrder := intValue(firstValueOrNil(payload, "sortOrder", "sort_order"))
	if id == "" {
		id = strings.TrimSpace(stringValue(payload["id"]))
	}
	if id == "" {
		id = uuid.NewString()
	}

	return models.WechatArticle{
		ID:                id,
		Title:             title,
		Summary:           strings.TrimSpace(stringValue(payload["summary"])),
		CoverURL:          coverURL,
		WechatURL:         wechatURL,
		PublishedAt:       publishedAt,
		IsPublished:       isPublished,
		SortOrder:         sortOrder,
		SourceName:        strings.TrimSpace(firstString(payload, "sourceName", "source_name")),
		DisplaySourceName: strings.TrimSpace(firstString(payload, "displaySourceName", "display_source_name")),
		ExternalID:        strings.TrimSpace(firstString(payload, "externalId", "external_id")),
	}, nil
}

func normalizeVideo(c *gin.Context, id string) (models.Video, error) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		return models.Video{}, err
	}

	title := strings.TrimSpace(stringValue(payload["title"]))
	if title == "" {
		return models.Video{}, httpError{status: http.StatusBadRequest, message: "Video title is required"}
	}
	videoURL := strings.TrimSpace(stringValue(payload["url"]))
	if !isAllowedBilibiliPlayerURL(videoURL) {
		return models.Video{}, httpError{status: http.StatusBadRequest, message: "A valid Bilibili player URL is required"}
	}
	category := strings.TrimSpace(stringValue(payload["category"]))
	if category == "" {
		category = "daily"
	}
	if !allowedVideoCategories[category] {
		return models.Video{}, httpError{status: http.StatusBadRequest, message: "Invalid video category"}
	}
	thumbnail := strings.TrimSpace(stringValue(payload["thumbnail"]))
	if thumbnail != "" && !isAllowedImageURL(thumbnail) {
		return models.Video{}, httpError{status: http.StatusBadRequest, message: "A valid thumbnail image URL is required"}
	}
	if id == "" {
		id = strings.TrimSpace(stringValue(payload["id"]))
	}
	if id == "" {
		id = strconv.FormatInt(time.Now().UnixMilli(), 10)
	}
	return models.Video{ID: id, Title: title, URL: videoURL, Type: "bilibili", Thumbnail: thumbnail, Category: category}, nil
}

func normalizeMediaImage(c *gin.Context, id string) (models.MediaImage, error) {
	var payload map[string]any
	if err := bindJSON(c, &payload); err != nil {
		return models.MediaImage{}, err
	}

	title := strings.TrimSpace(stringValue(payload["title"]))
	if title == "" {
		return models.MediaImage{}, httpError{status: http.StatusBadRequest, message: "Image title is required"}
	}
	imageURL := strings.TrimSpace(firstString(payload, "imageUrl", "image_url"))
	if !isAllowedImageURL(imageURL) {
		return models.MediaImage{}, httpError{status: http.StatusBadRequest, message: "A valid image URL is required"}
	}
	category := strings.TrimSpace(stringValue(payload["category"]))
	if !allowedImageCategories[category] {
		return models.MediaImage{}, httpError{status: http.StatusBadRequest, message: "Invalid image category"}
	}
	if id == "" {
		id = strings.TrimSpace(stringValue(payload["id"]))
	}
	if id == "" {
		id = strconv.FormatInt(time.Now().UnixMilli(), 10)
	}
	return models.MediaImage{ID: id, Title: title, ImageURL: imageURL, Category: category}, nil
}

func bindJSON(c *gin.Context, target any) error {
	if c.Request.Body == nil {
		return nil
	}
	if err := c.ShouldBindJSON(target); err != nil && !errors.Is(err, io.EOF) {
		return httpError{status: http.StatusBadRequest, message: "Invalid JSON body"}
	}
	return nil
}

func respondNotFoundOrError(c *gin.Context, err error, notFound string) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, httpError{status: http.StatusNotFound, message: notFound})
		return
	}
	respondError(c, err)
}

func respondError(c *gin.Context, err error) {
	var typed httpError
	if errors.As(err, &typed) {
		c.JSON(typed.status, gin.H{"error": typed.message})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
}

func isAllowedBilibiliPlayerURL(value string) bool {
	parsed, err := url.Parse(value)
	return err == nil && parsed.Scheme == "https" && parsed.Hostname() == "player.bilibili.com"
}

func isAllowedImageURL(value string) bool {
	if strings.HasPrefix(value, "/") && !strings.HasPrefix(value, "//") {
		return true
	}
	parsed, err := url.Parse(value)
	return err == nil && (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Hostname() != ""
}

func isAllowedWechatArticleURL(value string) bool {
	parsed, err := url.Parse(value)
	return err == nil &&
		(parsed.Scheme == "https" || parsed.Scheme == "http") &&
		strings.HasSuffix(parsed.Hostname(), "mp.weixin.qq.com")
}

func extractWechatArticleMeta(raw string) gin.H {
	title := firstNonEmpty(
		extractScriptString(raw, "msg_title"),
		extractMetaContent(raw, "property", "og:title"),
		extractMetaContent(raw, "name", "twitter:title"),
		extractTitleTag(raw),
	)
	summary := firstNonEmpty(
		extractScriptString(raw, "msg_desc"),
		extractMetaContent(raw, "property", "og:description"),
		extractMetaContent(raw, "name", "description"),
	)
	coverURL := firstNonEmpty(
		extractScriptString(raw, "msg_cdn_url"),
		extractMetaContent(raw, "property", "og:image"),
		extractMetaContent(raw, "name", "twitter:image"),
	)
	publishedAt := firstNonEmpty(
		extractPublishedDate(raw),
		left(extractMetaContent(raw, "property", "article:published_time"), 10),
	)
	return gin.H{
		"title":       cleanText(title),
		"summary":     cleanText(summary),
		"coverUrl":    cleanText(coverURL),
		"publishedAt": cleanText(publishedAt),
	}
}

func extractMetaContent(raw string, attribute string, value string) string {
	attr := regexp.QuoteMeta(attribute)
	val := regexp.QuoteMeta(value)
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)<meta\s+[^>]*` + attr + `=["']` + val + `["'][^>]*content=["']([^"']*)["'][^>]*>`),
		regexp.MustCompile(`(?i)<meta\s+[^>]*content=["']([^"']*)["'][^>]*` + attr + `=["']` + val + `["'][^>]*>`),
	}
	for _, pattern := range patterns {
		if match := pattern.FindStringSubmatch(raw); len(match) > 1 {
			return html.UnescapeString(match[1])
		}
	}
	return ""
}

func extractScriptString(raw string, variableName string) string {
	pattern := regexp.MustCompile(`(?is)(?:var\s+)?` + regexp.QuoteMeta(variableName) + `\s*=\s*(['"])(.*?)\1`)
	match := pattern.FindStringSubmatch(raw)
	if len(match) < 3 {
		return ""
	}
	return html.UnescapeString(strings.NewReplacer(`\/`, "/", `\n`, "\n", `\"`, `"`, `\'`, `'`).Replace(match[2]))
}

func extractTitleTag(raw string) string {
	pattern := regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)
	match := pattern.FindStringSubmatch(raw)
	if len(match) < 2 {
		return ""
	}
	return html.UnescapeString(match[1])
}

func extractPublishedDate(raw string) string {
	pattern := regexp.MustCompile(`(?i)(?:var\s+)?ct\s*=\s*["'](\d{9,})["']`)
	match := pattern.FindStringSubmatch(raw)
	if len(match) < 2 {
		return ""
	}
	seconds, err := strconv.ParseInt(match[1], 10, 64)
	if err != nil {
		return ""
	}
	return time.Unix(seconds, 0).UTC().Format("2006-01-02")
}

func cleanText(value string) string {
	return strings.TrimSpace(regexp.MustCompile(`\s+`).ReplaceAllString(value, " "))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func left(value string, length int) string {
	if len(value) < length {
		return value
	}
	return value[:length]
}

func firstString(payload map[string]any, keys ...string) string {
	return stringValue(firstValueOrNil(payload, keys...))
}

func firstValueOrNil(payload map[string]any, keys ...string) any {
	value, _ := firstValue(payload, keys...)
	return value
}

func firstValue(payload map[string]any, keys ...string) (any, bool) {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			return value, true
		}
	}
	return nil, false
}

func valueOrDefault(value any, fallback any) any {
	if value == nil || stringValue(value) == "" {
		return fallback
	}
	return value
}

func stringValue(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case json.Number:
		return typed.String()
	case nil:
		return ""
	default:
		return strings.TrimSpace(strings.Trim(string(mustJSON(typed)), `"`))
	}
}

func boolValue(value any) bool {
	switch typed := value.(type) {
	case bool:
		return typed
	case string:
		return typed == "true" || typed == "1"
	default:
		return false
	}
}

func intValue(value any) int {
	switch typed := value.(type) {
	case float64:
		return int(typed)
	case int:
		return typed
	case json.Number:
		value, _ := typed.Int64()
		return int(value)
	case string:
		value, _ := strconv.Atoi(typed)
		return value
	default:
		return 0
	}
}

func mustJSON(value any) []byte {
	raw, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	return raw
}
