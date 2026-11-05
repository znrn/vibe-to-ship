// 采集：百度统计（Tongji API，百度账号版）。拉最近 7 天里还没有的日子：概览、来源、搜索引擎、搜索词、入口页。
// 第一次要先授权：node scripts/seo/tongji-auth.mjs（见该文件说明）。
// 需要 deploy.env：BAIDU_TONGJI_API_KEY、BAIDU_TONGJI_SECRET；可选 BAIDU_TONGJI_SITE_ID
import { loadEnv, readJson, writeJson, pruneDays, daysAgo, compact, DATA, sleep } from './lib.mjs';

const env = loadEnv();
const TOKEN = `${DATA}/tongji-token.json`;
const FILE = `${DATA}/traffic.json`;
const tok = readJson(TOKEN);
if (!env.BAIDU_TONGJI_API_KEY || !env.BAIDU_TONGJI_SECRET) { console.log('没有 BAIDU_TONGJI_API_KEY / BAIDU_TONGJI_SECRET，跳过百度统计'); process.exit(0); }
if (!tok?.refresh_token) { console.log('百度统计还没授权：node scripts/seo/tongji-auth.mjs'); process.exit(0); }

// access_token 一个月有效，剩 5 天就刷新
if (!tok.expires_at || tok.expires_at - Date.now() < 5 * 864e5) {
  const r = await fetch(`https://openapi.baidu.com/oauth/2.0/token?grant_type=refresh_token&refresh_token=${tok.refresh_token}&client_id=${env.BAIDU_TONGJI_API_KEY}&client_secret=${env.BAIDU_TONGJI_SECRET}`).then((x) => x.json());
  if (!r.access_token) { console.log('刷新百度统计 token 失败：' + JSON.stringify(r).slice(0, 200)); process.exit(1); }
  Object.assign(tok, { access_token: r.access_token, refresh_token: r.refresh_token ?? tok.refresh_token, expires_at: Date.now() + (r.expires_in ?? 2592000) * 1000 });
  writeJson(TOKEN, tok);
}

async function api(path, params) {
  const url = `https://openapi.baidu.com/rest/2.0/tongji/${path}?` + new URLSearchParams({ access_token: tok.access_token, ...params });
  const j = await fetch(url, { signal: AbortSignal.timeout(30000) }).then((x) => x.json());
  if (j.error_code || j.error_msg) throw new Error(`${path}: ${j.error_msg ?? j.error_code}`);
  return j;
}

let siteId = env.BAIDU_TONGJI_SITE_ID || tok.site_id;
if (!siteId) {
  const list = await api('config/getSiteList', {});
  const site = (list.list ?? []).find((s) => /eryx\.cn/.test(s.domain));
  if (!site) { console.log('百度统计账号下没有 eryx.cn：' + JSON.stringify(list).slice(0, 200)); process.exit(1); }
  siteId = site.site_id; tok.site_id = siteId; writeJson(TOKEN, tok);
}

const getData = (method, date, metrics, extra = {}) => api('report/getData', { site_id: siteId, method, start_date: compact(date), end_date: compact(date), metrics, max_results: 50, ...extra });
// 返回 result.items：[维度列表, 指标列表]；维度是 [{name}] 或 [string]
const rows = (j, keys) => {
  const r = j.result ?? j.body?.data?.[0]?.result ?? {};
  const dims = r.items?.[0] ?? [], vals = r.items?.[1] ?? [];
  return dims.map((d, i) => {
    const name = Array.isArray(d) ? (typeof d[0] === 'object' ? d[0]?.name : d[0]) : d;
    const o = { name: String(name ?? '') };
    keys.forEach((k, ki) => { o[k] = Number(vals[i]?.[ki] ?? 0) || 0; });
    return o;
  }).filter((o) => o.name && o.name !== '--');
};

const all = readJson(FILE, { days: {} });
const wanted = Array.from({ length: 7 }, (_, i) => daysAgo(i + 1)).filter((d) => !all.days[d]).reverse();
if (!wanted.length) { console.log('百度统计：最近 7 天都已拉过'); process.exit(0); }
for (const date of wanted) {
  try {
    const ov = await getData('trend/time/a', date, 'pv_count,visitor_count,ip_count,bounce_ratio,avg_visit_time', { gran: 'day' });
    const o = (ov.result ?? ov).items?.[1]?.[0] ?? [];
    const rec = { pv: Number(o[0]) || 0, uv: Number(o[1]) || 0, ip: Number(o[2]) || 0, bounce: Number(o[3]) || 0, avgTime: Number(o[4]) || 0 };
    await sleep(500);
    rec.sources = rows(await getData('source/all/a', date, 'pv_count,visit_count,visitor_count'), ['pv', 'visits', 'visitors']);
    await sleep(500);
    rec.engines = rows(await getData('source/engine/a', date, 'pv_count,visit_count,visitor_count'), ['pv', 'visits', 'visitors']);
    await sleep(500);
    rec.searchwords = rows(await getData('source/searchword/a', date, 'pv_count,visit_count,visitor_count'), ['pv', 'visits', 'visitors']);
    await sleep(500);
    rec.landing = rows(await getData('visit/landingpage/a', date, 'pv_count,visit_count,visitor_count'), ['pv', 'visits', 'visitors']).map((x) => ({ ...x, name: x.name.replace(/^https?:\/\/eryx\.cn/, '') }));
    all.days[date] = rec;
    console.log(`百度统计 ${date}：PV ${rec.pv}，访客 ${rec.uv}，搜索引擎 ${rec.engines.map((e) => `${e.name} ${e.visits}`).join(' ') || '0'}`);
  } catch (e) { console.log(`百度统计 ${date} 失败：${e.message}`); }
  await sleep(800);
}
all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
