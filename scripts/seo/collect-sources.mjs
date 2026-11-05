// 采集：文章参考来源和正文外链是否还活着。每周三跑（或 --force）。规则同 scripts/check-links.mjs。
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { readJson, writeJson, TODAY, WEEKDAY, DATA, UA, hasFlag } from './lib.mjs';

const FILE = `${DATA}/sources.json`;
const prev = readJson(FILE);
if (!hasFlag('--force') && WEEKDAY !== 3 && prev?.date && Date.now() - new Date(prev.date).getTime() < 6 * 864e5) { console.log('来源检查：本周查过，跳过'); process.exit(0); }

const DIR = 'src/content/articles';
const links = new Map();
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(`${DIR}/${f}`, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const data = m ? parse(m[1]) : {};
  if (data.draft) continue;
  const urls = [...(data.sources ?? []).map((s) => s.url), ...[...(m?.[2] ?? '').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((x) => x[1])];
  for (const u of urls) if (u) links.set(u, [...new Set([...(links.get(u) ?? []), f.replace(/\.md$/, '')])]);
}
async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if (res.ok) return { ok: true, status: res.status };
      if (method === 'HEAD' && [403, 405, 501].includes(res.status)) continue;
      return { ok: false, status: res.status, dead: [404, 410].includes(res.status) };
    } catch (e) {
      if (method === 'HEAD') continue;
      return { ok: false, status: e.name === 'TimeoutError' ? '超时' : e.cause?.code ?? e.message, dead: true };
    }
  }
  return { ok: false, status: '未知', dead: false };
}
const results = [];
const queue = [...links.keys()];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) { const url = queue.shift(); results.push({ url, ...(await check(url)), in: links.get(url) }); } }));
const dead = results.filter((r) => !r.ok && r.dead).map(({ url, status, in: a }) => ({ url, status, in: a }));
const blocked = results.filter((r) => !r.ok && !r.dead).map(({ url, status, in: a }) => ({ url, status, in: a }));
writeJson(FILE, { date: TODAY, checked: results.length, dead, blocked });
console.log(`来源检查：${results.length} 个链接，打不开 ${dead.length}，被拦待确认 ${blocked.length}`);
