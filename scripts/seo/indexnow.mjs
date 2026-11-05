// IndexNow：把改过的网址一次性通知必应（Yandex 等也共享）。免费，不占百度配额。
// key 文件 public/<key>.txt 随站点部署，首次部署后才生效。
// 用法：node scripts/seo/indexnow.mjs            推自上次以来改过的页
//       node scripts/seo/indexnow.mjs /flow/idea/  指定页
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { readJson, writeJson, DATA, SITE, TODAY } from './lib.mjs';
import { pageHashes, changedUrls } from './page-hash.mjs';

const keyFile = readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) { console.log('IndexNow：public/ 里没有 key 文件，跳过'); process.exit(0); }
const key = keyFile.replace('.txt', '');
const STATE = `${DATA}/indexnow.json`;
const state = readJson(STATE, { last: '' });
let urls = process.argv.slice(2).map((u) => (u.startsWith('http') ? u : SITE + u));
if (!urls.length) {
  if (!existsSync('dist/sitemap-0.xml')) { console.log('没有 dist/，先 npm run build'); process.exit(1); }
  urls = state.last ? changedUrls(state.last, pageHashes()) : Object.keys(pageHashes());
}
if (!urls.length) { console.log('IndexNow：上次之后没有页面改动，不提交'); process.exit(0); }
// key 文件要已经在线，否则必应会拒
const live = await fetch(`${SITE}/${keyFile}`, { signal: AbortSignal.timeout(15000) }).then((r) => r.ok).catch(() => false);
if (!live) { console.log(`IndexNow：${SITE}/${keyFile} 还没上线（下次部署后生效），这次不提交`); process.exit(0); }
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'eryx.cn', key, keyLocation: `${SITE}/${keyFile}`, urlList: urls.slice(0, 10000) }),
  signal: AbortSignal.timeout(30000),
});
if (res.status === 200 || res.status === 202) { state.last = TODAY; state.lastCount = urls.length; writeJson(STATE, state); console.log(`IndexNow：提交 ${urls.length} 个网址，返回 ${res.status}`); }
else { console.log(`IndexNow 失败：${res.status} ${(await res.text()).slice(0, 200)}`); process.exit(1); }
