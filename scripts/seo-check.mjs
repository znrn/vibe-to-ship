// 站内 SEO 检查：扫构建产物 dist/，规则见 plan/seo-playbook.md 的「检查规则」。
// 用法：npm run build && npm run seo:check
//   ✗ 必须改   ⚠ 建议改
// 也可以被 seo-today.mjs 调用：import { runSeoCheck } from './seo-check.mjs'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://eryx.cn';
// 不要求有站内链接指向的页
const NO_INBOUND_OK = new Set(['/', '/404/', '/camp/']);

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

export function loadPages() {
  if (!existsSync(join(DIST, 'index.html'))) return null;
  const pages = new Map();
  for (const f of walk(DIST)) {
    const html = readFileSync(f, 'utf8');
    if (/<meta http-equiv="refresh"/.test(html.slice(0, 400))) continue; // 301 跳转桩
    if (!/<head[\s>]/i.test(html)) continue; // 不是网页的 .html（如站长平台验证文件）
    const url = '/' + f.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '/');
    pages.set(url, html);
  }
  return pages;
}

function exists(pages, href) {
  const p = href.split('#')[0].split('?')[0];
  if (p === '' || pages.has(p) || pages.has(p + '/')) return true;
  const fs = join(DIST, p);
  return existsSync(fs) || existsSync(join(fs, 'index.html'));
}

export function runSeoCheck({ print = true } = {}) {
  const pages = loadPages();
  const errors = [];
  const warns = [];
  if (!pages) {
    errors.push('没有 dist/，先 npm run build');
    if (print) console.log('✗ ' + errors[0]);
    return { errors, warns };
  }
  const banned = existsSync('plan/seo/banned-words.txt')
    ? readFileSync('plan/seo/banned-words.txt', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    : [];
  const sitemapFile = join(DIST, 'sitemap-0.xml');
  const sitemap = new Set(existsSync(sitemapFile) ? [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')) : []);
  const inbound = new Map([...pages.keys()].map((u) => [u, 0]));

  for (const [url, html] of pages) {
    const head = html.slice(0, html.indexOf('</head>'));
    const title = decode((head.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '');
    const desc = decode((head.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? '');
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(head);
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]).trim());
    const body = text(html);

    // TDK
    if (!title) errors.push(`${url} 没有 title`);
    else if (title.length > 42) warns.push(`${url} title ${title.length} 字，超过 42：${title.slice(0, 30)}…`);
    if (!desc) errors.push(`${url} 没有 description`);
    else {
      if (desc.length < 60 && !noindex) warns.push(`${url} description 只有 ${desc.length} 字`);
      if (desc.length > 120) warns.push(`${url} description ${desc.length} 字，超过 120`);
      if (desc.length >= 60 && !/[。！？)）]$/.test(desc)) errors.push(`${url} description 不是完整句子（结尾：…${desc.slice(-12)}）`);
    }
    if (h1s.length !== 1) errors.push(`${url} 有 ${h1s.length} 个 H1`);
    else if (/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(h1s[0])) warns.push(`${url} H1 以 emoji 开头：${h1s[0].slice(0, 20)}`);

    // 链接
    for (const m of html.matchAll(/<a [^>]*href="([^"]*)"/g)) {
      const href = m[1];
      if (href === '#' || href === '') { errors.push(`${url} 有占位链接 href="#"`); continue; }
      if (!href.startsWith('/')) continue;
      if (!exists(pages, href)) { errors.push(`${url} 链到不存在的 ${href}`); continue; }
      const [path, frag] = href.split('#');
      if (frag) {
        const target = path === '' || path === url ? html : pages.get(path.endsWith('/') ? path : path + '/');
        if (target && !new RegExp(`\\bid="${frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(target)) errors.push(`${url} 锚点不存在 ${href}`);
      }
      const norm = path === '' ? url : path.endsWith('/') ? path : path + '/';
      if (norm !== url && inbound.has(norm)) inbound.set(norm, inbound.get(norm) + 1);
    }

    // 图片 alt
    for (const m of html.matchAll(/<img [^>]*>/g)) if (!/\salt="[^"]+"/.test(m[0])) warns.push(`${url} 有图片没有 alt：${(m[0].match(/src="([^"]*)"/) ?? [])[1] ?? ''}`);

    // AI 味词
    for (const w of banned) {
      const n = body.split(w).length - 1;
      if (n) warns.push(`${url} 出现「${w}」×${n}`);
    }

    // 站点地图
    if (!noindex && url !== '/404/' && !sitemap.has(url)) warns.push(`${url} 可收录但不在站点地图里`);
    if (noindex && sitemap.has(url)) errors.push(`${url} 是 noindex 却在站点地图里`);
  }
  for (const [url, n] of inbound) if (n === 0 && !NO_INBOUND_OK.has(url) && !/noindex/.test(pages.get(url).slice(0, 2000))) warns.push(`${url} 是孤立页，没有站内链接指向它`);

  if (print) {
    for (const e of errors) console.log('✗ ' + e);
    for (const w of warns) console.log('⚠ ' + w);
    console.log(`\n站内检查：${pages.size} 页，${errors.length} 个必须改，${warns.length} 个建议改`);
  }
  return { errors, warns, pages: pages.size };
}

if (process.argv[1] && process.argv[1].endsWith('seo-check.mjs')) {
  const { errors } = runSeoCheck();
  process.exit(errors.length ? 1 : 0);
}
