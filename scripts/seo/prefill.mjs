// 预填：把分发稿复制到剪贴板，并在 Ego 浏览器里打开该平台的发布页；能填的（V2EX、知乎文章）直接填好，停在发布按钮前，你看一眼再点。
// 用法：node scripts/seo/prefill.mjs <zhihu|xiaohongshu|v2ex|wechat> <文章 id>
import { spawnSync } from 'node:child_process';
import { readJson, DATA, egoRun } from './lib.mjs';

const [platform, id] = process.argv.slice(2);
const dist = readJson(`${DATA}/distribution.json`, { articles: {} });
const pkg = dist.articles[id]?.platforms?.[platform];
if (!pkg) { console.log('没有这篇的这个平台分发稿'); process.exit(1); }
const text = platform === 'zhihu' ? `${pkg.question}\n\n${pkg.body}` : platform === 'xiaohongshu' ? `${pkg.title}\n\n${pkg.body}\n\n${pkg.tags.map((t) => '#' + t).join(' ')}\n\n评论区：${pkg.comment}` : platform === 'v2ex' ? `${pkg.title}\n\n${pkg.body}` : `${pkg.title}\n\n${pkg.digest}\n\n${pkg.html}`;
spawnSync('pbcopy', [], { input: text });
const URLS = { zhihu: 'https://zhuanlan.zhihu.com/write', xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish', v2ex: 'https://www.v2ex.com/new/' + (pkg.node || 'share'), wechat: 'https://mp.weixin.qq.com/' };
const script = `
const task = await taskSpace("eryx seo distribute");
const page = task.page("p1");
const pkg = ${JSON.stringify(pkg)};
await page.goto(${JSON.stringify(URLS[platform])}, { timeout: 30000 });
await page.waitForTimeout(4000);
let url = await page.url();
let filled = false, note = '';
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400));
if (/安全验证|Cloudflare|cf-turnstile|请稍候/.test(bodyText)) note = '页面在做人机验证，你自己点一下通过，然后把剪贴板里的全文粘贴进去（脚本不碰验证码）';
else if (/login|signin|passport|account\\.xiaohongshu|sso/.test(url)) note = '没登录，先在 Ego 里登录这个平台，再点一次预填';
else if (note) {}
else if (${JSON.stringify(platform)} === 'v2ex') {
  try { await page.fill('input[name="title"]', pkg.title); await page.fill('textarea[name="content"]', pkg.body); filled = true; } catch (e) { note = '表单没找到：' + String(e).slice(0, 80); }
} else if (${JSON.stringify(platform)} === 'zhihu') {
  try {
    await page.click('textarea[placeholder*="标题"], .WriteIndex-titleInput textarea, textarea');
    await page.keyboard.insertText(pkg.question);
    await page.click('.Editable-content, [contenteditable="true"]');
    await page.keyboard.insertText(pkg.body);
    filled = true;
  } catch (e) { note = '编辑器没找到：' + String(e).slice(0, 80); }
}
console.log('PREFILL_JSON ' + JSON.stringify({ url, filled, note }));`;
try {
  const out = egoRun(script, 90000);
  const r = JSON.parse(out.split('\n').find((l) => l.startsWith('PREFILL_JSON ')).slice(13));
  console.log(`${platform}：已打开 ${r.url}${r.filled ? '，标题和正文已填好，看一眼再点发布' : '，文案已复制到剪贴板，粘贴即可'}${r.note ? '。' + r.note : ''}`);
} catch (e) { console.log(`${platform}：文案已复制到剪贴板；浏览器没打开（${e.message.slice(0, 100)}），自己打开 ${URLS[platform]} 粘贴`); }
