// 外链（每月）：1）谁提到了本站（必应搜「eryx.cn」和站名），有没有带链接；2）候选站点（plan/seo/outreach-seeds.txt）；
// 3）给每个候选写一条私信 / 邮件草稿（Claude），你决定发不发。结果写 plan/seo/data/outreach.json，分发页里显示。
// 用法：node scripts/seo/outreach.mjs [--force]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readJson, writeJson, TODAY, DATA, UA, egoRun, hasFlag } from './lib.mjs';

const FILE = `${DATA}/outreach.json`;
const SEEDS = 'plan/seo/outreach-seeds.txt';
const prev = readJson(FILE, {});
if (!hasFlag('--force') && prev.date && Date.now() - new Date(prev.date).getTime() < 25 * 864e5) { console.log('外链：本月查过，跳过'); process.exit(0); }
if (!existsSync(SEEDS)) writeFileSync(SEEDS, `# 外链候选：一行一个，用 | 分隔：站点或账号 | 为什么合适 | 联系方式（可空）
# 例：独立开发者社区 xxx | 读者重合，接受投稿 | 邮箱 or 站内私信
`);
const seeds = readFileSync(SEEDS, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => { const [site, why, contact] = l.split('|').map((s) => s.trim()); return { site, why, contact: contact ?? '' }; });

// ── 品牌提及：必应（Ego 浏览器） ──
let mentions = [];
try {
  const script = `
const task = await taskSpace("eryx seo rank");
const page = task.page("p1");
const out = [];
for (const q of ['"eryx.cn" -site:eryx.cn', '"冬瓜 AI 独立开发"', '"vibe-to-ship" 冬瓜']) {
  for (const first of [1, 11]) {
    await page.goto("https://www.bing.com/search?q=" + encodeURIComponent(q) + "&first=" + first + "&mkt=zh-CN", { timeout: 30000 });
    await page.waitForTimeout(2500);
    const got = await page.evaluate(() => [...document.querySelectorAll('li.b_algo')].map(li => ({ url: li.querySelector('h2 a')?.href, title: li.querySelector('h2 a')?.textContent?.trim() })));
    if (!got.length) break;
    out.push(...got);
    await page.waitForTimeout(4000 + Math.random() * 3000);
  }
}
console.log("MENTIONS_JSON " + JSON.stringify(out));`;
  const out = egoRun(script, 10 * 60 * 1000);
  const got = JSON.parse(out.split('\n').find((l) => l.startsWith('MENTIONS_JSON ')).slice(14));
  const seen = new Set();
  for (const m of got) {
    if (!m.url || seen.has(m.url) || /eryx\.cn|bing\.com|baidu\.com|github\.com\/znrn/.test(m.url)) continue;
    seen.add(m.url);
    // 必应对新站名匹配很松，必须打开页面确认正文真的提到了本站
    let linked = null, mentioned = false;
    try {
      const html = await fetch(m.url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) }).then((r) => r.text());
      mentioned = /eryx\.cn|冬瓜\s*AI\s*独立开发|vibe-to-ship/i.test(html);
      linked = /href="https?:\/\/(www\.)?eryx\.cn/.test(html);
    } catch { mentioned = null; }
    if (mentioned === false) continue;
    mentions.push({ url: m.url, title: m.title, linked, unverified: mentioned === null });
  }
} catch (e) { console.log('  品牌提及扫描没成功：' + e.message.slice(0, 120)); mentions = prev.mentions ?? []; }

// ── 候选 + 私信草稿 ──
const candidates = [...seeds.map((s) => ({ ...s, kind: 'seed' })), ...mentions.filter((m) => m.linked === false && !m.unverified).map((m) => ({ site: m.url, why: '提到了本站但没带链接', contact: '', kind: 'mention' }))].slice(0, 10);
for (const c of candidates) {
  const old = (prev.candidates ?? []).find((x) => x.site === c.site);
  if (old?.draft) { c.draft = old.draft; continue; }
  const r = spawnSync('claude', ['-p', '--output-format', 'text', '--allowedTools', ''], { input: `给「${c.site}」写一条 120 字以内的私信（${c.why}）。我是冬瓜，做 eryx.cn（写给非程序员的 AI 独立开发手册，开源、可转载注明出处）。目的：${c.kind === 'mention' ? '感谢提到本站，请他们把站名改成可点的链接 https://eryx.cn' : '互相推荐或投稿一篇实操文章'}。语气平实，不吹，不求人，一个具体请求。只输出私信正文。`, encoding: 'utf8', timeout: 120000 });
  c.draft = (r.stdout || '').trim().slice(0, 400);
}
writeJson(FILE, { date: TODAY, mentions, candidates });
console.log(`外链：提到本站的页面 ${mentions.length} 个（带链接 ${mentions.filter((m) => m.linked).length}，没带 ${mentions.filter((m) => m.linked === false).length}）；候选 ${candidates.length} 个，私信草稿已写好，在分发页里看`);
