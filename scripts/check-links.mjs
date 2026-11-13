// 参考来源死链检查：逐个打开所有文章 sources 里的链接和正文里的外部链接
// 用法：npm run check:links
// 要联网，所以不放进 npm run build。官方文档经常改地址，建议每月跑一次。
//   ✗ 打不开：404、410、域名解析失败、超时 —— 去找新地址或换来源
//   ? 待复核：403、429、5xx 等，可能是脚本校验、访问限制或服务异常，需用浏览器确认
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
const needsReview = results.filter((r) => !r.ok && !r.dead);
for (const r of dead) console.log(`✗ ${r.status}  ${r.url}\n    出现在：${r.in.join('、')}`);
for (const r of needsReview) console.log(`? HTTP ${r.status}  ${r.url}\n    出现在：${r.in.join('、')}（HTTP结果需浏览器复核，不能据此认定链接失效）`);
console.log(`\n检查 ${results.length} 个链接：HTTP正常 ${results.length - dead.length - needsReview.length}，确认失效 ${dead.length}，需浏览器复核 ${needsReview.length}`);
process.exit(dead.length ? 1 : 0);
