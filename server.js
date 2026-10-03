// 作者：史鸿洁 · © 2026 史鸿洁 · 采用 CC BY-NC 4.0 许可（署名 · 非商业性使用），详见 LICENSE
// 公众号排版工作台 · 本机服务（简化版 2026-10-03）
// 只做四件事：提供网页、保存当前文章（data/workspace.json）、保存封面、读取风格库和文章库。
import http from 'node:http';
import { readFile, writeFile, mkdir, rename, readdir, stat, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const dataDir = path.join(root, 'data');
const documentPath = path.join(dataDir, 'workspace.json');
const coverDir = path.join(dataDir, 'covers');
const styleDir = path.join(dataDir, 'style-library');
const libraryDir = path.join(dataDir, 'library');
const backupDir = path.join(dataDir, 'backups');
const DOCUMENT_LIMIT = 40000000;
const COVER_KINDS = ['wide', 'square', 'portrait', 'proof', 'source'];
// 11 套风格的固定顺序（目录名）
const STYLE_ORDER = ['vintage-paper', 'neon-metal', 'retro-pop-comic', 'dynamic-narrative-comic', 'warm-handdrawn-info', 'neon-scifi-cartoon', 'neon-portrait', 'pop-portrait', 'rough-sketch-diagram', 'real-photo', 'screenshot-annotate'];
// 跟着文章走的字段；其它字段（人物照片等）是全局的，切换文章时保留
const ARTICLE_KEYS = ['articleId', 'title', 'markdown', 'imageStyle', 'coverStyle', 'theme', 'layoutPalette', 'layoutPaletteFor', 'accent', 'headingStyle', 'tableStyle', 'fontChoice', 'font', 'line', 'gap', 'radius', 'layoutKicker', 'layoutHideFigLabels', 'stage', 'generated', 'visualPlan', 'visualPlanConfirmed', 'selectedVisualPlanId', 'bodyImageCandidates', 'bodyImageAssignments', 'imageIdea', 'coverReady', 'coverRevision', 'coverAccepted', 'coverFeedback', 'coverGenerationPending', 'imageGenerationPending', 'generationStartedAt', 'articleEntryInput', 'articleDraftPending', 'includeOwner', 'cartoonCharacters', 'brief', 'coverTitle', 'coverCropOffset', 'writingView', 'photoAccent', 'realCoverPhoto', 'realCoverTitle', 'realCoverAccent', 'shotAccent'];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const STATIC_FILES = ['index.html', 'app.js', 'md.js', 'wx-layouts.js', 'photo.js', 'shot.js'];

function send(res, status, body, type = 'application/json; charset=utf-8', cache = 'no-store') {
  res.writeHead(status, { 'content-type': type, 'cache-control': cache, 'x-content-type-options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
async function readJson(req, res, limit = 30000) {
  let raw = '';
  for await (const part of req) {
    raw += part;
    if (raw.length > limit) { send(res, 413, { error: '输入内容过长。' }); return null; }
  }
  try { return JSON.parse(raw); } catch { send(res, 400, { error: '无法读取输入内容。' }); return null; }
}
async function writeJsonAtomic(file, data, mode = 0o600) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  await writeFile(temporary, JSON.stringify(data), { mode });
  await rename(temporary, file);
}
async function readDocument() { try { return JSON.parse(await readFile(documentPath, 'utf8')); } catch { return null; } }
const exists = async file => { try { await stat(file); return true; } catch { return false; } };
const safeId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj && k in obj).map(k => [k, obj[k]]));
const omit = (obj, keys) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !keys.includes(k)));

async function saveDocument(req, res) {
  const data = await readJson(req, res, DOCUMENT_LIMIT);
  if (!data) return;
  if (typeof data !== 'object' || typeof data.title !== 'string' || typeof data.markdown !== 'string') return send(res, 400, { error: '文章数据无效。' });
  try { await writeJsonAtomic(documentPath, data); send(res, 200, { saved: true }); }
  catch { send(res, 500, { error: '无法保存到桌面项目文件夹。' }); }
}
async function saveCovers(req, res) {
  const data = await readJson(req, res, 25000000);
  if (!data) return;
  if (COVER_KINDS.some(key => !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(data[key] || '')))) return send(res, 400, { error: '封面图片数据无效。' });
  try {
    await mkdir(coverDir, { recursive: true });
    for (const key of COVER_KINDS) await writeFile(path.join(coverDir, `cover-${key}.png`), Buffer.from(data[key].split(',')[1], 'base64'), { mode: 0o600 });
    send(res, 200, { saved: true, variants: Object.fromEntries(COVER_KINDS.map(key => [key, `/api/covers/${key}`])) });
  } catch { send(res, 500, { error: '封面无法保存到桌面项目。' }); }
}

