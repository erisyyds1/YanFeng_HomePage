import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'db.json');
const seedPath = path.join(__dirname, 'wechat-urls.txt');
const coverDir = path.join(rootDir, 'public', 'wechat-covers');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputUrls = args.filter((arg) => !arg.startsWith('--'));

const urls = inputUrls.length > 0 ? inputUrls : await readSeedUrls();

if (urls.length === 0) {
  console.error('No WeChat article URLs provided.');
  console.error('Usage: npm run crawl:wechat -- https://mp.weixin.qq.com/s/...');
  console.error(`Or add URLs to ${path.relative(rootDir, seedPath)}`);
  process.exit(1);
}

const articles = [];
for (const url of urls) {
  try {
    const article = await crawlWeChatArticle(url);
    articles.push(article);
    console.log(`OK ${article.date} ${article.title}`);
  } catch (error) {
    console.error(`FAIL ${url}`);
    console.error(`  ${error.message}`);
  }
}

if (articles.length === 0) {
  process.exit(1);
}

if (dryRun) {
  console.log(JSON.stringify(articles, null, 2));
} else {
  await downloadArticleCovers(articles);
  await upsertArticles(articles);
  console.log(`Updated ${path.relative(rootDir, dbPath)} with ${articles.length} article(s).`);
}

async function readSeedUrls() {
  if (!existsSync(seedPath)) {
    return [];
  }

  const text = await readFile(seedPath, 'utf8');
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

async function crawlWeChatArticle(url) {
  assertWeChatArticleUrl(url);

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Referer: 'https://mp.weixin.qq.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const html = new TextDecoder('utf-8').decode(buffer);

  const title = cleanText(
    getMetaContent(html, 'og:title') ||
      getJsString(html, 'msg_title') ||
      getTextById(html, 'activity-name')
  );

  if (!title) {
    throw new Error('Could not parse article title');
  }

  const summary = cleanText(
    getMetaContent(html, 'og:description') ||
      getJsHtmlDecodeString(html, 'msg_desc') ||
      getMetaNameContent(html, 'description') ||
      ''
  );
  const coverUrl = cleanText(getMetaContent(html, 'og:image') || getJsString(html, 'msg_cdn_url') || '');
  const accountName = cleanText(getTextById(html, 'js_name') || getMetaContent(html, 'og:article:author') || '');
  const date = getArticleDate(html);

  return {
    id: createArticleId(html, url),
    title,
    date,
    summary,
    tag: accountName || '公众号',
    link: url,
    coverUrl,
  };
}

async function downloadArticleCovers(articles) {
  await mkdir(coverDir, { recursive: true });

  for (const article of articles) {
    if (!article.coverUrl || article.coverUrl.startsWith('/')) {
      continue;
    }

    try {
      const localCoverUrl = await downloadCover(article.id, article.coverUrl);
      article.coverUrl = localCoverUrl;
      console.log(`IMG ${article.title} -> ${localCoverUrl}`);
    } catch (error) {
      console.warn(`WARN cover download failed for "${article.title}": ${error.message}`);
    }
  }
}

async function downloadCover(articleId, imageUrl) {
  const response = await fetch(imageUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: 'https://mp.weixin.qq.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Unexpected content type: ${contentType || 'unknown'}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = getImageExtension(contentType, imageUrl);
  const fileName = `${articleId}${extension}`;
  const filePath = path.join(coverDir, fileName);

  await writeFile(filePath, buffer);
  return `/wechat-covers/${fileName}`;
}

function getImageExtension(contentType, imageUrl) {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';

  try {
    const wxFmt = new URL(imageUrl).searchParams.get('wx_fmt');
    if (wxFmt) {
      return `.${wxFmt.replace(/^jpg$/, 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg'}`;
    }
  } catch {
    // fall through
  }

  return '.jpg';
}

async function upsertArticles(newArticles) {
  const db = JSON.parse(await readFile(dbPath, 'utf8'));
  const existing = Array.isArray(db.articles) ? db.articles : [];
  const articleMap = new Map();

  for (const article of existing) {
    articleMap.set(getArticleUniqueKey(article), article);
  }

  for (const article of newArticles) {
    for (const [key, existingArticle] of articleMap.entries()) {
      if (existingArticle.id === article.id || isSameArticle(existingArticle, article)) {
        articleMap.delete(key);
      }
    }
    articleMap.set(getArticleUniqueKey(article), article);
  }

  db.articles = [...articleMap.values()].sort((a, b) => {
    const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return String(b.id).localeCompare(String(a.id));
  });

  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
}

function assertWeChatArticleUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.hostname !== 'mp.weixin.qq.com') {
    throw new Error('Only mp.weixin.qq.com article URLs are supported');
  }
}

