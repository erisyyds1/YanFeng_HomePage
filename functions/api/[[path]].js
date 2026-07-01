const DEFAULT_MAIN_GROUP_NUMBER = '737508445';
const ALLOWED_VIDEO_CATEGORIES = new Set(['winter', 'anniversary', 'gma', 'daily']);
const ALLOWED_IMAGE_CATEGORIES = new Set(['gallery', 'album']);
const ALLOWED_UPLOAD_CATEGORIES = new Set(['gallery', 'album', 'thumbnail', 'wechat']);
const ALLOWED_UPLOAD_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === 'OPTIONS') {
      return json(null, 204);
    }

    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (request.method === 'GET' && pathname === '/articles') {
      return json(await listArticles(env));
    }

    if (request.method === 'GET' && pathname === '/wechat-articles') {
      return json(await listWechatArticles(env, false));
    }

    if (request.method === 'GET' && pathname === '/wechat-articles/admin') {
      await requireAdmin(request, env);
      return json(await listWechatArticles(env, true));
    }

    if (request.method === 'POST' && pathname === '/wechat-articles/parse') {
      await requireAdmin(request, env);
      return json(await parseWechatArticle(await readJson(request)));
    }

    if (request.method === 'POST' && pathname === '/wechat-articles') {
      await requireAdmin(request, env);
      const article = normalizeWechatArticle(await readJson(request));
      await createWechatArticle(env, article);
      return json(article, 201);
    }

    const wechatArticleMatch = pathname.match(/^\/wechat-articles\/([^/]+)$/);
    if (request.method === 'PATCH' && wechatArticleMatch) {
      await requireAdmin(request, env);
      const id = decodeURIComponent(wechatArticleMatch[1]);
      const article = normalizeWechatArticle({ ...(await readJson(request)), id });
      const updated = await updateWechatArticle(env, id, article);
      return updated ? json(article) : json({ error: 'Wechat article not found' }, 404);
    }

    if (request.method === 'DELETE' && wechatArticleMatch) {
      await requireAdmin(request, env);
      await ensureWechatArticlesTable(env);
      const deleted = await deleteById(env, 'wechat_articles', decodeURIComponent(wechatArticleMatch[1]));
      return deleted ? json(null, 204) : json({ error: 'Wechat article not found' }, 404);
    }

    if (request.method === 'GET' && pathname === '/videos') {
      return json(await listVideos(env));
    }

    if (request.method === 'POST' && pathname === '/videos') {
      await requireAdmin(request, env);
      const video = normalizeVideo(await readJson(request));
      await createVideo(env, video);
      return json(video, 201);
    }

    const videoMatch = pathname.match(/^\/videos\/([^/]+)$/);
    if (request.method === 'PATCH' && videoMatch) {
      await requireAdmin(request, env);
      const id = decodeURIComponent(videoMatch[1]);
      const video = normalizeVideo({ ...(await readJson(request)), id });
      const updated = await updateVideo(env, id, video);
      return updated ? json(video) : json({ error: 'Video not found' }, 404);
    }

    if (request.method === 'DELETE' && videoMatch) {
      await requireAdmin(request, env);
      const deleted = await deleteById(env, 'videos', decodeURIComponent(videoMatch[1]));
      return deleted ? json(null, 204) : json({ error: 'Video not found' }, 404);
    }

    if (request.method === 'GET' && pathname === '/site-settings') {
      return json(await getSiteSettings(env));
    }

    if (request.method === 'PATCH' && pathname === '/site-settings') {
      await requireAdmin(request, env);
      const settings = normalizeSiteSettings(await readJson(request));
      await saveSiteSettings(env, settings);
      return json(settings);
    }

    if (request.method === 'GET' && pathname === '/media-images') {
      return json(await listMediaImages(env));
    }

    if (request.method === 'POST' && pathname === '/media-images') {
      await requireAdmin(request, env);
      const image = normalizeManagedImage(await readJson(request));
      await createMediaImage(env, image);
      return json(image, 201);
    }

    const mediaImageMatch = pathname.match(/^\/media-images\/([^/]+)$/);
    if (request.method === 'PATCH' && mediaImageMatch) {
      await requireAdmin(request, env);
      const id = decodeURIComponent(mediaImageMatch[1]);
      const image = normalizeManagedImage({ ...(await readJson(request)), id });
      const updated = await updateMediaImage(env, id, image);
      return updated ? json(image) : json({ error: 'Image not found' }, 404);
    }

    if (request.method === 'DELETE' && mediaImageMatch) {
      await requireAdmin(request, env);
      const deleted = await deleteById(env, 'media_images', decodeURIComponent(mediaImageMatch[1]));
      return deleted ? json(null, 204) : json({ error: 'Image not found' }, 404);
    }

    if (request.method === 'POST' && pathname === '/uploads') {
      await requireAdmin(request, env);
      const upload = await uploadFile(request, env);
      return json(upload, 201);
    }

    const uploadMatch = pathname.match(/^\/uploads\/(.+)$/);
    if (request.method === 'GET' && uploadMatch) {
      return serveUpload(env, decodeURIComponent(uploadMatch[1]));
    }

    if (request.method === 'POST' && pathname === '/chat-messages') {
      const response = await proxyDifyChat(await readJson(request), env);
      return json(response.body, response.status);
    }

    if (request.method === 'POST' && pathname === '/admin/login') {
      return json(await createAdminSession(await readJson(request), env));
    }

    return json({ error: 'Not found' }, 404);
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    if (statusCode >= 500) {
      console.error('[api] request failed:', error);
    }
    return json(
      { error: statusCode >= 500 ? 'Internal server error' : error.message },
      statusCode
    );
  }
}

