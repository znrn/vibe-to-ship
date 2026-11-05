// 采集：百度搜索资源平台的「流量与关键词」「热门页面」「索引量」。百度没有公开接口，用 Ego 浏览器的登录态
// 直接读后台页面自己用的 JSON 接口（任务空间「eryx seo baidu console」，需要你在 Ego 里登录过一次站长平台）。
// 备用：在站长平台导出 CSV 放进 plan/seo/inbox/，脚本按表头识别。
// 结果写 plan/seo/data/baidu-console.json：days[日期] = { keywords, pages, index, stat }
import { readdirSync, readFileSync, renameSync, mkdirSync, statSync } from 'node:fs';
import { readJson, writeJson, pruneDays, TODAY, YESTERDAY, DATA, INBOX, ymd, egoRun } from './lib.mjs';

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
  all.days[date] = { ...(all.days[date] ?? {}), source: 'csv', file: f, keywords: rows.slice(0, 500) };
  mkdirSync(`${INBOX}/done`, { recursive: true });
  renameSync(p, `${INBOX}/done/${date}-${f}`);
  imported++;
  console.log(`  导入 inbox/${f} → ${date}，${rows.length} 个词`);
}

// ── 2. Ego 浏览器：后台自己的 JSON 接口 ──
let browserOk = false;
try {
  const script = `
const task = await taskSpace("eryx seo baidu console");
const page = task.page("p1");
const site = encodeURIComponent("https://eryx.cn/");
await page.goto("https://ziyuan.baidu.com/keywords/index", { timeout: 30000 });
await page.waitForTimeout(4000);
const text = await page.evaluate(() => document.body.innerText);
if (/因您未登录/.test(text)) { console.log("CONSOLE_JSON " + JSON.stringify({ loggedOut: true })); }
else {
  const get = (u) => page.evaluate(async (u) => { try { const r = await fetch(u, { credentials: "include" }); const t = await r.text(); return t.trim().startsWith("{") ? JSON.parse(t) : { html: true }; } catch (e) { return { error: String(e) }; } }, u);
  const out = { loggedOut: false };
  out.keywords = await get("https://ziyuan.baidu.com/keywords/keywordlist?site=" + site + "&range=yesterday&page=1&pagesize=200");
  out.keywordsWeek = await get("https://ziyuan.baidu.com/keywords/keywordlist?site=" + site + "&range=week&page=1&pagesize=200");
  out.pages = await get("https://ziyuan.baidu.com/keywords/pagelist?site=" + site + "&range=yesterday&page=1&pagesize=200");
  out.stat = await get("https://ziyuan.baidu.com/keywords/keywordstat?site=" + site + "&range=month&level=day");
  out.index = await get("https://ziyuan.baidu.com/indexs/list?site=" + encodeURIComponent("https://eryx.cn") + "&id=0&range=month&page=1&pagesize=31&t=&isNew=1");
  console.log("CONSOLE_JSON " + JSON.stringify(out));
}`;
  const out = egoRun(script, 120000);
  const line = out.split('\n').find((l) => l.startsWith('CONSOLE_JSON '));
  if (!line) throw new Error('浏览器没有返回结果：' + out.trim().split('\n').pop()?.slice(0, 100));
  const r = JSON.parse(line.slice(13));
  if (r.loggedOut) { all.loginNeeded = true; console.log('  Ego 浏览器里没登录百度站长平台'); }
  else {
    all.loginNeeded = false;
    const kw = (list) => (list ?? []).map((k) => ({ word: k.query, impressions: Number(k.total_display) || 0, clicks: Number(k.total_click) || 0, ctr: k.click_rate ?? '', rank: Number(k.average_rank ?? k.total_rank) || null }));
    const day = (all.days[YESTERDAY] ??= {});
    day.source = 'browser';
    if (r.keywords?.list) { day.keywords = kw(r.keywords.list); browserOk = true; }
    if (r.keywordsWeek?.list) day.keywordsWeek = kw(r.keywordsWeek.list);
    if (r.pages?.list) day.pages = r.pages.list.map((p) => ({ page: String(p.url ?? p.query ?? '').replace(/^https?:\/\/eryx\.cn/, ''), impressions: Number(p.total_display) || 0, clicks: Number(p.total_click) || 0 }));
    // 展现 / 点击的每日曲线和索引量，按日期摊进各天
    const toYmd = (t) => new Date(Number(t) * 1000).toISOString().slice(0, 10);
    for (const s of r.stat?.list ?? r.stat?.data ?? []) { const d = s.date ? String(s.date).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : s.ctime ? toYmd(s.ctime) : null; if (d) (all.days[d] ??= {}).stat = { impressions: Number(s.display ?? s.total_display) || 0, clicks: Number(s.click ?? s.total_click) || 0 }; }
    for (const i of r.index?.list ?? []) { const d = toYmd(i.ctime); (all.days[d] ??= {}).index = Number(i.total) || 0; }
    if (!browserOk) all.lastBrowserDump = { keywords: r.keywords, pages: r.pages, stat: r.stat };
    console.log(`  浏览器：关键词 ${day.keywords?.length ?? 0} 个（近 7 天 ${day.keywordsWeek?.length ?? 0} 个），热门页面 ${day.pages?.length ?? 0} 个，索引量记录 ${r.index?.list?.length ?? 0} 天`);
  }
} catch (e) { console.log('  浏览器抓取没成功：' + e.message.split('\n')[0].slice(0, 160)); }

all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
const latest = Object.keys(all.days).filter((d) => all.days[d].keywords).sort().at(-1);
const idx = Object.keys(all.days).filter((d) => all.days[d].index != null).sort().at(-1);
console.log(`百度站长：${imported ? `导入 ${imported} 个文件；` : ''}关键词最新 ${latest ?? '没有'}${idx ? `；索引量 ${all.days[idx].index}（${idx}）` : ''}${all.loginNeeded ? '；需要在 Ego 浏览器登录站长平台' : ''}`);
