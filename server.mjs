import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');
const envPath = path.join(__dirname, '.env');
const uploadRoot = path.join(__dirname, 'public', 'uploads');
const port = Number(process.env.PORT || 3001);

loadEnvFile(envPath);

const adminPassword = process.env.ADMIN_PASSWORD || '18522';
const adminTokens = new Map();
const allowedCategories = new Set(['winter', 'anniversary', 'gma', 'daily']);
const allowedImageCategories = new Set(['gallery', 'album']);
const allowedUploadCategories = new Set(['gallery', 'album', 'thumbnail', 'wechat']);
const allowedUploadTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const maxUploadBytes = 8 * 1024 * 1024;

createServer(async (req, res) => {
  try {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      return sendJson(res, 204, null);
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = normalizePath(url.pathname);

    if (req.method === 'POST' && pathname === '/admin/login') {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, createAdminSession(payload));
    }

    if (req.method === 'GET' && pathname === '/articles') {
      const db = await readDb();
      return sendJson(res, 200, db.articles || []);
    }

    if (req.method === 'GET' && pathname === '/wechat-articles') {
      const db = await readDb();
      const articles = (db.wechatArticles || []).filter((article) => article.isPublished !== false);
      return sendJson(res, 200, sortWechatArticles(articles));
    }

    if (req.method === 'GET' && pathname === '/wechat-articles/admin') {
      requireAdmin(req);
      const db = await readDb();
      return sendJson(res, 200, sortWechatArticles(db.wechatArticles || []));
    }

    if (req.method === 'POST' && pathname === '/wechat-articles/parse') {
      requireAdmin(req);
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await parseWechatArticle(payload));
    }

    if (req.method === 'POST' && pathname === '/wechat-articles') {
      requireAdmin(req);
      const payload = await readJsonBody(req);
      const article = normalizeWechatArticle(payload);
      const db = await readDb();
      db.wechatArticles = [article, ...(db.wechatArticles || [])];
      await writeDb(db);
      return sendJson(res, 201, article);
    }

    const wechatArticleMatch = pathname.match(/^\/wechat-articles\/([^/]+)$/);
    if (req.method === 'PATCH' && wechatArticleMatch) {
      requireAdmin(req);
      const id = decodeURIComponent(wechatArticleMatch[1]);
      const payload = await readJsonBody(req);
      const article = normalizeWechatArticle({ ...payload, id });
      const db = await readDb();
      const articles = db.wechatArticles || [];
      const index = articles.findIndex((item) => String(item.id) === id);
      if (index === -1) {
        return sendJson(res, 404, { error: 'Wechat article not found' });
      }
      articles[index] = article;
      db.wechatArticles = articles;
      await writeDb(db);
      return sendJson(res, 200, article);
    }

    if (req.method === 'DELETE' && wechatArticleMatch) {
      requireAdmin(req);
      const id = decodeURIComponent(wechatArticleMatch[1]);
      const db = await readDb();
      const before = db.wechatArticles?.length || 0;
      db.wechatArticles = (db.wechatArticles || []).filter((article) => String(article.id) !== id);
      await writeDb(db);
      return sendJson(res, before === db.wechatArticles.length ? 404 : 204, null);
    }

    if (req.method === 'GET' && pathname === '/videos') {
      const db = await readDb();
      return sendJson(res, 200, db.videos || []);
    }

    if (req.method === 'POST' && pathname === '/videos') {
      requireAdmin(req);
      const payload = await readJsonBody(req);
      const video = normalizeVideo(payload);
      const db = await readDb();
      db.videos = [video, ...(db.videos || [])];
      await writeDb(db);
      return sendJson(res, 201, video);
    }

    const videoMatch = pathname.match(/^\/videos\/([^/]+)$/);
    if (req.method === 'PATCH' && videoMatch) {
      requireAdmin(req);
      const id = decodeURIComponent(videoMatch[1]);
      const payload = await readJsonBody(req);
      const video = normalizeVideo({ ...payload, id });
      const db = await readDb();
      const videos = db.videos || [];
      const index = videos.findIndex((item) => String(item.id) === id);
      if (index === -1) {
        return sendJson(res, 404, { error: 'Video not found' });
      }
      videos[index] = video;
      db.videos = videos;
      await writeDb(db);
      return sendJson(res, 200, video);
    }

    if (req.method === 'DELETE' && videoMatch) {
      requireAdmin(req);
      const id = decodeURIComponent(videoMatch[1]);
      const db = await readDb();
      const before = db.videos?.length || 0;
      db.videos = (db.videos || []).filter((video) => String(video.id) !== id);
      await writeDb(db);
      return sendJson(res, before === db.videos.length ? 404 : 204, null);
    }

    if (req.method === 'GET' && pathname === '/site-settings') {
      const db = await readDb();
      return sendJson(res, 200, getSiteSettings(db));
    }

    if (req.method === 'PATCH' && pathname === '/site-settings') {
      requireAdmin(req);
      const payload = await readJsonBody(req);
      const db = await readDb();
      db.siteSettings = normalizeSiteSettings({
        ...getSiteSettings(db),
        ...payload,
      });
      await writeDb(db);
      return sendJson(res, 200, db.siteSettings);
    }

    if (req.method === 'GET' && pathname === '/media-images') {
      const db = await readDb();
      return sendJson(res, 200, db.mediaImages || []);
    }

    if (req.method === 'POST' && pathname === '/media-images') {
      requireAdmin(req);
      const payload = await readJsonBody(req);
      const image = normalizeManagedImage(payload);
      const db = await readDb();
      db.mediaImages = [image, ...(db.mediaImages || [])];
      await writeDb(db);
      return sendJson(res, 201, image);
    }

    const mediaImageMatch = pathname.match(/^\/media-images\/([^/]+)$/);
    if (req.method === 'PATCH' && mediaImageMatch) {
      requireAdmin(req);
      const id = decodeURIComponent(mediaImageMatch[1]);
      const payload = await readJsonBody(req);
      const image = normalizeManagedImage({ ...payload, id });
      const db = await readDb();
      const images = db.mediaImages || [];
      const index = images.findIndex((item) => String(item.id) === id);
      if (index === -1) {
        return sendJson(res, 404, { error: 'Image not found' });
      }
      images[index] = image;
      db.mediaImages = images;
      await writeDb(db);
      return sendJson(res, 200, image);
    }

    if (req.method === 'DELETE' && mediaImageMatch) {
      requireAdmin(req);
      const id = decodeURIComponent(mediaImageMatch[1]);
      const db = await readDb();
      const before = db.mediaImages?.length || 0;
      db.mediaImages = (db.mediaImages || []).filter((image) => String(image.id) !== id);
      await writeDb(db);
      return sendJson(res, before === db.mediaImages.length ? 404 : 204, null);
    }

    if (req.method === 'POST' && pathname === '/uploads') {
      requireAdmin(req);
      const upload = await saveUploadedFile(req);
      return sendJson(res, 201, upload);
    }

    if (req.method === 'POST' && pathname === '/chat-messages') {
      const payload = await readJsonBody(req);
      const response = await proxyDifyChat(payload);
      return sendJson(res, response.status, response.body);
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    if (statusCode >= 500) {
      console.error('[api] request failed:', error);
    }
    return sendJson(res, statusCode, {
      error: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  }
}).listen(port, () => {
  console.log(`YanFeng API server listening on http://localhost:${port}`);
});

function normalizePath(pathname) {
  return pathname.startsWith('/api/') ? pathname.slice(4) : pathname;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sendJson(res, status, data) {
  res.statusCode = status;
  if (status === 204) {
    return res.end();
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

async function readDb() {
  const raw = await readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw httpError(400, 'Invalid JSON body');
  }
}

function createAdminSession(payload) {
  const message = String(payload?.message || payload?.password || '').trim();
  if (message !== adminPassword) {
    throw httpError(401, 'Invalid admin password');
  }

  const token = `local-${randomUUID()}`;
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 6;
  adminTokens.set(token, expiresAt);
  return {
    token,
    expiresAt,
    configured: true,
  };
}

function requireAdmin(req) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const expiresAt = adminTokens.get(token);

  if (!expiresAt || expiresAt < Math.floor(Date.now() / 1000)) {
    throw httpError(401, 'Admin token is required');
  }
}

async function saveUploadedFile(req) {
  const formRequest = new Request('http://localhost/uploads', {
    method: 'POST',
    headers: req.headers,
    body: req,
    duplex: 'half',
  });
  const formData = await formRequest.formData();
  const file = formData.get('file');
  const category = String(formData.get('category') || 'gallery').trim();

  if (!file || typeof file.arrayBuffer !== 'function') {
    throw httpError(400, 'Image file is required');
  }

  if (!allowedUploadCategories.has(category)) {
    throw httpError(400, 'Invalid upload category');
  }

  const contentType = String(file.type || '').toLowerCase();
  const extension = allowedUploadTypes.get(contentType);
  if (!extension) {
    throw httpError(400, 'Only JPG, PNG, and WebP uploads are allowed');
  }

  if (file.size > maxUploadBytes) {
    throw httpError(400, 'Image must be 8 MB or smaller');
  }

  const id = randomUUID();
  const year = String(new Date().getFullYear());
  const relativePath = path.join('uploads', category, year, `${id}.${extension}`);
  const outputPath = path.join(__dirname, 'public', relativePath);
  const resolvedOutputPath = path.resolve(outputPath);
  const resolvedUploadRoot = path.resolve(uploadRoot);

  if (!resolvedOutputPath.startsWith(resolvedUploadRoot)) {
    throw httpError(400, 'Invalid upload path');
  }

  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, Buffer.from(await file.arrayBuffer()));

  const publicUrl = `/${relativePath.replaceAll(path.sep, '/')}`;
  const db = await readDb();
  db.uploads = [
    {
      id,
      key: relativePath.replaceAll(path.sep, '/'),
      url: publicUrl,
      filename: String(file.name || `${id}.${extension}`),
      contentType,
      byteSize: file.size,
      createdAt: new Date().toISOString(),
    },
    ...(db.uploads || []),
  ];
  await writeDb(db);

  return {
    id,
    key: relativePath.replaceAll(path.sep, '/'),
    url: publicUrl,
    filename: String(file.name || `${id}.${extension}`),
    contentType,
    byteSize: file.size,
  };
}

function normalizeVideo(payload) {
  const title = String(payload?.title || '').trim();
  const url = String(payload?.url || '').trim();
  const thumbnail = String(payload?.thumbnail || '').trim();
  const category = String(payload?.category || 'daily').trim();

  if (!title) {
    throw httpError(400, 'Video title is required');
  }

  if (!url || !isAllowedBilibiliPlayerUrl(url)) {
    throw httpError(400, 'A valid Bilibili player URL is required');
  }

  if (!allowedCategories.has(category)) {
    throw httpError(400, 'Invalid video category');
  }

  if (thumbnail && !isAllowedImageUrl(thumbnail)) {
    throw httpError(400, 'A valid thumbnail image URL is required');
  }

  return {
    id: String(payload?.id || Date.now()),
    title,
    url,
    type: 'bilibili',
    thumbnail,
    category,
  };
}

function getSiteSettings(db) {
  return normalizeSiteSettings(db.siteSettings || { mainGroupNumber: '737508445' });
}

function normalizeSiteSettings(payload) {
  const mainGroupNumber = String(payload?.mainGroupNumber || '').trim();

  if (!mainGroupNumber) {
    throw httpError(400, 'Main QQ group number is required');
  }

  return {
    mainGroupNumber,
  };
}

function normalizeManagedImage(payload) {
  const title = String(payload?.title || '').trim();
  const imageUrl = String(payload?.imageUrl || '').trim();
  const category = String(payload?.category || '').trim();

  if (!title) {
    throw httpError(400, 'Image title is required');
  }

  if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
    throw httpError(400, 'A valid image URL is required');
  }

  if (!allowedImageCategories.has(category)) {
    throw httpError(400, 'Invalid image category');
  }

  return {
    id: String(payload?.id || Date.now()),
    title,
    imageUrl,
    category,
  };
}

