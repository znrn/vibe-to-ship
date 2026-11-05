// 采集：服务器 nginx 访问日志里昨天的蜘蛛抓取和访客概况。
// 用法：node scripts/seo/collect-crawl.mjs            昨天
//       node scripts/seo/collect-crawl.mjs --date=2026-11-04
// 需要 scripts/deploy.env 里的 DEPLOY_HOST / DEPLOY_KEY；日志路径 NGINX_LOG（默认 /www/wwwlogs/eryx.cn.log）
import { execFileSync } from 'node:child_process';
import { loadEnv, readJson, writeJson, pruneDays, YESTERDAY, argValue, DATA } from './lib.mjs';

const env = loadEnv();
const date = argValue('date') ?? YESTERDAY;
const FILE = `${DATA}/crawl.json`;
if (!env.DEPLOY_HOST || !env.DEPLOY_KEY) { console.log('没有 DEPLOY_HOST / DEPLOY_KEY，跳过蜘蛛日志'); process.exit(0); }
const LOG = env.NGINX_LOG || '/www/wwwlogs/eryx.cn.log';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const [y, m, d] = date.split('-');
const stamp = `[${d}/${MON[Number(m) - 1]}/${y}:`;

const SPIDERS = [
  ['Baiduspider', /Baiduspider/i], ['bingbot', /bingbot/i], ['Googlebot', /Googlebot/i],
  ['神马 YisouSpider', /YisouSpider/i], ['搜狗', /Sogou/i], ['360Spider', /360Spider|HaoSouSpider/i], ['字节 Bytespider', /Bytespider/i],
  ['GPTBot', /GPTBot|OAI-SearchBot|ChatGPT-User/i], ['ClaudeBot', /ClaudeBot|anthropic-ai/i], ['PerplexityBot', /PerplexityBot/i],
  ['Applebot', /Applebot/i], ['其他爬虫', /bot|spider|crawler/i],
];
const ENGINES = [['百度', /baidu\.com/], ['必应', /bing\.com/], ['谷歌', /google\./], ['搜狗', /sogou\.com/], ['360', /so\.com/], ['神马', /sm\.cn/], ['夸克', /quark/]];

let raw;
try {
  raw = execFileSync('ssh', ['-i', env.DEPLOY_KEY, '-o', 'ConnectTimeout=20', '-o', 'BatchMode=yes', env.DEPLOY_HOST, `grep -F '${stamp}' ${LOG} | cut -c1-600`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 120000 });
} catch (e) {
  if (e.status === 1 && !e.stdout) raw = ''; // grep 没匹配
  else { console.log('拉日志失败：' + (e.stderr || e.message).toString().trim().slice(0, 200)); process.exit(1); }
}

const RE = /^(\S+) \S+ \S+ \[[^\]]+\] "(\S+) (\S+)[^"]*" (\d{3}) (\S+) "([^"]*)" "([^"]*)"/;
const rec = { date, total: 0, spiders: {}, human: { hits: 0, pages: {}, referrers: {}, engines: {}, notFound: {}, channels: {} } };
const inc = (o, k, n = 1) => { o[k] = (o[k] ?? 0) + n; };
for (const line of raw.split('\n')) {
  const mm = line.match(RE);
  if (!mm) continue;
  const [, ip, method, url, status, , ref, ua] = mm;
  const path = url.split('?')[0];
  rec.total++;
  const sp = SPIDERS.find(([, re]) => re.test(ua));
  if (sp) {
    const s = (rec.spiders[sp[0]] ??= { hits: 0, status: {}, pages: {}, notFound: {}, ips: {} });
    s.hits++;
    inc(s.status, status);
    inc(s.ips, ip);
    if (status === '200' && method === 'GET') inc(s.pages, path);
    if (status === '404') inc(s.notFound, path);
  } else {
    if (/\.(css|js|png|jpg|svg|ico|woff2?|xml|txt|webp)$/i.test(path) || path.startsWith('/_astro/')) continue;
    rec.human.hits++;
    if (status === '200' && method === 'GET') inc(rec.human.pages, path);
    // 分发稿带的来源参数：?from=zhihu / xhs / v2ex / wechat，用来算哪个渠道来人
    const ch = url.match(/[?&]from=([a-z0-9_-]+)/i)?.[1];
    if (ch && status === '200') inc(rec.human.channels, ch.toLowerCase());
    if (status === '404') inc(rec.human.notFound, path);
    if (ref && ref !== '-') {
      try {
        const host = new URL(ref).host;
        if (!/eryx\.cn$/.test(host)) {
          inc(rec.human.referrers, host);
          const eng = ENGINES.find(([, re]) => re.test(host));
          if (eng) inc(rec.human.engines, eng[0]);
        }
      } catch {}
    }
  }
}
// 只留前 N，免得文件膨胀
const top = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n));
for (const s of Object.values(rec.spiders)) { s.pages = top(s.pages, 60); s.notFound = top(s.notFound, 30); s.ips = Object.keys(s.ips).length; }
rec.human.pages = top(rec.human.pages, 40); rec.human.referrers = top(rec.human.referrers, 20); rec.human.notFound = top(rec.human.notFound, 20);

const all = readJson(FILE, { days: {} });
all.days[date] = rec;
all.updated = new Date().toISOString();
pruneDays(all.days);
writeJson(FILE, all);
const sp = Object.entries(rec.spiders).map(([k, v]) => `${k} ${v.hits}（404 ${v.status['404'] ?? 0}）`).join('、') || '没有蜘蛛来';
console.log(`蜘蛛日志 ${date}：共 ${rec.total} 条请求；${sp}；访客页面请求 ${rec.human.hits}，搜索引擎来访 ${Object.entries(rec.human.engines).map(([k, v]) => `${k} ${v}`).join(' ') || '0'}`);
