CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_settings (key, value)
VALUES ('main_group_number', '737508445');

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bilibili',
  thumbnail TEXT,
  category TEXT NOT NULL CHECK (category IN ('winter', 'anniversary', 'gma', 'daily')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_videos_category_sort
ON videos (category, sort_order DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS media_images (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  r2_key TEXT,
  category TEXT NOT NULL CHECK (category IN ('gallery', 'album')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_images_category_sort
ON media_images (category, sort_order DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  tag TEXT,
  link TEXT,
  cover_url TEXT,
  r2_cover_key TEXT,
  source TEXT NOT NULL DEFAULT 'wechat',
  external_id TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_source_external_id
ON articles (source, external_id)
WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_date
ON articles (date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