function createArticleId(html, url) {
  const biz = getJsString(html, 'biz');
  const mid = getJsString(html, 'mid') || matchFirst(html, /(?:mid|appmsgid|msgid)["']?\s*[:=]\s*["']?(\d{6,})/);
  const idx = getJsString(html, 'idx') || '1';

  if (biz && mid) {
    return `wx-${createHash('sha1').update(`${biz}:${mid}:${idx}`).digest('hex').slice(0, 12)}`;
  }

  return `wx-${createHash('sha1').update(url).digest('hex').slice(0, 12)}`;
}

function getArticleUniqueKey(article) {
  return `${article.id || ''}|${article.date || ''}|${article.title || ''}`;
}

function isSameArticle(left, right) {
  return Boolean(left.title && right.title && left.date && right.date && left.title === right.title && left.date === right.date);
}

function getArticleDate(html) {
  const visibleDate = cleanText(getTextById(html, 'publish_time'));
  if (/^\d{4}-\d{2}-\d{2}$/.test(visibleDate)) {
    return visibleDate;
  }

  const publishTime = matchFirst(html, /"publish_time"%22%3A(\d{10})/) || matchFirst(html, /publish_time["']?\s*[:=]\s*["']?(\d{10})/);
  const ct = matchFirst(html, /var\s+ct\s*=\s*["'](\d{10})["']/);
  const timestamp = Number(publishTime || ct);

  if (Number.isFinite(timestamp) && timestamp > 0) {
    return new Date(timestamp * 1000).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function getMetaContent(html, property) {
  return getMetaAttributeContent(html, 'property', property);
}

function getMetaNameContent(html, name) {
  return getMetaAttributeContent(html, 'name', name);
}

function getMetaAttributeContent(html, attr, value) {
  const escaped = escapeRegex(value);
  const regexes = [
    new RegExp(`<meta\\b(?=[^>]*\\b${attr}=["']${escaped}["'])(?=[^>]*\\bcontent=["']([^"']*)["'])[^>]*>`, 'i'),
    new RegExp(`<meta\\b(?=[^>]*\\bcontent=["']([^"']*)["'])(?=[^>]*\\b${attr}=["']${escaped}["'])[^>]*>`, 'i'),
  ];

  for (const regex of regexes) {
    const match = html.match(regex);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return '';
}

function getJsString(html, variableName) {
  const escaped = escapeRegex(variableName);
  const match = html.match(new RegExp(`var\\s+${escaped}\\s*=\\s*(?:'([^']*)'|"([^"]*)")`, 'i'));
  const rawValue = match?.[1] || match?.[2] || '';
  return decodeHtml(rawValue.replace(/\.html\(false\)$/, ''));
}

function getJsHtmlDecodeString(html, variableName) {
  const escaped = escapeRegex(variableName);
  const match = html.match(new RegExp(`var\\s+${escaped}\\s*=\\s*htmlDecode\\((?:'([^']*)'|"([^"]*)")\\)`, 'i'));
  return decodeHtml(match?.[1] || match?.[2] || '');
}

function getTextById(html, id) {
  const escaped = escapeRegex(id);
  const match = html.match(new RegExp(`<[^>]+id=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'));
  return decodeHtml(stripTags(match?.[1] || ''));
}

function matchFirst(text, regex) {
  return text.match(regex)?.[1] || '';
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ');
}

function cleanText(value) {
  return decodeHtml(String(value || ''))
    .replace(/\\x0d\\x0a/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
