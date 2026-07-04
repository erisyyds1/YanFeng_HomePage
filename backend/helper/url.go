package helper

import (
	"net/url"
	"strings"
)

// IsAllowedBilibiliPlayerURL 校验是否为合法的哔哩哔哩播放器地址
func IsAllowedBilibiliPlayerURL(value string) bool {
	parsed, err := url.Parse(value)
	return err == nil && parsed.Scheme == "https" && parsed.Hostname() == "player.bilibili.com"
}

// IsAllowedImageURL 校验是否为合法的图片地址（允许站内相对路径或 http(s) 绝对地址）
func IsAllowedImageURL(value string) bool {
	if strings.HasPrefix(value, "/") && !strings.HasPrefix(value, "//") {
		return true
	}
	parsed, err := url.Parse(value)
	return err == nil && (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Hostname() != ""
}

// IsAllowedWechatArticleURL 校验是否为合法的微信公众号文章地址
func IsAllowedWechatArticleURL(value string) bool {
	parsed, err := url.Parse(value)
	return err == nil &&
		(parsed.Scheme == "https" || parsed.Scheme == "http") &&
		strings.HasSuffix(parsed.Hostname(), "mp.weixin.qq.com")
}
