// 线上巡检：站点地图里的每个网址在线上真的能打开吗？状态码、canonical、title 是否和本地构建一致，robots / sitemap 是否正常。
// 部署后验收也用它（deploy.sh 最后一步）。结果写 plan/seo/data/live.json
import { existsSync, readFileSync } from 'node:fs';
import { readJson, writeJson, TODAY, DATA, SITE, UA, sitemapUrls, sleep } from './lib.mjs';

const FILE = `${DATA}/live.json`;
const urls = sitemapUrls();
if (!urls.length) { console.log('线上巡检：没有 dist/ 站点地图，先 npm run build'); process.exit(0); }
const localMeta = (u) => {
  const f = `dist${u}${u.endsWith('/') ? 'index.html' : ''}`;
  if (!existsSync(f)) return {};
  const h = readFileSync(f, 'utf8');
  return { title: (h.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '', canonical: (h.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1] ?? '' };
};
async function probe(path) {
  try {
    const res = await fetch(SITE + path, { headers: { 'user-agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const html = res.status === 200 ? await res.text() : '';
    const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '';
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1] ?? '';
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
    return { status: res.status, title, canonical, noindex, bytes: html.length };
  } catch (e) { return { status: 0, error: e.name === 'TimeoutError' ? '超时' : e.message }; }
}
const problems = [];
const pages = {};
for (const u of urls) {
  const live = await probe(u);
  const local = localMeta(u);
  pages[u] = live;
  if (live.status !== 200) problems.push({ url: u, issue: `状态 ${live.status || live.error}` });
  else {
    if (live.canonical && live.canonical !== SITE + u) problems.push({ url: u, issue: `canonical 指向 ${live.canonical}` });
    if (live.noindex) problems.push({ url: u, issue: '线上是 noindex 却在站点地图里' });
    if (local.title && live.title !== local.title) problems.push({ url: u, issue: `线上 title 和本地构建不一致（线上：${live.title.slice(0, 30)}…）` });
  }
  await sleep(200);
}
for (const p of ['/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml', '/llms.txt']) {
  const r = await probe(p);
  pages[p] = r;
  if (r.status !== 200) problems.push({ url: p, issue: `状态 ${r.status || r.error}` });
}
writeJson(FILE, { date: TODAY, checked: urls.length, problems, pages });
console.log(`线上巡检：${urls.length} 页 + 4 个基础文件，${problems.length ? `有 ${problems.length} 个问题：${problems.slice(0, 5).map((p) => `${p.url} ${p.issue}`).join('；')}` : '全部正常'}`);
process.exit(problems.some((p) => /状态/.test(p.issue)) ? 1 : 0);