function normalizePath(pathname) {
  return pathname.replace(/^\/api\/?/, '/') || '/';
}

function json(data, status = 200) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json; charset=utf-8'
  });

  if (status === 204) {
    headers.delete('Content-Type');
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(data), { status, headers });
}

async function readJson(request) {
  const text = await request.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, 'Invalid JSON body');
  }
}

function requireDb(env) {
  if (!env.DB) {
    throw httpError(503, 'D1 binding DB is not configured');
  }
  return env.DB;
}

async function listArticles(env) {
  const db = requireDb(env);
  const { results } = await db
    .prepare(
      `SELECT id, title, date, summary, tag, link, cover_url
       FROM articles
       ORDER BY date DESC, created_at DESC`
    )
    .all();
  return results.map(mapArticleRow);
}

async function listVideos(env) {
  const db = requireDb(env);
  const { results } = await db
    .prepare(
      `SELECT id, title, url, type, thumbnail, category
       FROM videos
       ORDER BY sort_order DESC, created_at DESC`
    )
    .all();
  return results.map(mapVideoRow);
}

async function ensureWechatArticlesTable(env) {
  const db = requireDb(env);
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS wechat_articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        cover_url TEXT,
        wechat_url TEXT NOT NULL,
        published_at TEXT,
        is_published INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_wechat_articles_public_sort
       ON wechat_articles (is_published, sort_order DESC, published_at DESC, created_at DESC)`
    )
    .run();
}

async function listWechatArticles(env, includeDrafts) {
  await ensureWechatArticlesTable(env);
  const db = requireDb(env);
  const query = includeDrafts
    ? `SELECT id, title, summary, cover_url, wechat_url, published_at, is_published, sort_order
       FROM wechat_articles
       ORDER BY sort_order DESC, published_at DESC, created_at DESC`
    : `SELECT id, title, summary, cover_url, wechat_url, published_at, is_published, sort_order
       FROM wechat_articles
       WHERE is_published = 1
       ORDER BY sort_order DESC, published_at DESC, created_at DESC`;
  const { results } = await db.prepare(query).all();
  return results.map(mapWechatArticleRow);
}

async function createWechatArticle(env, article) {
  await ensureWechatArticlesTable(env);
  const db = requireDb(env);
  await db
    .prepare(
      `INSERT INTO wechat_articles
        (id, title, summary, cover_url, wechat_url, published_at, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      article.id,
      article.title,
      article.summary,
      article.coverUrl || null,
      article.wechatUrl,
      article.publishedAt || null,
      article.isPublished ? 1 : 0,
      article.sortOrder
    )
    .run();
}

