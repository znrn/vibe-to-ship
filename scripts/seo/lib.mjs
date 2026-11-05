// 自动 SEO 流水线的公共函数：环境变量、日期、JSON 读写、通知、关键词清单。
// 数据都放 plan/seo/data/（不入库），日报放 plan/seo/daily/。
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

export const SITE = 'https://eryx.cn';
export const DATA = 'plan/seo/data';
export const DAILY = 'plan/seo/daily';
export const INBOX = 'plan/seo/inbox';
export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
for (const d of [DATA, DAILY, INBOX]) mkdirSync(d, { recursive: true });

// scripts/deploy.env 里的键值（值里可以带 =），process.env 优先
export function loadEnv() {
  const env = {};
  if (existsSync('scripts/deploy.env')) {
    for (const line of readFileSync('scripts/deploy.env', 'utf8').split('\n')) {
      const l = line.trim();
      if (!l || l.startsWith('#') || !l.includes('=')) continue;
      const i = l.indexOf('=');
      env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
  }
  return { ...env, ...process.env };
}

export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const daysAgo = (n, from = new Date()) => ymd(new Date(from.getTime() - n * 864e5));
export const compact = (s) => s.replace(/-/g, ''); // 2026-11-05 → 20261105
export const TODAY = ymd();
export const YESTERDAY = daysAgo(1);
export const WEEKDAY = new Date().getDay();
export const hasFlag = (f) => process.argv.includes(f);
export const argValue = (name) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : undefined; };

export function readJson(file, fallback = null) {
  try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback; } catch { return fallback; }
}
export function writeJson(file, obj) { writeFileSync(file, JSON.stringify(obj, null, 2) + '\n'); }

// 按日期存的记录只留最近 n 天
export function pruneDays(days, n = 90) {
  const keys = Object.keys(days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - n))) delete days[k];
  return days;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// macOS 通知；失败就算了
export function notify(title, message) {
  try { execFileSync('osascript', ['-e', `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`], { stdio: 'ignore' }); } catch {}
}

// 目标关键词：keywords.csv 的词 + 已发布文章的主词
export async function loadKeywords() {
  const out = [];
  if (existsSync('plan/seo/keywords.csv')) {
    const rows = readFileSync('plan/seo/keywords.csv', 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
    for (const r of rows) if (r[0]) out.push({ word: r[0].trim(), level: r[1]?.trim() ?? '', page: r[2]?.trim() ?? '' });
  }
  try {
    const { loadTopicMap } = await import('../lib/topic-map.mjs');
    for (const n of loadTopicMap().merged) {
      if (n.status === 'published' && n.keyword && !out.some((o) => o.word === n.keyword)) out.push({ word: n.keyword, level: '文章主词', page: `/articles/${n.id}/` });
    }
  } catch (e) { console.log('  （读不到选题地图：' + e.message + '）'); }
  return out;
}

// 站点的页面清单，来自构建产物的站点地图；没构建就空
export function sitemapUrls() {
  const f = 'dist/sitemap-0.xml';
  if (!existsSync(f)) return [];
  return [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/');
}

export const fmt = (n) => (n == null || Number.isNaN(n) ? '-' : Number(n).toLocaleString('zh-CN'));

// 跑一段 Ego 浏览器脚本（ego-browser nodejs），它把 console.log 打到 stderr，所以两路都收
export function egoRun(script, timeout = 120000) {
  const r = spawnSync('ego-browser', ['nodejs'], { input: script, encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  const out = (r.stdout || '') + (r.stderr || '');
  if (r.status !== 0) throw new Error(out.trim().split('\n').pop()?.slice(0, 160) || `退出码 ${r.status}`);
  return out;
}
