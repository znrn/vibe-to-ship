// 采集：目标关键词在百度和必应的排名（eryx.cn 第一次出现的位置，查到前 50 左右）。
// 词来自 plan/seo/keywords.csv 和已发布文章主词。
// 两家都走 Ego 浏览器（任务空间「eryx seo rank」）：脚本直接请求百度查 8 个词就被拦，必应干脆不给结果。
// 用法：node scripts/seo/collect-rank.mjs [--limit=10] [--only=bing|baidu]
import { readJson, writeJson, pruneDays, TODAY, DATA, loadKeywords, argValue, egoRun } from './lib.mjs';
import { rankSummary } from './rank-summary.mjs';

const FILE = `${DATA}/rank.json`;
const limit = Number(argValue('limit') ?? 30);
const only = argValue('only');
const all = readJson(FILE, { days: {} });
const done = (v) => typeof v === 'number' || (typeof v === 'string' && v.startsWith('>'));
const datesDesc = Object.keys(all.days).filter((d) => d !== TODAY).sort().reverse();
const lastChecked = (word) => {
  for (const d of datesDesc) {
    const r = all.days[d]?.[word];
    if (r && done(r.baidu) && done(r.bing)) return d;
  }
  return '';
};
const words = (await loadKeywords())
  .map((w, idx) => ({ w, idx, last: lastChecked(w.word) }))
  .sort((a, b) => a.last.localeCompare(b.last) || a.idx - b.idx)
  .slice(0, limit)
  .map((x) => x.w);
const day = (all.days[TODAY] ??= {});
for (const w of words) day[w.word] ??= { page: w.page, level: w.level };
const posOf = (urls) => { const i = urls.findIndex((u) => /eryx\.cn/.test(u)); return i < 0 ? null : i + 1; };

const todo = {
  baidu: only === 'bing' ? [] : words.filter((w) => !done(day[w.word].baidu)).map((w) => w.word),
  bing: only === 'baidu' ? [] : words.filter((w) => !done(day[w.word].bing)).map((w) => w.word),
};
if (!todo.baidu.length && !todo.bing.length) { console.log('排名：今天都查过了'); process.exit(0); }

const script = `
const todo = ${JSON.stringify(todo)};
const task = await taskSpace("eryx seo rank");
const page = task.page("p1");
const out = { baidu: {}, bing: {} };
const deadline = Date.now() + 20 * 60 * 1000;
let baiduFails = 0;
const rest = (a, b) => page.waitForTimeout(a + Math.random() * b);
for (const w of todo.baidu) {
  if (baiduFails >= 3 || Date.now() > deadline - 45000) { out.baidu[w] = { skipped: true }; continue; }
  try {
    await page.goto("https://www.baidu.com/s?wd=" + encodeURIComponent(w) + "&rn=50&ie=utf-8", { timeout: 30000 });
    await page.waitForTimeout(2000);
    const r = await page.evaluate(() => {
      if (/wappass|安全验证/.test(location.href + document.title)) return { blocked: true };
      // 只数自然结果：有 mu 真实网址，排除百度自己的聚合块
      return { urls: [...document.querySelectorAll('#content_left > div')].map(d => d.getAttribute('mu') || d.querySelector('h3 a')?.href || '').filter(u => /^https?:\\/\\//.test(u) && !/nourl\\.ubs\\.baidu|recommend_list\\.baidu/.test(u)) };
    });
    out.baidu[w] = r;
    baiduFails = r.urls?.length ? 0 : baiduFails + 1;
  } catch (e) { out.baidu[w] = { error: String(e).slice(0, 80) }; baiduFails++; }
  await rest(4000, 4000);
}
// 必应查太快会断连接（ERR_CONNECTION_CLOSED），所以只查前 20 名、每个词隔 8～15 秒、连续失败 3 次就停
let bingFails = 0;
for (const w of todo.bing) {
  if (bingFails >= 3 || Date.now() > deadline - 90000) { out.bing[w] = { skipped: true }; continue; }
  const urls = [];
  try {
    for (const first of [1, 11]) {
      await page.goto("https://www.bing.com/search?q=" + encodeURIComponent(w) + "&first=" + first + "&ensearch=0&mkt=zh-CN", { timeout: 30000 });
      await page.waitForTimeout(2000);
      const got = await page.evaluate(() => [...document.querySelectorAll('li.b_algo h2 a')].map(a => a.href));
      if (!got.length) break;
      urls.push(...got);
      if (urls.some(u => /eryx\\.cn/.test(u))) break;
      await rest(3000, 3000);
    }
    out.bing[w] = { urls };
    if (urls.length) bingFails = 0; else bingFails++;
  } catch (e) { out.bing[w] = { urls, error: String(e).slice(0, 80) }; bingFails++; }
  await rest(8000, 7000);
}
console.log("RANK_JSON " + JSON.stringify(out));`;

let collectionError = null;
try {
  // Below daily.mjs's 25-minute limit so failures are saved before the parent kills us.
  const out = egoRun(script, 23 * 60 * 1000);
  const line = out.split('\n').find((l) => l.startsWith('RANK_JSON '));
  if (!line) throw new Error('浏览器没有返回结果');
  const got = JSON.parse(line.slice(10));
  for (const eng of ['baidu', 'bing']) for (const w of todo[eng]) {
    const r = got[eng][w] ?? {};
    day[w][eng] = r.skipped ? undefined : r.blocked ? 'blocked' : r.error && !r.urls?.length ? 'error' : !r.urls?.length ? 'blocked' : posOf(r.urls) ?? `>${r.urls.length}`;
    console.log(`  ${eng === 'baidu' ? '百度' : '必应'} ${w}：${day[w][eng] ?? '没查（前面连续失败，明天再查）'}${r.error ? `  ${r.error}` : ''}`);
  }
} catch (e) { collectionError = e.message.slice(0, 160); console.log('  排名查询没成功（需要 Ego 浏览器）：' + collectionError); }

const incomplete = Object.entries(todo).some(([eng, ws]) => ws.some(w => !done(day[w][eng])));
(all.attempts ??= {})[TODAY] = { at: new Date().toISOString(), status: collectionError ? 'failed' : incomplete ? 'partial' : 'success', error: collectionError, scope: Object.fromEntries(Object.entries(todo).map(([eng,ws]) => [eng,ws.length])) };
if (collectionError || incomplete) process.exitCode = 1;

all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
const stats = rankSummary(all, TODAY);
console.log(`排名：本轮范围${words.length}个词；今日百度有效样本${stats.checked.baidu}、必应${stats.checked.bing}；百度前10/前50：${stats.top10.baidu ?? '未核验'}/${stats.top50.baidu ?? '未核验'}；必应：${stats.top10.bing ?? '未核验'}/${stats.top50.bing ?? '未核验'}。未查或查询深度不足不算零。`);
