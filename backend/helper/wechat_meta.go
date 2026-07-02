package helper

import (
	"html"
	"regexp"
	"strconv"
	"strings"
	"time"

	"yanfeng-homepage/backend/util"
)

// ExtractWechatArticleMeta 从公众号文章 HTML 中解析标题、摘要、封面和发布日期
func ExtractWechatArticleMeta(raw string) map[string]string {
	title := util.FirstNonEmpty(
		extractScriptString(raw, "msg_title"),
		extractMetaContent(raw, "property", "og:title"),
		extractMetaContent(raw, "name", "twitter:title"),
		extractTitleTag(raw),
	)
	summary := util.FirstNonEmpty(
		extractScriptString(raw, "msg_desc"),
		extractMetaContent(raw, "property", "og:description"),
		extractMetaContent(raw, "name", "description"),
	)
	coverURL := util.FirstNonEmpty(
		extractScriptString(raw, "msg_cdn_url"),
		extractMetaContent(raw, "property", "og:image"),
		extractMetaContent(raw, "name", "twitter:image"),
	)
	publishedAt := util.FirstNonEmpty(
		extractPublishedDate(raw),
		util.Left(extractMetaContent(raw, "property", "article:published_time"), 10),
	)
	return map[string]string{
		"title":       util.CleanText(title),
		"summary":     util.CleanText(summary),
		"coverUrl":    util.CleanText(coverURL),
		"publishedAt": util.CleanText(publishedAt),
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
