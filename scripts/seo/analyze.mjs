// 分析：把采集到的数据变成「要做的事」，写 plan/seo/data/findings.json。
//   机会词：有展现没点击、排名 11～30 的词 → 已有文章就「待优化」，没有就「待写」
//   弱内链：站内链接少于 2 条的可收录页，给出该链过来的页
//   衰退页：近 7 天比前 7 天访问少 30% 以上
//   抓取异常：蜘蛛抓到的 404、7 天没被百度抓过的重要页
//   排名变化：和上一次相比进出前 10、变化 3 位以上
//   来源失效：文章参考来源打不开
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, writeJson, TODAY, YESTERDAY, daysAgo, DATA, loadKeywords, sitemapUrls } from './lib.mjs';

const crawl = readJson(`${DATA}/crawl.json`, { days: {} });
const traffic = readJson(`${DATA}/traffic.json`, { days: {} });
const bing = readJson(`${DATA}/bing.json`, { days: {} });
const rank = readJson(`${DATA}/rank.json`, { days: {} });
const console_ = readJson(`${DATA}/baidu-console.json`, { days: {} });
const sources = readJson(`${DATA}/sources.json`, { dead: [], blocked: [] });
const keywords = await loadKeywords();
let nodes = [];
try { nodes = (await import('../lib/topic-map.mjs')).loadTopicMap().merged; } catch {}
const published = nodes.filter((n) => n.status === 'published');
const findings = { date: TODAY, opportunities: [], lowCtrPages: [], weakLinks: [], decline: [], crawl: { notFound: [], notCrawled: [] }, rankChanges: [], deadSources: sources.dead ?? [], notes: [] };

// ── 机会词 ──
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, '');
function matchContent(word) {
  const w = norm(word);
  const k = keywords.find((x) => norm(x.word) === w || w.includes(norm(x.word)) || norm(x.word).includes(w));
  if (k) return { page: k.page, via: k.word };
  const n = published.find((x) => [x.keyword, ...(x.covers ?? [])].some((c) => c && (w.includes(norm(c)) || norm(c).includes(w))));
  return n ? { page: `/articles/${n.id}/`, via: n.keyword } : null;
}
const seen = new Set();
const addOpp = (word, extra) => {
  const key = norm(word);
  if (seen.has(key)) return;
  seen.add(key);
  const m = matchContent(word);
  findings.opportunities.push({ word, ...extra, action: m ? '待优化' : '待写', page: m?.page ?? '', via: m?.via ?? '' });
};
const latestConsole = Object.keys(console_.days ?? {}).filter((d) => console_.days[d].keywords).sort().at(-1);
const cday = console_.days?.[latestConsole] ?? {};
// 近 7 天汇总的词更稳：展现 ≥ 3 没点击，或排 11～30
for (const k of cday.keywordsWeek ?? cday.keywords ?? []) {
  if (k.impressions >= 3 && k.clicks === 0) addOpp(k.word, { source: '百度站长（7 天）', impressions: k.impressions, clicks: 0, rank: k.rank });
  else if (k.rank && k.rank > 10 && k.rank <= 30) addOpp(k.word, { source: '百度站长（7 天）', impressions: k.impressions, clicks: k.clicks, rank: k.rank });
}
// 页面级：展现不少但没人点，说明标题和描述不够吸引
findings.lowCtrPages = (cday.pages ?? []).filter((p) => p.impressions >= 10 && p.clicks === 0).map((p) => ({ page: p.page, impressions: p.impressions, basis: '百度站长（昨天）' }));
for (const q of bing.latest?.queries ?? []) {
  if (q.impressions >= 5 && q.clicks === 0) addOpp(q.word, { source: 'Bing', impressions: q.impressions, clicks: 0, rank: q.rank });
}
const rankDays = Object.keys(rank.days).sort();
const todayRank = rank.days[rankDays.at(-1)] ?? {};
for (const [word, r] of Object.entries(todayRank)) {
  for (const eng of ['baidu', 'bing']) if (typeof r[eng] === 'number' && r[eng] > 10 && r[eng] <= 30) addOpp(word, { source: eng === 'baidu' ? '百度排名' : '必应排名', rank: r[eng] });
}
findings.opportunities.sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0));

// ── 弱内链：扫 dist ──
function walk(dir, out = []) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (f.endsWith('.html')) out.push(p); } return out; }
if (existsSync('dist/index.html')) {
  const pages = new Map();
  for (const f of walk('dist')) {
    const html = readFileSync(f, 'utf8');
    if (!/<head[\s>]/i.test(html) || /<meta http-equiv="refresh"/.test(html.slice(0, 400))) continue;
    pages.set('/' + f.slice(5).replace(/index\.html$/, '').replace(/\.html$/, '/'), html);
  }
  const inbound = new Map([...pages.keys()].map((u) => [u, new Set()]));
  for (const [url, html] of pages) {
    for (const m of html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)) {
      const t = m[1].endsWith('/') ? m[1] : m[1] + '/';
      if (t !== url && inbound.has(t)) inbound.get(t).add(url);
    }
  }
  const stageOf = (url) => { const id = url.match(/^\/articles\/([^/]+)\/$/)?.[1]; return id ? published.find((n) => n.id === id)?.stage : url.match(/^\/flow\/([a-z]+)\/$/)?.[1]; };
  for (const [url, from] of inbound) {
    if (from.size >= 2 || ['/', '/404/', '/camp/'].includes(url) || /noindex/.test(pages.get(url).slice(0, 2000))) continue;
    const stage = stageOf(url);
    const suggest = [];
    if (stage && url !== `/flow/${stage}/` && !from.has(`/flow/${stage}/`)) suggest.push(`/flow/${stage}/`);
    for (const n of published) { const u = `/articles/${n.id}/`; if (n.stage === stage && u !== url && !from.has(u) && suggest.length < 3) suggest.push(u); }
    findings.weakLinks.push({ page: url, inbound: from.size, from: [...from], suggest });
  }
} else findings.notes.push('没有 dist/，弱内链没算');