function normalizeWechatArticle(payload) {
  const wechatUrl = String(payload?.wechatUrl || payload?.wechat_url || '').trim();
  const title = String(payload?.title || '').trim() || '未命名公众号推文';
  const summary = String(payload?.summary || '').trim();
  const coverUrl = String(payload?.coverUrl || payload?.cover_url || '').trim();
  const publishedAt = String(payload?.publishedAt || payload?.published_at || '').trim() || new Date().toISOString().slice(0, 10);
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
    id: String(payload?.id || randomUUID()),
    title,
    summary,
    coverUrl,
    wechatUrl,
    publishedAt,
    isPublished,
    sortOrder,
  };
}

function sortWechatArticles(articles) {
  return [...articles].sort((a, b) => {
    const sortDelta = Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
    if (sortDelta !== 0) return sortDelta;
    return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
  });
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
  if (value.startsWith('/') && !value.startsWith('//')) {
    return true;
  }

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
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return { wechatUrl, title: '', summary: '', coverUrl: '', publishedAt: '' };
    }

    const html = await response.text();
    return {
      wechatUrl,
      ...extractWechatArticleMeta(html),
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
    publishedAt: cleanExtractedText(publishedAt),
  };
}

function extractMetaContent(html, attribute, value) {
  const attr = escapeRegExp(attribute);
  const val = escapeRegExp(value);
  const patterns = [
    new RegExp(`<meta\\s+[^>]*${attr}=["']${val}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${val}["'][^>]*>`, 'i'),
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

async function proxyDifyChat(payload) {
  const apiKey = process.env.DIFY_API_KEY || process.env.VITE_DIFY_API_KEY;
  const apiUrl = (process.env.DIFY_API_URL || 'https://api.dify.ai/v1').replace(/\/+$/, '');

  if (!apiKey) {
    return {
      status: 200,
      body: {
        answer: 'AI assistant is not configured yet.',
      },
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
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: payload?.inputs || {},
      query,
      response_mode: 'blocking',
      conversation_id: payload?.conversation_id || '',
      user: payload?.user || 'yanfeng-web',
      files: payload?.files || [],
    }),
  });

  const responseText = await difyResponse.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { answer: responseText };
  }

  if (!difyResponse.ok) {
    console.error('[api] Dify error:', data);
    return {
      status: 502,
      body: {
        answer: 'Chat service is temporarily unavailable.',
      },
    };
  }

  return {
    status: 200,
    body: {
      answer: data.answer || 'I do not have an answer yet.',
      conversation_id: data.conversation_id,
      message_id: data.message_id,
    },
  };
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
