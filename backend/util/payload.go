package util

import (
	"encoding/json"
	"regexp"
	"strconv"
	"strings"
)

// FirstNonEmpty 返回第一个非空字符串
func FirstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

// Left 截取字符串前 length 个字节，不足则返回原串
func Left(value string, length int) string {
	if len(value) < length {
		return value
	}
	return value[:length]
}

// CleanText 折叠连续空白并去除首尾空格
func CleanText(value string) string {
	return strings.TrimSpace(regexp.MustCompile(`\s+`).ReplaceAllString(value, " "))
}

// FirstString 按 keys 顺序取第一个存在的键并转为字符串
func FirstString(payload map[string]any, keys ...string) string {
	return StringValue(FirstValueOrNil(payload, keys...))
}

// FirstValueOrNil 按 keys 顺序取第一个存在的值，不存在返回 nil
func FirstValueOrNil(payload map[string]any, keys ...string) any {
	value, _ := FirstValue(payload, keys...)
	return value
}

// FirstValue 按 keys 顺序取第一个存在的值及命中标志
func FirstValue(payload map[string]any, keys ...string) (any, bool) {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			return value, true
		}
	}
	return nil, false
}

// ValueOrDefault 当 value 为空时返回 fallback
func ValueOrDefault(value any, fallback any) any {
	if value == nil || StringValue(value) == "" {
		return fallback
	}
	return value
}

// StringValue 将任意值安全转换为字符串
func StringValue(value any) string {
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

// BoolValue 将任意值安全转换为布尔
func BoolValue(value any) bool {
	switch typed := value.(type) {
	case bool:
		return typed
	case string:
		return typed == "true" || typed == "1"
	default:
		return false
	}
}

// IntValue 将任意值安全转换为整数
func IntValue(value any) int {
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
