// 把站点地图里的网址推送给百度「普通收录 · API 提交」。
// 用法：npm run seo:push            推送 dist/sitemap-0.xml 里的全部网址（百度每天有配额，一般几千条，够用）
//       npm run seo:push -- /flow/idea/ /articles/xxx/   只推这几个
// token 放在 scripts/deploy.env 的 BAIDU_PUSH_TOKEN=（在百度搜索资源平台 → 普通收录 → API 提交 里看）
import { existsSync, readFileSync } from 'node:fs';

const SITE = 'https://eryx.cn';
const env = Object.fromEntries(
  (existsSync('scripts/deploy.env') ? readFileSync('scripts/deploy.env', 'utf8') : '')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim())),
);
const token = process.env.BAIDU_PUSH_TOKEN || env.BAIDU_PUSH_TOKEN;
if (!token) {
  console.log('没有 BAIDU_PUSH_TOKEN，跳过百度推送（填进 scripts/deploy.env 即可）');
  process.exit(0);
}
let urls = process.argv.slice(2).map((u) => (u.startsWith('http') ? u : SITE + u));
if (!urls.length) {
  if (!existsSync('dist/sitemap-0.xml')) { console.log('没有 dist/sitemap-0.xml，先 npm run build'); process.exit(1); }
  urls = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const res = await fetch(`http://data.zz.baidu.com/urls?site=${SITE}&token=${token}`, {
  method: 'POST',
  headers: { 'content-type': 'text/plain' },
  body: urls.join('\n'),
});
const data = await res.json().catch(() => ({}));
if (res.ok && data.success !== undefined) console.log(`百度推送：成功 ${data.success} 条，今天剩余配额 ${data.remain}${data.not_valid?.length ? `，无效 ${data.not_valid.length} 条` : ''}`);
else { console.log('百度推送失败：', res.status, JSON.stringify(data)); process.exit(1); }
