// 采集：Bing Webmaster Tools API（抓取统计、查询词、页面、外链数、抓取问题）。
// 需要 deploy.env 的 BING_API_KEY（Bing Webmaster Tools → 设置 → API 访问 → 生成 API Key）
import { loadEnv, readJson, writeJson, pruneDays, YESTERDAY, DATA, SITE } from './lib.mjs';

const env = loadEnv();
const FILE = `${DATA}/bing.json`;
if (!env.BING_API_KEY) { console.log('没有 BING_API_KEY，跳过 Bing'); process.exit(0); }

async function call(method, extra = {}) {
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?` + new URLSearchParams({ siteUrl: SITE + '/', apikey: env.BING_API_KEY, ...extra });
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${res.status} ${JSON.stringify(j).slice(0, 160)}`);
  return j.d ?? j;
}
const msDate = (s) => { const m = String(s).match(/\d{10,}/); return m ? new Date(Number(m[0])).toISOString().slice(0, 10) : s; };

const all = readJson(FILE, { days: {} });
const rec = { date: YESTERDAY };
const tasks = {
  crawl: () => call('GetCrawlStats').then((d) => (d ?? []).slice(-7).map((x) => ({ date: msDate(x.Date), crawled: x.CrawledPages, indexed: x.InIndex, errors: x.CrawlErrors ?? (x.HttpStatus4xx ?? 0) + (x.HttpStatus5xx ?? 0), blocked: x.BlockedByRobots }))),
  queries: () => call('GetQueryStats').then((d) => (d ?? []).map((x) => ({ word: x.Query, impressions: x.Impressions, clicks: x.Clicks, rank: x.AvgImpressionPosition, clickRank: x.AvgClickPosition })).sort((a, b) => b.impressions - a.impressions).slice(0, 100)),
  pages: () => call('GetPageStats').then((d) => (d ?? []).map((x) => ({ page: String(x.Query ?? x.Url ?? '').replace(SITE, ''), impressions: x.Impressions, clicks: x.Clicks, rank: x.AvgImpressionPosition })).sort((a, b) => b.impressions - a.impressions).slice(0, 60)),
  links: () => call('GetLinkCounts').then((d) => (d ?? { })),
  rankTraffic: () => call('GetRankAndTrafficStats').then((d) => (d ?? []).slice(-14).map((x) => ({ date: msDate(x.Date), impressions: x.Impressions, clicks: x.Clicks }))),
  issues: () => call('GetCrawlIssues').then((d) => (d ?? []).slice(0, 50).map((x) => ({ url: String(x.Url ?? '').replace(SITE, ''), issue: x.Issues ?? x.Issue, http: x.HttpCode }))),
};
const errors = [];
for (const [k, fn] of Object.entries(tasks)) {
  try { rec[k] = await fn(); } catch (e) { errors.push(e.message); rec[k] = null; }
}
all.latest = rec;
const last = rec.crawl?.at(-1);
all.days[YESTERDAY] = { indexed: last?.indexed ?? null, crawled: last?.crawled ?? null, inbound: rec.links?.TotalInboundLinks ?? rec.links?.Total ?? null, impressions: rec.rankTraffic?.at(-1)?.impressions ?? null, clicks: rec.rankTraffic?.at(-1)?.clicks ?? null };
all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
console.log(`Bing：索引 ${last?.indexed ?? '-'} 页，昨天抓取 ${last?.crawled ?? '-'}，查询词 ${rec.queries?.length ?? 0} 个，外链 ${all.days[YESTERDAY].inbound ?? '-'}${errors.length ? `；失败：${errors.join('；')}` : ''}`);
