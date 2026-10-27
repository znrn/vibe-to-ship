// 核实一个说法是不是真有人搜：只输入它的前半截，看百度 / 360 能不能把它联想出来
//
// 为什么不直接输入整句：联想接口拿到一整句长问法时，经常只是在后面补几个字原样返回
// （连随手编的句子都会被补全），这不能证明有人搜过。只有从更短的前缀就被联想出来，
// 才说明它是常见搜索。
//
// 判定：取说法的 40% 和 60% 两个前缀（至少 3 个字），任一前缀的联想结果里有这个说法本身，
// 或有以它开头的更长问法，就算通过。
// 用法：node scripts/research/verify-terms.mjs
//   核实 grok.json 里 grok 自己写的说法（grok_seed / grok_bank），以及选题地图全部文章主词
// 结果写到 plan/research/verify.json：verified / unverified / rows（顺带采到的联想词）
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');

const ENGINES = {
  baidu: async (q) => ((await (await fetch(`https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json()).g ?? []).map((x) => x.q),
  so360: async (q) => ((await (await fetch(`https://sug.so.360.cn/suggest?encodein=utf-8&encodeout=utf-8&format=json&word=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json()).result ?? []).map((x) => x.word),
};

// 按字符截取前缀（中英文混排时按「去掉空格后的字符」计数，再映射回原文）
function prefixes(term) {
  const chars = [...term];
  const solid = chars.map((c, i) => [c, i]).filter(([c]) => !/\s/.test(c));
  const out = new Set();
  for (const ratio of [0.4, 0.6]) {
    const n = Math.max(3, Math.ceil(solid.length * ratio));
    if (n >= solid.length) continue;
    out.add(chars.slice(0, solid[n - 1][1] + 1).join('').trim());
  }
  return [...out];
}

const grok = existsSync('plan/research/grok.json') ? JSON.parse(readFileSync('plan/research/grok.json', 'utf8')).rows : [];
const { merged } = loadTopicMap();
const candidates = new Map();
for (const r of grok) if (r.source === 'grok_seed' || r.source === 'grok_bank') candidates.set(norm(r.q), { q: r.q, from: 'grok' });
for (const n of merged) candidates.set(norm(n.keyword), { q: n.keyword, from: 'map', node: n.id });
const terms = [...candidates.values()];
console.log(`待核实 ${terms.length} 个说法（grok ${terms.filter((t) => t.from === 'grok').length}，地图文章主词 ${terms.filter((t) => t.from === 'map').length}）`);

const verified = [];
const unverified = [];
const rows = [];
const fails = Object.fromEntries(Object.keys(ENGINES).map((k) => [k, 0]));
for (const [i, t] of terms.entries()) {
  const nt = norm(t.q);
  const hits = [];
  for (const p of prefixes(t.q)) {
    for (const [name, fn] of Object.entries(ENGINES)) {
      if (fails[name] >= 5) continue; // 连续失败就不再请求这个引擎
      try {
        const list = await fn(p);
        fails[name] = 0;
        for (const q of list) rows.push({ q, source: name, seed: p });
        const hit = list.find((q) => norm(q) === nt || norm(q).startsWith(nt));
        if (hit) hits.push({ engine: name, prefix: p, suggestion: hit });
      } catch {
        fails[name]++;
      }
      await sleep(200);
    }
  }
  (hits.length ? verified : unverified).push({ ...t, ...(hits.length ? { hits } : {}) });
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${terms.length}，通过 ${verified.length}`);
}

writeFileSync('plan/research/verify.json', JSON.stringify({ checked: new Date().toISOString(), method: 'prefix-40-60', verified, unverified, rows }, null, 1));
console.log(`核实通过 ${verified.length}，没通过 ${unverified.length}，顺带采到联想词 ${rows.length} 条 → plan/research/verify.json`);
const mapFail = unverified.filter((t) => t.from === 'map');
console.log(`地图文章主词没通过（${mapFail.length}）：${mapFail.map((t) => t.q).join('、')}`);
