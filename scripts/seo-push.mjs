// 把网址推送给百度「普通收录 · API 提交」。
// 新站每天的配额很小（通常只有 10 条），所以按重要性排序分批推：先探一条拿到当天剩余配额，再推剩下的。
// 用法：npm run seo:push            推送站点地图里的网址（按首页 → 支柱页 → 文章 → 聚合页的顺序，推到配额用完）
//       npm run seo:push -- /flow/idea/ /articles/xxx/   只推这几个（新发文章时用）
// token 放在 scripts/deploy.env 的 BAIDU_PUSH_TOKEN=（百度搜索资源平台 → 普通收录 → API 提交）
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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

// 重要性：首页 > 支柱页 > 入口页 > 文章 > 总览和聚合页
const rank = (u) => {
  const p = u.replace(SITE, '');
  if (p === '/') return 0;
  if (/^\/flow\/[a-z]+\/$/.test(p)) return 1;
  if (p === '/ai-indie-dev/') return 2;
  if (p.startsWith('/articles/') && p !== '/articles/') return 3;
  if (p === '/flow/' || p === '/articles/') return 4;
  return 5;
};

// 已推记录：url → 最近一次推送日期。没推过的优先，其次最久没推的
const LOG = 'plan/seo/baidu-pushed.json';
const pushedLog = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);

let urls = process.argv.slice(2).map((u) => (u.startsWith('http') ? u : SITE + u));
const explicit = urls.length > 0;
if (!explicit) {
  if (!existsSync('dist/sitemap-0.xml')) { console.log('没有 dist/sitemap-0.xml，先 npm run build'); process.exit(1); }
  urls = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => pushedLog[u] !== today)
    .sort((a, b) => (pushedLog[a] ? 1 : 0) - (pushedLog[b] ? 1 : 0) || rank(a) - rank(b) || (pushedLog[a] ?? '').localeCompare(pushedLog[b] ?? ''));
  if (!urls.length) { console.log('百度推送：站点地图里的网址今天都推过了'); process.exit(0); }
}

async function push(list) {
  const res = await fetch(`http://data.zz.baidu.com/urls?site=${SITE}&token=${token}`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: list.join('\n'),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// 先推 1 条探配额
const first = await push(urls.slice(0, 1));
if (first.status !== 200 || first.data.success === undefined) {
  const msg = first.data.message ?? JSON.stringify(first.data);
  console.log(msg === 'over quota' ? '百度推送：今天的配额已用完，明天再推（新站每天通常只有 10 条）' : `百度推送失败：${first.status} ${msg}`);
  process.exit(msg === 'over quota' ? 0 : 1);
}
let pushed = first.data.success;
let remain = first.data.remain ?? 0;
const rest = urls.slice(1, 1 + remain);
if (rest.length) {
  const r = await push(rest);
  if (r.status === 200 && r.data.success !== undefined) { pushed += r.data.success; remain = r.data.remain ?? 0; }
  else console.log('第二批失败：', r.status, JSON.stringify(r.data));
}
for (const u of urls.slice(0, 1 + rest.length)) pushedLog[u] = today;
mkdirSync('plan/seo', { recursive: true });
writeFileSync(LOG, JSON.stringify(pushedLog, null, 2) + '\n');
const never = urls.slice(1 + rest.length).filter((u) => !pushedLog[u]).length;
console.log(`百度推送：成功 ${pushed} 条，今天剩余配额 ${remain}${never > 0 ? `，还有 ${never} 条从没推过（明天接着推）` : '，全部页面都推过了'}`);
if (pushed) console.log('  已推：' + urls.slice(0, 1 + rest.length).map((u) => u.replace(SITE, '')).join(' '));
