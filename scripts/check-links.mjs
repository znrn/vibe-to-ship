// 参考来源死链检查：逐个打开所有文章 sources 里的链接和正文里的外部链接
// 用法：npm run check:links
// 要联网，所以不放进 npm run build。官方文档经常改地址，建议每月跑一次。
//   ✗ 打不开：404、410、域名解析失败、超时 —— 去找新地址或换来源
//   ? 被拦截：403、429、5xx 等，常见于拒绝脚本访问的网站，用浏览器手动打开确认
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { checkSourceLink } from './lib/check-source-link.mjs';

const DIR = 'src/content/articles';

// 链接 → 出现在哪些文章
const links = new Map();
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(`${DIR}/${f}`, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const data = m ? parse(m[1]) : {};
  const urls = [...(data.sources ?? []).map((s) => s.url), ...[...(m?.[2] ?? '').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((x) => x[1])];
  for (const u of urls) links.set(u, [...(links.get(u) ?? []), f.replace(/\.md$/, '')]);
}

const results = [];
const queue = [...links.keys()];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.push({ url, ...(await checkSourceLink(url)), in: links.get(url) });
    }
  }),
);

const dead = results.filter((r) => !r.ok && r.dead);
const blocked = results.filter((r) => !r.ok && !r.dead);
for (const r of dead) console.log(`✗ ${r.status}  ${r.url}\n    出现在：${r.in.join('、')}`);
for (const r of blocked) console.log(`? ${r.status}  ${r.url}\n    出现在：${r.in.join('、')}（可能拒绝脚本访问，用浏览器确认）`);
console.log(`\n检查 ${results.length} 个链接：正常 ${results.length - dead.length - blocked.length}，打不开 ${dead.length}，被拦截待确认 ${blocked.length}`);
process.exit(dead.length ? 1 : 0);
