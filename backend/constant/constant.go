package constant

// 上传文件大小上限：8 MB
const MaxUploadBytes = 8 * 1024 * 1024

var (
	AllowedVideoCategories  = map[string]bool{"winter": true, "anniversary": true, "gma": true, "daily": true}
	AllowedImageCategories  = map[string]bool{"gallery": true, "album": true}
	AllowedUploadCategories = map[string]bool{"gallery": true, "album": true, "thumbnail": true, "wechat": true}
	AllowedUploadTypes      = map[string]string{"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
)

// DefaultMainGroupNumber 是站点未配置主群号时的兜底值
const DefaultMainGroupNumber = "737508445"
