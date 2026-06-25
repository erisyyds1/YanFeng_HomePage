import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'db.json');
const configPath = path.join(__dirname, 'wechat-discover.config.json');
const crawlScriptPath = path.join(__dirname, 'crawl-wechat.mjs');

const args = parseArgs(process.argv.slice(2));
const config = await readConfig();
const db = await readDb();
const targetDate = args.date || formatDate(new Date());
const lookbackDays = Number(args.lookbackDays || config.lookbackDays || 3);
const sinceTimestamp = getStartOfDateTimestamp(targetDate) - lookbackDays * 86400;

const report = {
  accountName: config.accountName,
  targetDate,
  lookbackDays,
  sources: [],
  candidates: [],
  newUrls: [],
  skipped: [],
};

const candidates = new Map();

await discoverFromProfile(candidates);
await discoverFromSogou(candidates);

for (const candidate of candidates.values()) {
  const normalized = normalizeCandidate(candidate);
  if (!normalized.url) {
    continue;
  }

  report.candidates.push(normalized);

  if (isExistingArticle(normalized, db.articles || [])) {
    report.skipped.push({ ...normalized, reason: 'already in db' });
  } else {
    report.newUrls.push(normalized.url);
  }
}

report.newUrls = [...new Set(report.newUrls)];

printReport(report);

if (args.dryRun || args.noCrawl) {
  process.exit(0);
}

if (report.newUrls.length === 0) {
  console.log('No new WeChat articles discovered.');
  process.exit(0);
}

const result = spawnSync(process.execPath, [crawlScriptPath, ...report.newUrls], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status || 0);

async function discoverFromProfile(candidates) {
  const biz = config.profileBiz || await discoverBizFromSeedUrls();
  if (!biz) {
    report.sources.push({ name: 'profile', ok: false, reason: 'missing __biz' });
    return;
  }

  const profileUrl = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${encodeURIComponent(biz)}&scene=124#wechat_redirect`;
  try {
    const html = await fetchText(profileUrl, { referer: 'https://mp.weixin.qq.com/' });

    if (/验证|antispider|captcha/i.test(html.slice(0, 3000))) {
      report.sources.push({ name: 'profile', ok: false, reason: 'verification page' });
      return;
    }

    const links = extractMpLinks(html);
    for (const url of links) {
      candidates.set(url, { url, source: 'profile' });
    }

    report.sources.push({ name: 'profile', ok: true, count: links.length });
  } catch (error) {
    report.sources.push({ name: 'profile', ok: false, reason: error.message });
  }
}

async function discoverFromSogou(candidates) {
  const queries = buildSearchQueries();
  let total = 0;

  for (const query of queries) {
    try {
      const searchUrl = `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(query)}`;
      const { html, cookie } = await fetchTextWithCookie(searchUrl, {
        referer: 'https://weixin.sogou.com/',
      });
      const items = parseSogouItems(html)
        .filter((item) => !config.accountName || item.accountName === config.accountName)
        .filter((item) => !item.timestamp || Number(item.timestamp) >= sinceTimestamp);

      for (const item of items.slice(0, Number(args.maxResolve || 8))) {
        const url = await resolveSogouHref(item.href, searchUrl, cookie);
        if (!url) {
          continue;
        }

        total += 1;
        candidates.set(url, {
          url,
          title: item.title,
          date: item.date,
          accountName: item.accountName,
          source: `sogou:${query}`,
        });
      }

      report.sources.push({ name: `sogou:${query}`, ok: true, count: items.length });
    } catch (error) {
      report.sources.push({ name: `sogou:${query}`, ok: false, reason: error.message });
    }
  }

  if (total === 0 && queries.length > 0) {
    report.sources.push({ name: 'sogou', ok: false, reason: 'no resolvable article links' });
  }
}

async function discoverBizFromSeedUrls() {
  const seedUrls = config.seedUrls || [];
  for (const url of seedUrls) {
    try {
      const html = await fetchText(url, { referer: 'https://mp.weixin.qq.com/' });
      const biz = getJsString(html, 'biz');
      if (biz) {
        return biz;
      }
    } catch {
      // Try the next seed URL.
    }
  }
  return '';
}

function buildSearchQueries() {
  const queries = new Set(config.searchQueries || []);
  if (config.accountName) {
    queries.add(config.accountName);
    queries.add(`${config.accountName} ${targetDate}`);
    queries.add(`${config.accountName} ${formatChineseDate(targetDate)}`);
  }
  return [...queries].filter(Boolean);
}

function parseSogouItems(html) {
  return [...html.matchAll(/<li id="sogou_vr_11002601_box_\d+"[\s\S]*?<\/li>/g)]
    .map((match) => {
      const li = match[0];
      const title = cleanText(matchFirst(li, /<h3>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i));
      const summary = cleanText(matchFirst(li, /<p class="txt-info"[^>]*>([\s\S]*?)<\/p>/i));
      const accountName = cleanText(matchFirst(li, /<span class="all-time-y2">([\s\S]*?)<\/span>/i));
      const timestamp = matchFirst(li, /timeConvert\('?(\d+)'?\)/);
      const href = decodeHtml(matchFirst(li, /<h3>[\s\S]*?<a[^>]*href="([^"]+)"/i));
      const coverUrl = decodeHtml(matchFirst(li, /<img[^>]+src="([^"]+)"/i));

      return {
        title,
        summary,
        accountName,
        timestamp,
        date: timestamp ? formatDate(new Date(Number(timestamp) * 1000)) : '',
        href,
        coverUrl,
      };
    })
    .filter((item) => item.href && item.title);
}

