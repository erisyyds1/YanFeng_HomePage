package wechatrss

import (
	"context"
	"encoding/xml"
	"errors"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"yanfeng-homepage/backend/internal/models"
)

type Config struct {
	BaseURL      string
	FeedURLs     []string
	MaxArticles  int
	DisplayNames map[string]string
}

type Service struct {
	db         *gorm.DB
	httpClient *http.Client
	cfg        Config
}

type SyncResult struct {
	Fetched int      `json:"fetched"`
	Created int      `json:"created"`
	Skipped int      `json:"skipped"`
	Failed  int      `json:"failed"`
	Errors  []string `json:"errors,omitempty"`
}

type FeedArticle struct {
	Title             string
	Summary           string
	CoverURL          string
	WechatURL         string
	PublishedAt       string
	SourceName        string
	ExternalID        string
	DisplaySourceName string
}

func NewService(db *gorm.DB, httpClient *http.Client, cfg Config) *Service {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &Service{
		db:         db,
		httpClient: httpClient,
		cfg:        cfg,
	}
}

func (s *Service) Sync(ctx context.Context) (SyncResult, error) {
	var result SyncResult
	if s.db == nil {
		return result, errors.New("database is required")
	}
	if len(s.cfg.FeedURLs) == 0 {
		return result, errors.New("WECHAT_RSS_FEED_URLS is required")
	}

	existingSourceKeys, existingURLs, err := s.existingKeys()
	if err != nil {
		return result, err
	}

	for _, rawFeedURL := range s.cfg.FeedURLs {
		feedURL, err := resolveFeedURL(s.cfg.BaseURL, rawFeedURL)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, err.Error())
			continue
		}

		articles, err := s.fetchFeed(ctx, feedURL)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, err.Error())
			continue
		}

		for index, article := range articles {
			if s.cfg.MaxArticles > 0 && index >= s.cfg.MaxArticles {
				break
			}
			result.Fetched++

			if article.WechatURL == "" {
				result.Skipped++
				continue
			}

			sourceKey := article.SourceName + "\x00" + article.ExternalID
			hasSourceKey := article.SourceName != "" && article.ExternalID != ""
			normalizedURL := canonicalURL(article.WechatURL)
			existingArticle, duplicated := existingURLs[normalizedURL]
			if !duplicated && hasSourceKey {
				existingArticle, duplicated = existingSourceKeys[sourceKey]
			}
			if duplicated {
				if err := s.backfillExistingArticle(existingArticle, article); err != nil {
					result.Failed++
					result.Errors = append(result.Errors, err.Error())
					continue
				}
				result.Skipped++
				continue
			}

			row := models.WechatArticle{
				ID:                uuid.NewString(),
				Title:             valueOrDefault(article.Title, "未命名公众号推文"),
				Summary:           article.Summary,
				CoverURL:          article.CoverURL,
				WechatURL:         article.WechatURL,
				PublishedAt:       valueOrDefault(article.PublishedAt, time.Now().Format("2006-01-02")),
				IsPublished:       true,
				SortOrder:         0,
				SourceName:        article.SourceName,
				DisplaySourceName: s.displaySourceName(article.SourceName),
				ExternalID:        article.ExternalID,
			}
			if err := s.db.Create(&row).Error; err != nil {
				result.Failed++
				result.Errors = append(result.Errors, err.Error())
				continue
			}

			result.Created++
			existingURLs[normalizedURL] = row
			if hasSourceKey {
				existingSourceKeys[sourceKey] = row
			}
		}
	}

	return result, nil
}

func (s *Service) existingKeys() (map[string]models.WechatArticle, map[string]models.WechatArticle, error) {
	var rows []models.WechatArticle
	if err := s.db.Find(&rows).Error; err != nil {
		return nil, nil, err
	}

	sourceKeys := make(map[string]models.WechatArticle, len(rows))
	urls := make(map[string]models.WechatArticle, len(rows))
	for _, row := range rows {
		if row.WechatURL != "" {
			urls[canonicalURL(row.WechatURL)] = row
		}
		if row.SourceName != "" && row.ExternalID != "" {
			sourceKeys[row.SourceName+"\x00"+row.ExternalID] = row
		}
	}
	return sourceKeys, urls, nil
}