async function updateWechatArticle(env, id, article) {
  await ensureWechatArticlesTable(env);
  const db = requireDb(env);
  const result = await db
    .prepare(
      `UPDATE wechat_articles
       SET title = ?, summary = ?, cover_url = ?, wechat_url = ?, published_at = ?,
           is_published = ?, sort_order = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      article.title,
      article.summary,
      article.coverUrl || null,
      article.wechatUrl,
      article.publishedAt || null,
      article.isPublished ? 1 : 0,
      article.sortOrder,
      id
    )
    .run();
  return Boolean(result.meta?.changes);
}

async function createVideo(env, video) {
  const db = requireDb(env);
  await db
    .prepare(
      `INSERT INTO videos (id, title, url, type, thumbnail, category, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(video.id, video.title, video.url, video.type, video.thumbnail || null, video.category)
    .run();
}

async function updateVideo(env, id, video) {
  const db = requireDb(env);
  const result = await db
    .prepare(
      `UPDATE videos
       SET title = ?, url = ?, type = ?, thumbnail = ?, category = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(video.title, video.url, video.type, video.thumbnail || null, video.category, id)
    .run();
  return Boolean(result.meta?.changes);
}

async function getSiteSettings(env) {
  const db = requireDb(env);
  const row = await db
    .prepare(`SELECT value FROM site_settings WHERE key = 'main_group_number'`)
    .first();
  return { mainGroupNumber: String(row?.value || DEFAULT_MAIN_GROUP_NUMBER) };
}

async function saveSiteSettings(env, settings) {
  const db = requireDb(env);
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ('main_group_number', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .bind(settings.mainGroupNumber)
    .run();
}

async function listMediaImages(env) {
  const db = requireDb(env);
  const { results } = await db
    .prepare(
      `SELECT id, title, image_url, category
       FROM media_images
       ORDER BY sort_order DESC, created_at DESC`
    )
    .all();
  return results.map(mapMediaImageRow);
}

async function createMediaImage(env, image) {
  const db = requireDb(env);
  await db
    .prepare(
      `INSERT INTO media_images (id, title, image_url, category, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
    .bind(image.id, image.title, image.imageUrl, image.category)
    .run();
}

async function updateMediaImage(env, id, image) {
  const db = requireDb(env);
  const result = await db
    .prepare(
      `UPDATE media_images
       SET title = ?, image_url = ?, category = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(image.title, image.imageUrl, image.category, id)
    .run();
  return Boolean(result.meta?.changes);
}

async function deleteById(env, table, id) {
  const db = requireDb(env);
  const result = await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return Boolean(result.meta?.changes);
}

async function uploadFile(request, env) {
  if (!env.MEDIA_BUCKET) {
    throw httpError(503, 'R2 binding MEDIA_BUCKET is not configured');
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const category = String(formData.get('category') || 'gallery').trim();

  if (!file || typeof file.arrayBuffer !== 'function') {
    throw httpError(400, 'Image file is required');
  }

  if (!ALLOWED_UPLOAD_CATEGORIES.has(category)) {
    throw httpError(400, 'Invalid upload category');
  }

  const contentType = String(file.type || '').toLowerCase();
  const extension = ALLOWED_UPLOAD_TYPES.get(contentType);
  if (!extension) {
    throw httpError(400, 'Only JPG, PNG, and WebP uploads are allowed');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw httpError(400, 'Image must be 8 MB or smaller');
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const id = crypto.randomUUID();
  const key = `uploads/${category}/${year}/${id}.${extension}`;
  const bytes = await file.arrayBuffer();

  await env.MEDIA_BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType
    }
  });

  const publicBase = String(env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const url = publicBase ? `${publicBase}/${key}` : `/api/uploads/${key}`;

  if (env.DB) {
    await env.DB
      .prepare(
        `INSERT INTO uploads (id, r2_key, public_url, filename, content_type, byte_size)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, key, url, String(file.name || `${id}.${extension}`), contentType, file.size)
      .run();
  }

  return {
    id,
    key,
    url,
    filename: String(file.name || `${id}.${extension}`),
    contentType,
    byteSize: file.size
  };
}

async function serveUpload(env, key) {
  if (!env.MEDIA_BUCKET) {
    throw httpError(503, 'R2 binding MEDIA_BUCKET is not configured');
  }

  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) {
    return json({ error: 'Upload not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

function normalizeVideo(payload) {
  const title = String(payload?.title || '').trim();
  const url = String(payload?.url || '').trim();
  const thumbnail = String(payload?.thumbnail || '').trim();
  const category = String(payload?.category || 'daily').trim();

  if (!title) throw httpError(400, 'Video title is required');
  if (!url || !isAllowedBilibiliPlayerUrl(url)) {
    throw httpError(400, 'A valid Bilibili player URL is required');
  }
  if (!ALLOWED_VIDEO_CATEGORIES.has(category)) throw httpError(400, 'Invalid video category');

  return {
    id: String(payload?.id || Date.now()),
    title,
    url,
    type: 'bilibili',
    thumbnail,
    category
  };
}

function normalizeSiteSettings(payload) {
  const mainGroupNumber = String(payload?.mainGroupNumber || '').trim();
  if (!mainGroupNumber) throw httpError(400, 'Main QQ group number is required');
  return { mainGroupNumber };
}

function normalizeManagedImage(payload) {
  const title = String(payload?.title || '').trim();
  const imageUrl = String(payload?.imageUrl || '').trim();
  const category = String(payload?.category || '').trim();

  if (!title) throw httpError(400, 'Image title is required');
  if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
    throw httpError(400, 'A valid image URL is required');
  }
  if (!ALLOWED_IMAGE_CATEGORIES.has(category)) throw httpError(400, 'Invalid image category');

  return {
    id: String(payload?.id || Date.now()),
    title,
    imageUrl,
    category
  };
}

function normalizeWechatArticle(payload) {
  const wechatUrl = String(payload?.wechatUrl || payload?.wechat_url || '').trim();
  const title = String(payload?.title || '').trim() || '未命名公众号推文';
  const summary = String(payload?.summary || '').trim();
  const coverUrl = String(payload?.coverUrl || payload?.cover_url || '').trim();
  const publishedAt = String(payload?.publishedAt || payload?.published_at || '').trim();
  const sortOrder = Number.isFinite(Number(payload?.sortOrder ?? payload?.sort_order))
    ? Number(payload?.sortOrder ?? payload?.sort_order)
    : 0;
  const isPublished =
    payload?.isPublished === undefined && payload?.is_published === undefined
      ? true
      : Boolean(payload?.isPublished ?? payload?.is_published);

  if (!isAllowedWechatArticleUrl(wechatUrl)) {
    throw httpError(400, 'A valid WeChat article URL is required');
  }

  if (coverUrl && !isAllowedImageUrl(coverUrl)) {
    throw httpError(400, 'A valid cover image URL is required');
  }

  return {
    id: String(payload?.id || crypto.randomUUID?.() || Date.now()),
    title,
    summary,
    coverUrl,
    wechatUrl,
    publishedAt: publishedAt || new Date().toISOString().slice(0, 10),
    isPublished,
    sortOrder
  };
}

function mapArticleRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    date: row.date,
    summary: row.summary,
    tag: row.tag || undefined,
    link: row.link || undefined,
    coverUrl: row.cover_url || undefined
  };
}

function mapWechatArticleRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    summary: row.summary || '',
    coverUrl: row.cover_url || '',
    wechatUrl: row.wechat_url,
    publishedAt: row.published_at || '',
    isPublished: Boolean(row.is_published),
    sortOrder: Number(row.sort_order || 0)
  };
}

function mapVideoRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    url: row.url,
    type: row.type || 'bilibili',
    thumbnail: row.thumbnail || '',
    category: row.category
  };
}

function mapMediaImageRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    imageUrl: row.image_url,
    category: row.category
  };
}

function isAllowedBilibiliPlayerUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname === 'player.bilibili.com';
  } catch {
    return false;
  }
}

function isAllowedImageUrl(value) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isAllowedWechatArticleUrl(value) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.endsWith('mp.weixin.qq.com');
  } catch {
    return false;
  }
}

async function parseWechatArticle(payload) {
  const wechatUrl = String(payload?.wechatUrl || payload?.wechat_url || '').trim();
  if (!isAllowedWechatArticleUrl(wechatUrl)) {
    throw httpError(400, 'A valid WeChat article URL is required');
  }

  try {
    const response = await fetch(wechatUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 YanfengClubBot/1.0',
        Accept: 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      return { wechatUrl, title: '', summary: '', coverUrl: '', publishedAt: '' };
    }

    const html = await response.text();
    return {
      wechatUrl,
      ...extractWechatArticleMeta(html)
    };
  } catch {
    return { wechatUrl, title: '', summary: '', coverUrl: '', publishedAt: '' };
  }
}

function extractWechatArticleMeta(html) {
  const title =
    extractScriptString(html, 'msg_title') ||
    extractMetaContent(html, 'property', 'og:title') ||
    extractMetaContent(html, 'name', 'twitter:title') ||
    extractTitleTag(html);
  const summary =
    extractScriptString(html, 'msg_desc') ||
    extractMetaContent(html, 'property', 'og:description') ||
    extractMetaContent(html, 'name', 'description') ||
    '';
  const coverUrl =
    extractScriptString(html, 'msg_cdn_url') ||
    extractMetaContent(html, 'property', 'og:image') ||
    extractMetaContent(html, 'name', 'twitter:image') ||
    '';
  const publishedAt =
    extractPublishedDate(html) ||
    extractMetaContent(html, 'property', 'article:published_time').slice(0, 10) ||
    '';

  return {
    title: cleanExtractedText(title),
    summary: cleanExtractedText(summary),
    coverUrl: cleanExtractedText(coverUrl),
    publishedAt: cleanExtractedText(publishedAt)
  };
}