async function resolveSogouHref(href, referer, cookie) {
  if (!href) {
    return '';
  }

  if (/^https?:\/\/mp\.weixin\.qq\.com\//.test(href)) {
    return href;
  }

  const url = new URL(href.replaceAll('&amp;', '&'), 'https://weixin.sogou.com/').toString();
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      ...browserHeaders(referer),
      Cookie: cookie,
    },
  });

  const location = response.headers.get('location');
  if (location && location.includes('mp.weixin.qq.com/')) {
    return new URL(location, url).toString();
  }

  const html = await response.text();
  const directLinks = extractMpLinks(html);
  if (directLinks.length > 0) {
    return directLinks[0];
  }

  const joinedUrl = [...html.matchAll(/url\s*\+=\s*'([^']*)'/g)].map((match) => match[1]).join('');
  if (joinedUrl.includes('mp.weixin.qq.com/')) {
    return joinedUrl;
  }

  return '';
}

function extractMpLinks(html) {
  const links = new Set();
  const patterns = [
    /https?:\/\/mp\.weixin\.qq\.com\/s\/[A-Za-z0-9_-]+/g,
    /https?:\/\/mp\.weixin\.qq\.com\/s\?[^"' <\\]+/g,
    /https?:\\\/\\\/mp\.weixin\.qq\.com\\\/s\\\/[A-Za-z0-9_-]+/g,
    /https?:\\\/\\\/mp\.weixin\.qq\.com\\\/s\?[^"' <\\]+/g,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      links.add(decodeHtml(match[0].replaceAll('\\/', '/')));
    }
  }

  return [...links];
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: browserHeaders(options.referer),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function fetchTextWithCookie(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: browserHeaders(options.referer),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const setCookie = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [];
  const cookie = setCookie.map((item) => item.split(';')[0]).join('; ');

  return {
    html: await response.text(),
    cookie,
  };
}

function browserHeaders(referer = '') {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    ...(referer ? { Referer: referer } : {}),
  };
}

async function readConfig() {
  if (!existsSync(configPath)) {
    return {};
  }
  return JSON.parse(await readFile(configPath, 'utf8'));
}

async function readDb() {
  if (!existsSync(dbPath)) {
    return { articles: [] };
  }
  return JSON.parse(await readFile(dbPath, 'utf8'));
}

function isExistingArticle(candidate, articles) {
  return articles.some((article) => {
    if (article.link && candidate.url && article.link === candidate.url) {
      return true;
    }
    return Boolean(article.title && candidate.title && article.date && candidate.date && article.title === candidate.title && article.date === candidate.date);
  });
}

function normalizeCandidate(candidate) {
  return {
    url: candidate.url,
    title: candidate.title || '',
    date: candidate.date || '',
    accountName: candidate.accountName || config.accountName || '',
    source: candidate.source || '',
  };
}

function printReport(value) {
  const compact = {
    accountName: value.accountName,
    targetDate: value.targetDate,
    lookbackDays: value.lookbackDays,
    sources: value.sources,
    candidates: value.candidates.map((item) => ({
      title: item.title,
      date: item.date,
      accountName: item.accountName,
      source: item.source,
      url: item.url,
    })),
    skipped: value.skipped.map((item) => ({
      title: item.title,
      date: item.date,
      reason: item.reason,
    })),
    newUrls: value.newUrls,
  };
  console.log(JSON.stringify(compact, null, 2));
}

function parseArgs(rawArgs) {
  const result = {
    dryRun: false,
    noCrawl: false,
    date: '',
    lookbackDays: '',
    maxResolve: '',
  };

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--no-crawl') result.noCrawl = true;
    else if (arg === '--date') result.date = rawArgs[++i] || '';
    else if (arg.startsWith('--date=')) result.date = arg.slice('--date='.length);
    else if (arg === '--lookback-days') result.lookbackDays = rawArgs[++i] || '';
    else if (arg.startsWith('--lookback-days=')) result.lookbackDays = arg.slice('--lookback-days='.length);
    else if (arg === '--max-resolve') result.maxResolve = rawArgs[++i] || '';
    else if (arg.startsWith('--max-resolve=')) result.maxResolve = arg.slice('--max-resolve='.length);
  }

  return result;
}

function getStartOfDateTimestamp(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return Math.floor(new Date(Date.UTC(year, month - 1, day, -8, 0, 0)).getTime() / 1000);
}

function formatDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function formatChineseDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function getJsString(html, variableName) {
  const escaped = escapeRegex(variableName);
  const match = html.match(new RegExp(`var\\s+${escaped}\\s*=\\s*(?:'([^']*)'|"([^"]*)")`, 'i'));
  return decodeHtml(match?.[1] || match?.[2] || '');
}

function matchFirst(text, regex) {
  return text.match(regex)?.[1] || '';
}

function cleanText(value) {
  return decodeHtml(stripTags(String(value || '')))
    .replace(/<!--.*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ');
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&mdash;/g, '—')
    .replace(/&ne;/g, '≠')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