// ---------- 风格库（data/style-library/*/style-config.json 是唯一来源） ----------
async function sampleFile(dir, name) {
  if (!name) return '';
  const jpg = name.replace(/\.(png|webp)$/i, '.jpg');
  if (jpg !== name && await exists(path.join(styleDir, dir, jpg))) return jpg;
  return await exists(path.join(styleDir, dir, name)) ? name : '';
}
async function listStyles() {
  const out = [];
  for (const dir of STYLE_ORDER) {
    let c; try { c = JSON.parse(await readFile(path.join(styleDir, dir, 'style-config.json'), 'utf8')); } catch { continue; }
    const body = await sampleFile(dir, c.bodySample), cover = await sampleFile(dir, c.coverSample);
    out.push({ dir, name: c.name, coverKey: c.coverKey, layoutTheme: c.layoutTheme, layoutName: c.coverBanner?.layoutName || '', bannerShort: c.coverBanner?.short || '',
      bodyPrompt: c.bodyPrompt || '', coverPrompt: c.coverPrompt || '', portrait: Boolean(c.samplePhoto) || ['neon-portrait', 'pop-portrait'].includes(dir), characterField: c.characterField || '', bodyRatio: c.bodyRatio || '3:2',
      userPhotos: Boolean(c.userPhotos), accentFrom: c.accentFrom || '', keepPng: Boolean(c.keepPng), bodyHint: c.bodyHint || '', coverHint: c.coverHint || '', accentHint: c.accentHint || '', planHint: c.planHint || '', coverRenderer: c.coverRenderer || '', shotFrame: Boolean(c.shotFrame),
      bodySampleUrl: body ? `/api/style-library/${dir}/${encodeURIComponent(body)}` : '', coverSampleUrl: cover ? `/api/style-library/${dir}/${encodeURIComponent(cover)}` : '' });
  }
  return out;
}
async function saveStylePrompts(req, res, dir) {
  if (!STYLE_ORDER.includes(dir)) return send(res, 404, { error: '没有这套风格。' });
  const data = await readJson(req, res, 200000); if (!data) return;
  if (typeof data.bodyPrompt !== 'string' || typeof data.coverPrompt !== 'string' || !data.bodyPrompt.trim() || !data.coverPrompt.trim()) return send(res, 400, { error: '请填写正文和封面的 Prompt。' });
  const file = path.join(styleDir, dir, 'style-config.json');
  try {
    const raw = await readFile(file, 'utf8'); const config = JSON.parse(raw);
    await mkdir(path.join(backupDir, 'styles'), { recursive: true });
    await writeFile(path.join(backupDir, 'styles', `${dir}-${Date.now()}.json`), raw);
    await pruneDir(path.join(backupDir, 'styles'), name => name.startsWith(dir + '-'), 5);
    config.bodyPrompt = data.bodyPrompt.trim(); config.coverPrompt = data.coverPrompt.trim();
    const temporary = `${file}.${Date.now()}.tmp`; await writeFile(temporary, JSON.stringify(config, null, 2) + '\n'); await rename(temporary, file);
    send(res, 200, { saved: true });
  } catch { send(res, 500, { error: '风格保存失败。' }); }
}
async function pruneDir(dir, filter, keep) {
  const names = (await readdir(dir)).filter(filter).sort();
  for (const name of names.slice(0, Math.max(0, names.length - keep))) await unlink(path.join(dir, name)).catch(() => {});
}