function extractMetaContent(html, attribute, value) {
  const attr = escapeRegExp(attribute);
  const val = escapeRegExp(value);
  const patterns = [
    new RegExp(`<meta\\s+[^>]*${attr}=["']${val}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${val}["'][^>]*>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return '';
}

function extractScriptString(html, variableName) {
  const pattern = new RegExp(`(?:var\\s+)?${escapeRegExp(variableName)}\\s*=\\s*(['"])([\\s\\S]*?)\\1`, 'i');
  const match = html.match(pattern);
  if (!match?.[2]) return '';
  return decodeHtmlEntities(
    match[2]
      .replace(/\\\//g, '/')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
  );
}

function extractTitleTag(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1]) : '';
}

function extractPublishedDate(html) {
  const ct = html.match(/(?:var\s+)?ct\s*=\s*["'](\d{9,})["']/i)?.[1];
  if (ct) {
    const date = new Date(Number(ct) * 1000);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return '';
}

function cleanExtractedText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function proxyDifyChat(payload, env) {
  const apiKey = env.DIFY_API_KEY;
  const apiUrl = String(env.DIFY_API_URL || 'https://api.dify.ai/v1').replace(/\/+$/, '');

  if (!apiKey) {
    return {
      status: 200,
      body: {
        answer: 'AI assistant is not configured yet.'
      }
    };
  }

  const query = String(payload?.query || payload?.message || '').trim();
  if (!query) {
    return { status: 400, body: { error: 'Message is required' } };
  }

  const difyResponse = await fetch(`${apiUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: payload?.inputs || {},
      query,
      response_mode: 'blocking',
      conversation_id: payload?.conversation_id || '',
      user: payload?.user || 'yanfeng-web',
      files: payload?.files || []
    })
  });

  const responseText = await difyResponse.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { answer: responseText };
  }

  if (!difyResponse.ok) {
    return {
      status: 502,
      body: {
        answer: 'Chat service is temporarily unavailable.'
      }
    };
  }

  return {
    status: 200,
    body: {
      answer: data.answer || 'I do not have an answer yet.',
      conversation_id: data.conversation_id,
      message_id: data.message_id
    }
  };
}

async function createAdminSession(payload, env) {
  const password = String(payload?.password || payload?.message || '').trim();
  const expectedPassword = env.ADMIN_PASSWORD;
  const secret = env.ADMIN_SESSION_SECRET;

  if (!expectedPassword || !secret) {
    return { token: '', expiresAt: 0, configured: false };
  }

  if (password !== expectedPassword) {
    throw httpError(401, 'Invalid admin password');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 6;
  const payloadText = encodeBase64Url(JSON.stringify({ scope: 'admin', exp: expiresAt }));
  const signature = await signAdminPayload(payloadText, secret);
  return {
    token: `${payloadText}.${signature}`,
    expiresAt,
    configured: true
  };
}

async function requireAdmin(request, env) {
  const secret = env.ADMIN_SESSION_SECRET;
  const expectedPassword = env.ADMIN_PASSWORD;

  if (!secret || !expectedPassword) {
    throw httpError(503, 'Admin auth is not configured');
  }

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const [payloadText, signature] = token.split('.');

  if (!payloadText || !signature) {
    throw httpError(401, 'Admin token is required');
  }

  const expectedSignature = await signAdminPayload(payloadText, secret);
  if (signature !== expectedSignature) {
    throw httpError(401, 'Invalid admin token');
  }

  let payload;
  try {
    payload = JSON.parse(decodeBase64Url(payloadText));
  } catch {
    throw httpError(401, 'Invalid admin token');
  }

  if (payload.scope !== 'admin' || Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) {
    throw httpError(401, 'Admin token has expired');
  }
}

async function signAdminPayload(payloadText, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadText));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function encodeBase64Url(value) {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
