// 采集：目标关键词在百度和必应的排名（eryx.cn 第一次出现的位置，查到前 50 左右）。
// 词来自 plan/seo/keywords.csv 和已发布文章主词。
// 百度用脚本直接请求（间隔几秒）；必应对脚本请求不给结果，所以走 Ego 浏览器一次查完所有词（任务空间「eryx seo rank」）。
// 用法：node scripts/seo/collect-rank.mjs [--limit=10] [--only=bing|baidu]
import { readJson, writeJson, pruneDays, TODAY, DATA, UA, sleep, loadKeywords, argValue, egoRun } from './lib.mjs';

const FILE = `${DATA}/rank.json`;
const limit = Number(argValue('limit') ?? 60);
const only = argValue('only');
const words = (await loadKeywords()).slice(0, limit);
const posOf = (urls) => { const i = urls.findIndex((u) => /eryx\.cn/.test(u)); return i < 0 ? null : i + 1; };
const all = readJson(FILE, { days: {} });
const day = (all.days[TODAY] ??= {});
for (const w of words) day[w.word] ??= { page: w.page, level: w.level };

// ── 百度 ──
async function baidu(word) {
  const res = await fetch(`https://www.baidu.com/s?wd=${encodeURIComponent(word)}&rn=50&ie=utf-8`, { headers: { 'user-agent': UA, 'accept-language': 'zh-CN,zh;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  const html = await res.text();
  if (/wappass\.baidu\.com|安全验证/.test(res.url + html.slice(0, 3000))) return 'blocked';
  const urls = [...html.matchAll(/\smu="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  if (!urls.length) return 'blocked';
  return posOf(urls) ?? `>${urls.length}`;
}
if (only !== 'bing') {
  let i = 0;
  for (const w of words) {
    i++;
    const r = day[w.word];
    if (typeof r.baidu === 'number' || (typeof r.baidu === 'string' && r.baidu.startsWith('>'))) continue; // 今天查过
    try { r.baidu = await baidu(w.word); } catch { r.baidu = 'error'; }
    console.log(`  百度 ${i}/${words.length} ${w.word}：${r.baidu}`);
    writeJson(FILE, all);
    await sleep(3000 + Math.random() * 3000);
  }
}

// ── 必应：Ego 浏览器一次查完 ──
if (only !== 'baidu') {
  const todo = words.filter((w) => { const b = day[w.word].bing; return !(typeof b === 'number' || (typeof b === 'string' && b.startsWith('>'))); }).map((w) => w.word);
  if (!todo.length) console.log('  必应：今天都查过了');
  else {
    try {
      const script = `
const words = ${JSON.stringify(todo)};
const task = await taskSpace("eryx seo rank");
const page = task.page("p1");
const out = {};
for (const w of words) {
  const urls = [];
  for (const first of [1, 11, 21, 31, 41]) {
    await page.goto("https://cn.bing.com/search?q=" + encodeURIComponent(w) + "&first=" + first + "&ensearch=0", { timeout: 30000 });
    await page.waitForTimeout(1500);
    const got = await page.evaluate(() => [...document.querySelectorAll('li.b_algo h2 a')].map(a => a.href));
    if (!got.length) break;
    urls.push(...got);
    if (urls.some(u => /eryx\\.cn/.test(u))) break;
    await page.waitForTimeout(1500 + Math.random() * 1500);
  }
  out[w] = urls;
  await page.waitForTimeout(2000);
}
console.log("RANK_JSON " + JSON.stringify(out));`;
      const out = egoRun(script, 20 * 60 * 1000);
      const line = out.split('\n').find((l) => l.startsWith('RANK_JSON '));
      if (!line) throw new Error('浏览器没有返回结果');
      const got = JSON.parse(line.slice(10));
      for (const w of todo) {
        const urls = got[w] ?? [];
        day[w].bing = !urls.length ? 'blocked' : posOf(urls) ?? `>${urls.length}`;
        console.log(`  必应 ${w}：${day[w].bing}`);
      }
    } catch (e) {
      console.log('  必应查询没成功（需要 Ego 浏览器）：' + e.message.slice(0, 120));
    }
  }
}

all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
const top = (k, n) => Object.values(day).filter((r) => typeof r[k] === 'number' && r[k] <= n).length;
const blocked = (k) => Object.values(day).filter((r) => r[k] === 'blocked' || r[k] === 'error').length;
console.log(`排名：${words.length} 个词；百度前 10 的 ${top('baidu', 10)} 个、前 50 的 ${top('baidu', 50)} 个（没查到 ${blocked('baidu')}）；必应前 10 的 ${top('bing', 10)} 个、前 50 的 ${top('bing', 50)} 个（没查到 ${blocked('bing')}）`);