func (s *Service) backfillExistingArticle(existing models.WechatArticle, article FeedArticle) error {
	updates := map[string]any{}
	if shouldBackfillCover(existing.CoverURL, article.CoverURL) {
		updates["cover_url"] = article.CoverURL
	}
	if existing.SourceName == "" && article.SourceName != "" {
		updates["source_name"] = article.SourceName
	}
	if existing.ExternalID == "" && article.ExternalID != "" {
		updates["external_id"] = article.ExternalID
	}
	displayName := s.displaySourceName(article.SourceName)
	if displayName != "" && existing.DisplaySourceName != displayName {
		updates["display_source_name"] = displayName
	}
	if len(updates) == 0 {
		return nil
	}
	return s.db.Model(&models.WechatArticle{}).Where("id = ?", existing.ID).Updates(updates).Error
}

func shouldBackfillCover(existingCoverURL string, rssCoverURL string) bool {
	rssCoverURL = strings.TrimSpace(rssCoverURL)
	if rssCoverURL == "" {
		return false
	}
	existingCoverURL = strings.TrimSpace(existingCoverURL)
	return existingCoverURL == "" || strings.HasPrefix(existingCoverURL, "/uploads/")
}

func (s *Service) displaySourceName(sourceName string) string {
	sourceName = strings.TrimSpace(sourceName)
	if s.cfg.DisplayNames == nil {
		return sourceName
	}
	if displayName := strings.TrimSpace(s.cfg.DisplayNames[sourceName]); displayName != "" {
		return displayName
	}
	return sourceName
}

func (s *Service) fetchFeed(ctx context.Context, feedURL string) ([]FeedArticle, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, feedURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "YanFengClubRSSSync/1.0")
	req.Header.Set("Accept", "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("wechat rss feed returned non-2xx status: " + resp.Status)
	}

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return ParseFeed(raw, feedURL)
}

func ParseFeed(raw []byte, feedURL string) ([]FeedArticle, error) {
	var rss rssDocument
	if err := xml.Unmarshal(raw, &rss); err == nil && len(rss.Channel.Items) > 0 {
		sourceName := strings.TrimSpace(rss.Channel.Title)
		if sourceName == "" {
			sourceName = sourceNameFromURL(feedURL)
		}
		articles := make([]FeedArticle, 0, len(rss.Channel.Items))
		for _, item := range rss.Channel.Items {
			articles = append(articles, normalizeRSSItem(item, sourceName))
		}
		return articles, nil
	}

	var atom atomFeed
	if err := xml.Unmarshal(raw, &atom); err != nil {
		return nil, err
	}
	sourceName := strings.TrimSpace(atom.Title)
	if sourceName == "" {
		sourceName = sourceNameFromURL(feedURL)
	}
	articles := make([]FeedArticle, 0, len(atom.Entries))
	for _, entry := range atom.Entries {
		articles = append(articles, normalizeAtomEntry(entry, sourceName))
	}
	return articles, nil
}

type rssDocument struct {
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Title string    `xml:"title"`
	Items []rssItem `xml:"item"`
}

type rssItem struct {
	Title       string       `xml:"title"`
	Link        string       `xml:"link"`
	GUID        string       `xml:"guid"`
	PubDate     string       `xml:"pubDate"`
	Description string       `xml:"description"`
	Content     string       `xml:"encoded"`
	Enclosure   rssEnclosure `xml:"enclosure"`
}

type rssEnclosure struct {
	URL  string `xml:"url,attr"`
	Type string `xml:"type,attr"`
}

type atomFeed struct {
	Title   string      `xml:"title"`
	Entries []atomEntry `xml:"entry"`
}

type atomEntry struct {
	Title     string     `xml:"title"`
	ID        string     `xml:"id"`
	Published string     `xml:"published"`
	Updated   string     `xml:"updated"`
	Summary   string     `xml:"summary"`
	Content   string     `xml:"content"`
	Links     []atomLink `xml:"link"`
}

type atomLink struct {
	Href string `xml:"href,attr"`
	Rel  string `xml:"rel,attr"`
}

