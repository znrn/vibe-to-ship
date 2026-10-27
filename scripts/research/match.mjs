// 把采集到的问法匹配到选题地图节点，写到 plan/research/matched.json
// 分三类：
//   covered    和某个节点的主词 / covers 几乎一样，已覆盖
//   addable    明显属于某个节点，但说法没写进 covers，可以补
//   unmatched  对不上任何节点，人工判断要不要新增节点
// 同时算出每个节点的需求分，写到 plan/research/demand.json（地图页会显示）
// 用法：node scripts/research/match.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const COVERED = 0.8;
const ADDABLE = 0.45;
// 明显无关的联想词（招聘、下载、破解等）
const NOISE = /兼职|招聘|工资|下载安装|破解|免费版|手机版|电话|客服|官网入口|股票|股份|公司排名|是什么意思啊|小说|游戏|彩票|贷款|代理加盟/;

const { merged } = loadTopicMap();
const rows = [];
for (const f of ['plan/research/raw.json', 'plan/research/web-search.json', 'plan/research/supplement.json']) {
  if (existsSync(f)) rows.push(...JSON.parse(readFileSync(f, 'utf8')).rows);
}

const normalize = (s) => String(s).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
function bigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}
// Dice 系数：短问法和短关键词之间比 Jaccard 更宽容
function dice(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size);
}

const nodeTerms = merged.map((n) => ({ id: n.id, terms: [n.keyword, ...n.covers].map((t) => ({ raw: t, norm: normalize(t) })) }));

// 去重：同一个问法合并来源
const byNorm = new Map();
for (const r of rows) {
  const q = String(r.q ?? '').trim();
  if (!q || NOISE.test(q)) continue;
  const norm = normalize(q);
  if (norm.length < 4) continue;
  const item = byNorm.get(norm) ?? { q, norm, sources: new Set(), seeds: new Set(), urls: [] };
  item.sources.add(r.source);
  if (r.seed) item.seeds.add(r.seed);
  if (r.url && item.urls.length < 3) item.urls.push(r.url);
  byNorm.set(norm, item);
}

const out = [];
for (const item of byNorm.values()) {
  let best = { id: null, term: null, score: 0 };
  for (const n of nodeTerms) {
    for (const t of n.terms) {
      const score = t.norm === item.norm ? 1 : dice(item.norm, t.norm);
      if (score > best.score) best = { id: n.id, term: t.raw, score };
    }
  }
  out.push({
    q: item.q,
    sources: [...item.sources],
    seeds: [...item.seeds],
    urls: item.urls,
    node: best.score >= ADDABLE ? best.id : null,
    nearest: best.id,
    nearestTerm: best.term,
    score: Number(best.score.toFixed(2)),
    kind: best.score >= COVERED ? 'covered' : best.score >= ADDABLE ? 'addable' : 'unmatched',
  });
}

out.sort((a, b) => b.sources.length - a.sources.length || b.score - a.score);
const count = (k) => out.filter((x) => x.kind === k).length;
writeFileSync('plan/research/matched.json', JSON.stringify(out, null, 1));
console.log(`去重后 ${out.length} 条：已覆盖 ${count('covered')}，可补进 covers ${count('addable')}，未匹配 ${count('unmatched')}`);

// 需求分：只算搜索引擎联想词（反映有人在搜），和节点足够像（≥ 0.6）的才计入，
// 每条联想词按出现在几个引擎里加权。不是搜索量，只用来比较节点之间需求的相对大小
const ENGINES = new Set(['baidu', 'bing', 'so360', 'sogou']);
const DEMAND_MIN = 0.6;
const demand = Object.fromEntries(merged.map((n) => [n.id, { score: 0, top: [] }]));
for (const x of out) {
  const engines = x.sources.filter((s) => ENGINES.has(s)).length;
  if (!x.node || !engines || x.score < DEMAND_MIN) continue;
  const d = demand[x.node];
  d.score += engines;
  if (d.top.length < 8) d.top.push(x.q);
}
writeFileSync('plan/research/demand.json', JSON.stringify({ computed: new Date().toISOString(), demand }, null, 1));
const cold = Object.entries(demand).filter(([, d]) => d.score === 0).map(([id]) => id);
console.log(`需求分写入 plan/research/demand.json；需求分为 0 的节点（${cold.length}）：${cold.join('、')}`);
