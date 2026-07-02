package database

import (
	"encoding/json"
	"errors"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"yanfeng-homepage/backend/internal/config"
	"yanfeng-homepage/backend/internal/models"
)

func Open(cfg config.Config) (*gorm.DB, error) {
	switch cfg.DBDriver {
	case "sqlite":
		return gorm.Open(sqlite.Open(cfg.DBDSN), &gorm.Config{})
	case "mysql", "":
		return gorm.Open(mysql.Open(cfg.DBDSN), &gorm.Config{})
	default:
		return nil, errors.New("unsupported DB_DRIVER")
	}
}

func OpenSQLiteInMemory() (*gorm.DB, error) {
	return gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
}

func Migrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&models.SiteSetting{},
		&models.Article{},
		&models.WechatArticle{},
		&models.Video{},
		&models.MediaImage{},
		&models.Upload{},
	); err != nil {
		return err
	}

	return db.Clauses(clause.OnConflict{DoNothing: true}).Create(&models.SiteSetting{
		Key:   "main_group_number",
		Value: "737508445",
	}).Error
}

type seedDB struct {
	Articles       []seedArticle       `json:"articles"`
	WechatArticles []seedWechatArticle `json:"wechatArticles"`
	Videos         []seedVideo         `json:"videos"`
	MediaImages    []seedMediaImage    `json:"mediaImages"`
	Uploads        []seedUpload        `json:"uploads"`
	SiteSettings   seedSiteSettings    `json:"siteSettings"`
}

type seedArticle struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Date     string `json:"date"`
	Summary  string `json:"summary"`
	Tag      string `json:"tag"`
	Link     string `json:"link"`
	CoverURL string `json:"coverUrl"`
}

type seedWechatArticle struct {
	ID                string `json:"id"`
	Title             string `json:"title"`
	Summary           string `json:"summary"`
	CoverURL          string `json:"coverUrl"`
	WechatURL         string `json:"wechatUrl"`
	PublishedAt       string `json:"publishedAt"`
	IsPublished       bool   `json:"isPublished"`
	SortOrder         int    `json:"sortOrder"`
	SourceName        string `json:"sourceName"`
	DisplaySourceName string `json:"displaySourceName"`
	ExternalID        string `json:"externalId"`
}

type seedVideo struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	URL       string `json:"url"`
	Type      string `json:"type"`
	Thumbnail string `json:"thumbnail"`
	Category  string `json:"category"`
}

type seedMediaImage struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	ImageURL string `json:"imageUrl"`
	Category string `json:"category"`
}

type seedUpload struct {
	ID          string `json:"id"`
	Key         string `json:"key"`
	URL         string `json:"url"`
	Filename    string `json:"filename"`
	ContentType string `json:"contentType"`
	ByteSize    int64  `json:"byteSize"`
}

type seedSiteSettings struct {
	MainGroupNumber string `json:"mainGroupNumber"`
}

func SeedFromDBJSON(db *gorm.DB, path string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}

	var payload seedDB
	if err := json.Unmarshal(raw, &payload); err != nil {
		return err
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if payload.SiteSettings.MainGroupNumber != "" {
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "key"}},
				DoUpdates: clause.AssignmentColumns([]string{"value"}),
			}).Create(&models.SiteSetting{
				Key:   "main_group_number",
				Value: payload.SiteSettings.MainGroupNumber,
			}).Error; err != nil {
				return err
			}
		}

		for _, item := range payload.Articles {
			row := models.Article{
				ID:       item.ID,
				Title:    item.Title,
				Date:     item.Date,
				Summary:  item.Summary,
				Tag:      item.Tag,
				Link:     item.Link,
				CoverURL: item.CoverURL,
				Source:   "wechat",
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row).Error; err != nil {
				return err
			}
		}

		for _, item := range payload.WechatArticles {
			row := models.WechatArticle{
				ID:                item.ID,
				Title:             item.Title,
				Summary:           item.Summary,
				CoverURL:          item.CoverURL,
				WechatURL:         item.WechatURL,
				PublishedAt:       item.PublishedAt,
				IsPublished:       item.IsPublished,
				SortOrder:         item.SortOrder,
				SourceName:        item.SourceName,
				DisplaySourceName: item.DisplaySourceName,
				ExternalID:        item.ExternalID,
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row).Error; err != nil {
				return err
			}
		}

		for _, item := range payload.Videos {
			videoType := item.Type
			if videoType == "" {
				videoType = "bilibili"
			}
			row := models.Video{
				ID:        item.ID,
				Title:     item.Title,
				URL:       item.URL,
				Type:      videoType,
				Thumbnail: item.Thumbnail,
				Category:  item.Category,
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row).Error; err != nil {
				return err
			}
		}

		for _, item := range payload.MediaImages {
			row := models.MediaImage{
				ID:       item.ID,
				Title:    item.Title,
				ImageURL: item.ImageURL,
				Category: item.Category,
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row).Error; err != nil {
				return err
			}
		}

		for _, item := range payload.Uploads {
			row := models.Upload{
				ID:          item.ID,
				Key:         item.Key,
				URL:         item.URL,
				Filename:    item.Filename,
				ContentType: item.ContentType,
				ByteSize:    item.ByteSize,
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
