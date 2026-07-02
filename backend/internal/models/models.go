package models

import "time"

type SiteSetting struct {
	Key       string    `gorm:"primaryKey;size:128"`
	Value     string    `gorm:"type:text;not null"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

type Article struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Date        string    `gorm:"not null;index" json:"date"`
	Summary     string    `gorm:"type:text;not null" json:"summary"`
	Tag         string    `json:"tag,omitempty"`
	Link        string    `json:"link,omitempty"`
	CoverURL    string    `gorm:"column:cover_url" json:"coverUrl,omitempty"`
	Source      string    `gorm:"not null;default:wechat" json:"-"`
	ExternalID  string    `gorm:"column:external_id;index" json:"-"`
	PublishedAt string    `gorm:"column:published_at" json:"-"`
	CreatedAt   time.Time `json:"-"`
	UpdatedAt   time.Time `json:"-"`
}

type WechatArticle struct {
	ID                string    `gorm:"primaryKey;size:64" json:"id"`
	Title             string    `gorm:"not null" json:"title"`
	Summary           string    `gorm:"type:text;not null" json:"summary"`
	CoverURL          string    `gorm:"column:cover_url" json:"coverUrl,omitempty"`
	WechatURL         string    `gorm:"column:wechat_url;not null" json:"wechatUrl"`
	PublishedAt       string    `gorm:"column:published_at;index" json:"publishedAt"`
	IsPublished       bool      `gorm:"column:is_published;not null;index" json:"isPublished"`
	SortOrder         int       `gorm:"column:sort_order;not null;default:0;index" json:"sortOrder"`
	SourceName        string    `gorm:"column:source_name;index" json:"sourceName,omitempty"`
	DisplaySourceName string    `gorm:"column:display_source_name;index" json:"displaySourceName,omitempty"`
	ExternalID        string    `gorm:"column:external_id;index" json:"externalId,omitempty"`
	CreatedAt         time.Time `json:"-"`
	UpdatedAt         time.Time `json:"-"`
}

type Video struct {
	ID        string    `gorm:"primaryKey;size:64" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	URL       string    `gorm:"not null" json:"url"`
	Type      string    `gorm:"not null;default:bilibili" json:"type"`
	Thumbnail string    `json:"thumbnail,omitempty"`
	Category  string    `gorm:"not null;index" json:"category"`
	SortOrder int       `gorm:"column:sort_order;not null;default:0" json:"-"`
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`
}

type MediaImage struct {
	ID        string    `gorm:"primaryKey;size:64" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	ImageURL  string    `gorm:"column:image_url;not null" json:"imageUrl"`
	R2Key     string    `gorm:"column:r2_key" json:"-"`
	Category  string    `gorm:"not null;index" json:"category"`
	SortOrder int       `gorm:"column:sort_order;not null;default:0" json:"-"`
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`
}

type Upload struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	Key         string    `gorm:"column:r2_key;size:512;uniqueIndex;not null" json:"key"`
	URL         string    `gorm:"column:public_url;not null" json:"url"`
	Filename    string    `gorm:"not null" json:"filename"`
	ContentType string    `gorm:"column:content_type;not null" json:"contentType"`
	ByteSize    int64     `gorm:"column:byte_size;not null" json:"byteSize"`
	CreatedAt   time.Time `json:"createdAt,omitempty"`
}
