import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');
const envPath = path.join(__dirname, '.env');
const port = Number(process.env.PORT || 3001);

loadEnvFile(envPath);

const allowedCategories = new Set(['winter', 'anniversary', 'gma', 'daily']);

createServer(async (req, res) => {
  try {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      return sendJson(res, 204, null);
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = normalizePath(url.pathname);

    if (req.method === 'GET' && pathname === '/articles') {
      const db = await readDb();
      return sendJson(res, 200, db.articles || []);
    }

    if (req.method === 'GET' && pathname === '/videos') {
      const db = await readDb();
      return sendJson(res, 200, db.videos || []);
    }

    if (req.method === 'POST' && pathname === '/videos') {
      const payload = await readJsonBody(req);
      const video = normalizeVideo(payload);
      const db = await readDb();
      db.videos = [video, ...(db.videos || [])];
      await writeDb(db);
      return sendJson(res, 201, video);
    }

    const deleteVideoMatch = pathname.match(/^\/videos\/([^/]+)$/);
    if (req.method === 'DELETE' && deleteVideoMatch) {
      const id = decodeURIComponent(deleteVideoMatch[1]);
      const db = await readDb();
      const before = db.videos?.length || 0;
      db.videos = (db.videos || []).filter((video) => String(video.id) !== id);
      await writeDb(db);
      return sendJson(res, before === db.videos.length ? 404 : 204, null);
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
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
    throw badRequest('Invalid JSON body');
  }
}

function normalizeVideo(payload) {
  const title = String(payload?.title || '').trim();
  const url = String(payload?.url || '').trim();
  const thumbnail = String(payload?.thumbnail || '').trim();
  const category = String(payload?.category || 'daily').trim();

  if (!title) {
    throw badRequest('Video title is required');
  }

  if (!url || !isAllowedBilibiliPlayerUrl(url)) {
    throw badRequest('A valid Bilibili player URL is required');
  }

  if (!allowedCategories.has(category)) {
    throw badRequest('Invalid video category');
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

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function isAllowedBilibiliPlayerUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname === 'player.bilibili.com';
  } catch {
    return false;
  }
}

async function proxyDifyChat(payload) {
  const apiKey = process.env.DIFY_API_KEY || process.env.VITE_DIFY_API_KEY;
  const apiUrl = (process.env.DIFY_API_URL || 'https://api.dify.ai/v1').replace(/\/+$/, '');

  if (!apiKey) {
    return {
      status: 200,
      body: {
        answer: 'AI 助手还没有配置服务端 Dify Key。请在 .env 中设置 DIFY_API_KEY 后重启 API 服务。',
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
        answer: '连接社团 AI 服务失败，请稍后再试。',
      },
    };
  }

  return {
    status: 200,
    body: {
      answer: data.answer || '我暂时没有组织好答案，请换个问法再试试。',
      conversation_id: data.conversation_id,
      message_id: data.message_id,
    },
  };
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