// ---------- 文章库：data/library/<id>/article.json + covers/ ----------
async function stashCurrent(doc) {
  if (!doc || !safeId(doc.articleId)) return;
  if (!String(doc.markdown || '').trim() && !String(doc.articleEntryInput || '').trim()) return; // 空白新文章不进文章库
  const folder = path.join(libraryDir, doc.articleId);
  await writeJsonAtomic(path.join(folder, 'article.json'), pick(doc, ARTICLE_KEYS));
  if (doc.coverReady) {
    await mkdir(path.join(folder, 'covers'), { recursive: true });
    for (const kind of COVER_KINDS) { const from = path.join(coverDir, `cover-${kind}.png`); if (await exists(from)) await copyFile(from, path.join(folder, 'covers', `cover-${kind}.png`)); }
  }
}
async function listLibrary() {
  const current = await readDocument();
  let ids = []; try { ids = (await readdir(libraryDir, { withFileTypes: true })).filter(x => x.isDirectory() && safeId(x.name)).map(x => x.name); } catch {}
  const items = [];
  for (const id of ids) {
    try {
      const file = path.join(libraryDir, id, 'article.json');
      const a = JSON.parse(await readFile(file, 'utf8')); const info = await stat(file);
      const live = current?.articleId === id ? current : a;
      items.push({ id, title: live.title || '未命名文章', imageStyle: live.imageStyle || '', updated: info.mtimeMs, current: current?.articleId === id });
    } catch {}
  }
  if (current && !items.some(x => x.current)) items.push({ id: current.articleId || '', title: current.title || '未命名文章', imageStyle: current.imageStyle || '', updated: Date.now(), current: true });
  items.sort((a, b) => b.updated - a.updated);
  return items;
}
async function openArticle(req, res, makeNew) {
  const data = await readJson(req, res, 2000); if (!data) return;
  const current = (await readDocument()) || { title: '', markdown: '' };
  try {
    if (!safeId(current.articleId)) current.articleId = 'article-' + Date.now().toString(36);
    await stashCurrent(current);
    let article;
    if (makeNew) {
      article = { articleId: 'article-' + Date.now().toString(36), title: '', markdown: '', stage: 'writing', font: 15, line: 1.85, gap: 22, radius: 8, headingStyle: 'theme', tableStyle: 'layout', fontChoice: 'theme', visualPlan: null, bodyImageCandidates: [], coverReady: false };
    } else {
      if (!safeId(data.id)) return send(res, 400, { error: '文章编号无效。' });
      article = JSON.parse(await readFile(path.join(libraryDir, data.id, 'article.json'), 'utf8'));
      article.articleId = data.id;
      const covers = path.join(libraryDir, data.id, 'covers');
      if (article.coverReady && await exists(path.join(covers, 'cover-wide.png'))) {
        await mkdir(coverDir, { recursive: true });
        for (const kind of COVER_KINDS) { const from = path.join(covers, `cover-${kind}.png`); if (await exists(from)) await copyFile(from, path.join(coverDir, `cover-${kind}.png`)); }
      } else article.coverReady = false;
    }
    const next = { ...omit(current, ARTICLE_KEYS), ...article, coverRevision: Date.now(), syncRevision: new Date().toISOString() };
    await writeJsonAtomic(documentPath, next);
    if (makeNew) await stashCurrent(next);
    send(res, 200, next);
  } catch { send(res, 500, { error: '文章打开失败。' }); }
}

http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  try {
    if (url === '/api/status') return send(res, 200, { ready: true, root });
    if (url === '/api/document' && req.method === 'GET') { const doc = await readDocument(); return doc ? send(res, 200, doc) : send(res, 404, { error: '还没有保存的文章。' }); }
    if (url === '/api/document' && req.method === 'PUT') return saveDocument(req, res);
    if (url === '/api/covers' && req.method === 'POST') return saveCovers(req, res);
    if (url.startsWith('/api/covers/') && req.method === 'GET') {
      const kind = url.slice('/api/covers/'.length);
      if (!COVER_KINDS.includes(kind)) return send(res, 404, 'Not found', 'text/plain');
      try { return send(res, 200, await readFile(path.join(coverDir, `cover-${kind}.png`)), 'image/png'); } catch { return send(res, 404, 'Not found', 'text/plain'); }
    }
    if (url === '/api/styles' && req.method === 'GET') return send(res, 200, await listStyles());
    if (url.startsWith('/api/styles/') && req.method === 'PUT') return saveStylePrompts(req, res, decodeURIComponent(url.slice('/api/styles/'.length)));
    if (url.startsWith('/api/style-library/') && req.method === 'GET') {
      const [dir, file] = url.slice('/api/style-library/'.length).split('/').map(decodeURIComponent);
      if (!STYLE_ORDER.includes(dir) || !file || !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(file)) return send(res, 404, 'Not found', 'text/plain');
      try { return send(res, 200, await readFile(path.join(styleDir, dir, file)), types[path.extname(file).toLowerCase()], 'max-age=3600'); } catch { return send(res, 404, 'Not found', 'text/plain'); }
    }
    if (url === '/api/library' && req.method === 'GET') return send(res, 200, await listLibrary());
    if (url === '/api/library/open' && req.method === 'POST') return openArticle(req, res, false);
    if (url === '/api/library/new' && req.method === 'POST') return openArticle(req, res, true);
    const name = url === '/' ? 'index.html' : url.slice(1);
    if (!STATIC_FILES.includes(name)) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, await readFile(path.join(root, 'dist', name)), types[path.extname(name)]);
  } catch { if (!res.headersSent) send(res, 500, { error: '服务出错。' }); }
}).listen(port, '127.0.0.1', () => console.log(`公众号排版工作台：http://127.0.0.1:${port}`));
