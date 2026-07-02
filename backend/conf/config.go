package conf

import (
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Port                  int
	CORSOrigin            string
	AdminPassword         string
	JWTSecret             string
	JWTTTL                time.Duration
	DBDriver              string
	DBDSN                 string
	PublicDir             string
	SeedPath              string
	DifyAPIKey            string
	DifyAPIURL            string
	WechatRSSBaseURL      string
	WechatRSSFeedURLs     []string
	WechatRSSMaxArticles  int
	WechatRSSDisplayNames map[string]string
}

func Load() (Config, error) {
	v := viper.New()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	v.SetDefault("PORT", 3001)
	v.SetDefault("CORS_ORIGIN", "*")
	v.SetDefault("ADMIN_PASSWORD", "18522")
	v.SetDefault("ADMIN_SESSION_SECRET", "dev-only-change-me")
	v.SetDefault("JWT_TTL", "6h")
	v.SetDefault("DB_DRIVER", "mysql")
	v.SetDefault("DB_DSN", "root:password@tcp(127.0.0.1:3306)/yanfeng_homepage?charset=utf8mb4&parseTime=True&loc=Local")
	v.SetDefault("PUBLIC_DIR", filepath.Join("..", "public"))
	v.SetDefault("SEED_PATH", filepath.Join("..", "db.json"))
	v.SetDefault("DIFY_API_URL", "https://api.dify.ai/v1")
	v.SetDefault("WECHAT_RSS_BASE_URL", "http://we-mp-rss:8001")
	v.SetDefault("WECHAT_RSS_MAX_ARTICLES", 50)

	readOptionalEnv(v, ".env")
	readOptionalEnv(v, filepath.Join("..", ".env"))

	ttl, err := time.ParseDuration(v.GetString("JWT_TTL"))
	if err != nil {
		return Config{}, err
	}

	return Config{
		Port:                  v.GetInt("PORT"),
		CORSOrigin:            v.GetString("CORS_ORIGIN"),
		AdminPassword:         v.GetString("ADMIN_PASSWORD"),
		JWTSecret:             firstNonEmpty(v.GetString("JWT_SECRET"), v.GetString("ADMIN_SESSION_SECRET")),
		JWTTTL:                ttl,
		DBDriver:              v.GetString("DB_DRIVER"),
		DBDSN:                 v.GetString("DB_DSN"),
		PublicDir:             v.GetString("PUBLIC_DIR"),
		SeedPath:              v.GetString("SEED_PATH"),
		DifyAPIKey:            v.GetString("DIFY_API_KEY"),
		DifyAPIURL:            strings.TrimRight(v.GetString("DIFY_API_URL"), "/"),
		WechatRSSBaseURL:      strings.TrimRight(v.GetString("WECHAT_RSS_BASE_URL"), "/"),
		WechatRSSFeedURLs:     splitCSV(v.GetString("WECHAT_RSS_FEED_URLS")),
		WechatRSSMaxArticles:  v.GetInt("WECHAT_RSS_MAX_ARTICLES"),
		WechatRSSDisplayNames: splitKeyValueMap(v.GetString("WECHAT_RSS_DISPLAY_NAME_MAP")),
	}, nil
}

func readOptionalEnv(v *viper.Viper, path string) {
	v.SetConfigFile(path)
	_ = v.ReadInConfig()
}

func (c Config) SigningSecret() string {
	if c.JWTSecret != "" {
		return c.JWTSecret
	}
	return "dev-only-change-me"
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}
	return values
}

func splitKeyValueMap(raw string) map[string]string {
	values := make(map[string]string)
	for _, part := range splitCSV(raw) {
		key, value, ok := strings.Cut(part, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key != "" && value != "" {
			values[key] = value
		}
	}
	return values
}
