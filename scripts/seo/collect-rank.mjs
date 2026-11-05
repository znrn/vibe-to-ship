// 采集：目标关键词在百度和必应的排名（eryx.cn 第一次出现的位置，查到前 50 左右）。
// 词来自 plan/seo/keywords.csv 和已发布文章主词。
// 两家都走 Ego 浏览器（任务空间「eryx seo rank」）：脚本直接请求百度查 8 个词就被拦，必应干脆不给结果。
// 用法：node scripts/seo/collect-rank.mjs [--limit=10] [--only=bing|baidu]
import { readJson, writeJson, pruneDays, TODAY, DATA, loadKeywords, argValue, egoRun } from './lib.mjs';

const FILE = `${DATA}/rank.json`;
const limit = Number(argValue('limit') ?? 60);
const only = argValue('only');
const words = (await loadKeywords()).slice(0, limit);
const all = readJson(FILE, { days: {} });
const day = (all.days[TODAY] ??= {});
for (const w of words) day[w.word] ??= { page: w.page, level: w.level };
const done = (v) => typeof v === 'number' || (typeof v === 'string' && v.startsWith('>'));
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
const rest = (a, b) => page.waitForTimeout(a + Math.random() * b);
for (const w of todo.baidu) {
  try {
    await page.goto("https://www.baidu.com/s?wd=" + encodeURIComponent(w) + "&rn=50&ie=utf-8", { timeout: 30000 });
    await page.waitForTimeout(2000);
    const r = await page.evaluate(() => {
      if (/wappass|安全验证/.test(location.href + document.title)) return { blocked: true };
      // 只数自然结果：有 mu 真实网址，排除百度自己的聚合块
      return { urls: [...document.querySelectorAll('#content_left > div')].map(d => d.getAttribute('mu') || d.querySelector('h3 a')?.href || '').filter(u => /^https?:\\/\\//.test(u) && !/nourl\\.ubs\\.baidu|recommend_list\\.baidu/.test(u)) };
    });
    out.baidu[w] = r;
  } catch (e) { out.baidu[w] = { error: String(e).slice(0, 80) }; }
  await rest(4000, 4000);
}
// 必应查太快会断连接（ERR_CONNECTION_CLOSED），所以只查前 20 名、每个词隔 8～15 秒、连续失败 3 次就停
let bingFails = 0;
for (const w of todo.bing) {
  if (bingFails >= 3) { out.bing[w] = { skipped: true }; continue; }
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

try {
  const out = egoRun(script, 30 * 60 * 1000);
  const line = out.split('\n').find((l) => l.startsWith('RANK_JSON '));
  if (!line) throw new Error('浏览器没有返回结果');
  const got = JSON.parse(line.slice(10));
  for (const eng of ['baidu', 'bing']) for (const w of todo[eng]) {
    const r = got[eng][w] ?? {};
    day[w][eng] = r.skipped ? undefined : r.blocked ? 'blocked' : r.error && !r.urls?.length ? 'error' : !r.urls?.length ? 'blocked' : posOf(r.urls) ?? `>${r.urls.length}`;
    console.log(`  ${eng === 'baidu' ? '百度' : '必应'} ${w}：${day[w][eng] ?? '没查（前面连续失败，明天再查）'}${r.error ? `  ${r.error}` : ''}`);
  }
} catch (e) { console.log('  排名查询没成功（需要 Ego 浏览器）：' + e.message.slice(0, 160)); }

all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
const top = (k, n) => Object.values(day).filter((r) => typeof r[k] === 'number' && r[k] <= n).length;
const bad = (k) => Object.values(day).filter((r) => r[k] === 'blocked' || r[k] === 'error' || r[k] === undefined).length;
console.log(`排名：${words.length} 个词；百度前 10 的 ${top('baidu', 10)} 个、前 50 的 ${top('baidu', 50)} 个（没查到 ${bad('baidu')}）；必应前 10 的 ${top('bing', 10)} 个、前 50 的 ${top('bing', 50)} 个（没查到 ${bad('bing')}）`);
