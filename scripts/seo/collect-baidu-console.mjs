// 采集：百度搜索资源平台的「流量与关键词」。百度没有公开接口，两条路：
//   1. 你在站长平台导出 CSV（流量与关键词 → 导出），放进 plan/seo/inbox/，文件名随意，脚本按表头识别；
//   2. Ego 浏览器里登录过百度后，脚本自动打开页面抓表格（任务空间「eryx seo baidu console」）。
// 两条路都走不通时记一条待办。结果写 plan/seo/data/baidu-console.json
import { readdirSync, readFileSync, renameSync, mkdirSync, statSync } from 'node:fs';
import { readJson, writeJson, pruneDays, TODAY, DATA, INBOX, ymd, egoRun } from './lib.mjs';

const FILE = `${DATA}/baidu-console.json`;
const all = readJson(FILE, { days: {}, loginNeeded: false });

// ── 1. inbox 里的 CSV ──
const decode = (buf) => { const s = buf.toString('utf8'); return s.includes('�') ? new TextDecoder('gbk').decode(buf) : s.replace(/^﻿/, ''); };
const splitCsv = (line) => { const out = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((s) => s.trim()); };
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const hi = lines.findIndex((l) => /关键词|keyword/i.test(l) && /展现|点击|impression|click/i.test(l));
  if (hi < 0) return null;
  const head = splitCsv(lines[hi]);
  const col = (re) => head.findIndex((h) => re.test(h));
  const c = { word: col(/关键词|keyword/i), imp: col(/展现/), click: col(/点击量|点击数|clicks?$/i), ctr: col(/点击率|ctr/i), rank: col(/排名|position/i), date: col(/日期|date/i) };
  const rows = [];
  for (const l of lines.slice(hi + 1)) {
    const r = splitCsv(l);
    if (!r[c.word]) continue;
    rows.push({ word: r[c.word], impressions: Number(r[c.imp]) || 0, clicks: Number(r[c.click]) || 0, ctr: c.ctr >= 0 ? r[c.ctr] : '', rank: c.rank >= 0 ? Number(r[c.rank]) || null : null, date: c.date >= 0 ? r[c.date] : '' });
  }
  return rows;
}
let imported = 0;
for (const f of readdirSync(INBOX).filter((f) => /\.(csv|txt)$/i.test(f))) {
  const p = `${INBOX}/${f}`;
  const rows = parseCsv(decode(readFileSync(p)));
  if (!rows) { console.log(`  inbox/${f} 看不出是流量与关键词导出，跳过`); continue; }
  const date = rows[0]?.date?.match(/\d{4}-?\d{2}-?\d{2}/) ? rows[0].date.replace(/(\d{4})-?(\d{2})-?(\d{2}).*/, '$1-$2-$3') : ymd(statSync(p).mtime);
  all.days[date] = { source: 'csv', file: f, keywords: rows.slice(0, 500) };
  mkdirSync(`${INBOX}/done`, { recursive: true });
  renameSync(p, `${INBOX}/done/${date}-${f}`);
  imported++;
  console.log(`  导入 inbox/${f} → ${date}，${rows.length} 个词`);
}

// ── 2. Ego 浏览器 ──
let browserOk = false;
try {
  const script = `
const task = await taskSpace("eryx seo baidu console");
const page = task.page("p1");
await page.goto("https://ziyuan.baidu.com/keywords/index", { timeout: 30000 });
await page.waitForTimeout(6000);
const text = await page.evaluate(() => document.body.innerText);
if (/因您未登录|请登录/.test(text)) { console.log(JSON.stringify({ loggedOut: true })); }
else if (!/关键词/.test(text)) { console.log(JSON.stringify({ loggedOut: false, url: await page.url(), tables: [] })); }
else {
  const tables = await page.evaluate(() => [...document.querySelectorAll('table')].map(t => [...t.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(td => td.innerText.trim()))));
  console.log(JSON.stringify({ loggedOut: false, url: await page.url(), tables }));
}`;
  const out = egoRun(script, 90000);
  const line = out.split('\n').find((l) => l.startsWith('{'));
  const r = line ? JSON.parse(line) : null;
  if (!r) throw new Error('浏览器没有返回结果');
  if (r.loggedOut) { all.loginNeeded = true; console.log('  Ego 浏览器里没登录百度站长平台'); }
  else {
    all.loginNeeded = false;
    const t = r.tables.find((t) => t.some((row) => row.some((c) => /关键词/.test(c))));
    if (t) {
      const rows = parseCsv(t.map((row) => row.join(',')).join('\n'));
      if (rows?.length) { all.days[TODAY] = { source: 'browser', keywords: rows.slice(0, 500) }; browserOk = true; console.log(`  浏览器抓到 ${rows.length} 个词`); }
    }
    if (!browserOk) { all.lastBrowserDump = r.tables.slice(0, 5); console.log('  浏览器打开了页面但没认出关键词表，原始表格存在 lastBrowserDump 里'); }
  }
} catch (e) { console.log('  浏览器抓取没成功：' + e.message.split('\n')[0].slice(0, 120)); }

all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
const latest = Object.keys(all.days).sort().at(-1);
console.log(`百度站长：${imported ? `导入 ${imported} 个文件；` : ''}${browserOk ? '浏览器抓取成功；' : ''}最新数据 ${latest ?? '没有'}${all.loginNeeded ? '；需要在 Ego 浏览器登录站长平台' : ''}`);