func normalizeRSSItem(item rssItem, sourceName string) FeedArticle {
	summaryHTML := strings.TrimSpace(item.Description)
	contentHTML := strings.TrimSpace(item.Content)
	return FeedArticle{
		Title:       strings.TrimSpace(item.Title),
		Summary:     compactText(stripHTML(summaryHTML)),
		CoverURL:    firstNonEmpty(imageEnclosureURL(item.Enclosure), firstImageURL(summaryHTML), firstImageURL(contentHTML)),
		WechatURL:   strings.TrimSpace(item.Link),
		PublishedAt: normalizePublishedDate(item.PubDate),
		SourceName:  sourceName,
		ExternalID:  valueOrDefault(strings.TrimSpace(item.GUID), strings.TrimSpace(item.Link)),
	}
}

func imageEnclosureURL(enclosure rssEnclosure) string {
	rawURL := strings.TrimSpace(enclosure.URL)
	if rawURL == "" {
		return ""
	}
	contentType := strings.ToLower(strings.TrimSpace(enclosure.Type))
	if contentType != "" && !strings.HasPrefix(contentType, "image/") {
		return ""
	}
	return rawURL
}

func normalizeAtomEntry(entry atomEntry, sourceName string) FeedArticle {
	contentHTML := strings.TrimSpace(firstNonEmpty(entry.Summary, entry.Content))
	return FeedArticle{
		Title:       strings.TrimSpace(entry.Title),
		Summary:     compactText(stripHTML(contentHTML)),
		CoverURL:    firstImageURL(contentHTML),
		WechatURL:   atomEntryURL(entry),
		PublishedAt: normalizePublishedDate(firstNonEmpty(entry.Published, entry.Updated)),
		SourceName:  sourceName,
		ExternalID:  valueOrDefault(strings.TrimSpace(entry.ID), atomEntryURL(entry)),
	}
}

func atomEntryURL(entry atomEntry) string {
	for _, link := range entry.Links {
		if link.Href != "" && (link.Rel == "" || link.Rel == "alternate") {
			return strings.TrimSpace(link.Href)
		}
	}
	if len(entry.Links) > 0 {
		return strings.TrimSpace(entry.Links[0].Href)
	}
	return ""
}

func resolveFeedURL(baseURL string, rawFeedURL string) (string, error) {
	feedURL := strings.TrimSpace(rawFeedURL)
	if feedURL == "" {
		return "", errors.New("empty wechat rss feed url")
	}
	if strings.HasPrefix(feedURL, "http://") || strings.HasPrefix(feedURL, "https://") {
		return feedURL, nil
	}

	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		return "", errors.New("WECHAT_RSS_BASE_URL is required when feed url is relative")
	}
	if !strings.HasPrefix(feedURL, "/") {
		feedURL = "/" + feedURL
	}
	return baseURL + feedURL, nil
}

func normalizePublishedDate(raw string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return ""
	}

	layouts := []string{
		time.RFC1123Z,
		time.RFC1123,
		time.RFC3339,
		"2006-01-02",
		"2006-01-02 15:04:05",
		"Mon, 02 Jan 2006 15:04:05 -0700",
	}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed.Format("2006-01-02")
		}
	}
	return value
}

func canonicalURL(raw string) string {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return strings.TrimSpace(raw)
	}
	parsed.Fragment = ""
	return parsed.String()
}

var (
	imageSrcPattern = regexp.MustCompile(`(?i)<img[^>]+(?:data-src|src)=["']([^"']+)["']`)
	htmlTagPattern  = regexp.MustCompile(`(?s)<[^>]+>`)
	spacePattern    = regexp.MustCompile(`\s+`)
)

func firstImageURL(rawHTML string) string {
	match := imageSrcPattern.FindStringSubmatch(rawHTML)
	if len(match) < 2 {
		return ""
	}
	return html.UnescapeString(strings.TrimSpace(match[1]))
}

func stripHTML(rawHTML string) string {
	text := htmlTagPattern.ReplaceAllString(rawHTML, " ")
	return html.UnescapeString(text)
}

func compactText(raw string) string {
	text := strings.TrimSpace(spacePattern.ReplaceAllString(raw, " "))
	if len([]rune(text)) <= 240 {
		return text
	}
	runes := []rune(text)
	return string(runes[:240])
}

func sourceNameFromURL(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" {
		return "公众号"
	}
	return parsed.Host
}

func valueOrDefault(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value != "" {
		return value
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