// ── 衰退页：优先百度统计的入口页，没有就用服务器日志的访客页面 ──
const sum = (dates, pick) => { const t = {}; for (const d of dates) for (const [p, v] of Object.entries(pick(d) ?? {})) t[p] = (t[p] ?? 0) + v; return t; };
const last7 = Array.from({ length: 7 }, (_, i) => daysAgo(i + 1)), prev7 = Array.from({ length: 7 }, (_, i) => daysAgo(i + 8));
const haveTraffic = last7.some((d) => traffic.days[d]);
const pick = haveTraffic ? (d) => Object.fromEntries((traffic.days[d]?.landing ?? []).map((x) => [x.name, x.visits])) : (d) => crawl.days[d]?.human?.pages;
const now = sum(last7, pick), before = sum(prev7, pick);
for (const [p, b] of Object.entries(before)) { const n = now[p] ?? 0; if (b >= 20 && n < b * 0.7) findings.decline.push({ page: p, before: b, now: n, basis: haveTraffic ? '百度统计' : '服务器日志' }); }
findings.decline.sort((a, b) => b.before - a.before);

// ── 抓取异常 ──
const y = crawl.days[YESTERDAY];
if (y) for (const [sp, s] of Object.entries(y.spiders)) for (const [path, hits] of Object.entries(s.notFound)) findings.crawl.notFound.push({ spider: sp, path, hits });
findings.crawl.notFound.sort((a, b) => b.hits - a.hits);
const important = ['/', '/ai-indie-dev/', '/flow/', ...sitemapUrls().filter((u) => /^\/flow\/[a-z]+\/$/.test(u))];
const crawled7 = new Set(last7.flatMap((d) => Object.keys(crawl.days[d]?.spiders?.Baiduspider?.pages ?? {})));
const haveCrawl = last7.some((d) => crawl.days[d]);
if (haveCrawl) findings.crawl.notCrawled = important.filter((u) => !crawled7.has(u));

// ── 排名变化 ──
const prevDay = rankDays.filter((d) => d < rankDays.at(-1)).at(-1);
if (prevDay) for (const [word, r] of Object.entries(todayRank)) for (const eng of ['baidu', 'bing']) {
  const a = rank.days[prevDay][word]?.[eng], b = r[eng];
  const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' && v.startsWith('>') ? 99 : null);
  if (num(a) == null || num(b) == null) continue;
  if ((num(a) > 10) !== (num(b) > 10) || Math.abs(num(a) - num(b)) >= 3) findings.rankChanges.push({ word, engine: eng === 'baidu' ? '百度' : '必应', from: a, to: b });
}

// ── 页面状态表：每页「推过没、最近被百度抓是哪天、有没有展现」，分清「提交了」和「收录了」──
const pushedLog = readJson('plan/seo/baidu-pushed.json', {});
const lastCrawl = {};
for (const d of Object.keys(crawl.days).sort()) for (const p of Object.keys(crawl.days[d]?.spiders?.Baiduspider?.pages ?? {})) lastCrawl[p] = d;
const impByPage = {};
for (const p of bing.latest?.pages ?? []) impByPage[p.page] = (impByPage[p.page] ?? 0) + (p.impressions ?? 0);
const landing7 = {};
for (const d of last7) for (const x of traffic.days[d]?.landing ?? []) landing7[x.name] = (landing7[x.name] ?? 0) + x.visits;
const baiduImp = Object.fromEntries((cday.pages ?? []).map((p) => [p.page, p.impressions]));
findings.pages = sitemapUrls().map((u) => ({ url: u, baiduImp: baiduImp[u] ?? null, pushed: pushedLog[`https://eryx.cn${u === '/' ? '/' : u}`] ?? pushedLog[`https://eryx.cn${u}`] ?? '', crawled: lastCrawl[u] ?? '', bingImp: impByPage[u] ?? null, visits7: landing7[u] ?? null }));
findings.pageStats = { total: findings.pages.length, pushed: findings.pages.filter((p) => p.pushed).length, crawled7: findings.pages.filter((p) => p.crawled && p.crawled >= daysAgo(7)).length, neverCrawled: findings.pages.filter((p) => !p.crawled).length };

if (console_.loginNeeded) findings.notes.push('Ego 浏览器里没登录百度站长平台，流量与关键词拿不到；也可以导出 CSV 放进 plan/seo/inbox/');
writeJson(`${DATA}/findings.json`, findings);
console.log(`页面：${findings.pageStats.total} 个，推过 ${findings.pageStats.pushed}，7 天内被百度抓过 ${findings.pageStats.crawled7}，有记录以来从没被抓 ${findings.pageStats.neverCrawled}`);
console.log(`分析：机会词 ${findings.opportunities.length}（待写 ${findings.opportunities.filter((o) => o.action === '待写').length}），弱内链 ${findings.weakLinks.length}，衰退页 ${findings.decline.length}，蜘蛛 404 ${findings.crawl.notFound.length}，7 天没被百度抓的重要页 ${findings.crawl.notCrawled.length}，排名变化 ${findings.rankChanges.length}，来源失效 ${findings.deadSources.length}`);
