import {scopeErrors} from './scope.mjs';
// 选题：从选题地图里挑下一批要写的问题页，进 plan/seo/data/queue.json。
//   优先级 = 机会词命中（站长后台 / 必应有展现没点击的词能对上这个节点）> 地图 P1 > 需求分 / 搜索量
//   流程页（flow-*）不自动写：那是冬瓜的教法，人来写
//   对不上任何节点的「待写」机会词 → 进队列当「建议新增选题」，审核页里采纳后才建节点
// 用法：node scripts/seo/pick-topic.mjs [--n=2] [--force]
import { readJson, writeJson, TODAY, DATA, argValue, hasFlag } from './lib.mjs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const QUEUE = `${DATA}/queue.json`;
const n = Number(argValue('n') ?? 2);
const queue = readJson(QUEUE, []);
const findings = readJson(`${DATA}/findings.json`, {});
const demand = readJson('plan/research/demand.json')?.demand ?? {};
const volume = readJson('plan/research/volume.json')?.nodes ?? {};
const { merged } = loadTopicMap();
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');
const opps = findings.opportunities ?? [];

// 正在排队 / 写 / 待审 / 已发布的不重复挑；被放弃的也不再挑
const busy = new Set(queue.filter((q) => q.type !== 'proposal' && q.status !== 'dropped').map((q) => q.id));
const dropped = new Set(queue.filter((q) => q.status === 'dropped').map((q) => q.id));
const P = { P1: 3, P2: 2, P3: 1 };
const candidates = merged
  .filter((x) => x.status === 'planned' && !scopeErrors(x).length && !x.id.startsWith('flow-') && !busy.has(x.id) && !dropped.has(x.id) && x.keyword && x.intent)
  .map((x) => {
    const hits = opps.filter((o) => { const w = norm(o.word); return [x.keyword, ...x.covers].some((c) => c && (w.includes(norm(c)) || norm(c).includes(w))); });
    const score = (P[x.priority] ?? 1) * 10 + hits.reduce((s, o) => s + 5 + Math.min(10, o.impressions ?? 0), 0) + Math.min(10, (demand[x.id]?.score ?? 0) / 10) + Math.min(10, Math.log10((volume[x.id]?.volume ?? 0) + 1) * 3);
    const reason = [hits.length ? `机会词命中 ${hits.length} 个（${hits.slice(0, 2).map((h) => h.word).join('、')}）` : '', x.priority, demand[x.id]?.score ? `需求分 ${demand[x.id].score}` : '', volume[x.id]?.volume ? `搜索量 ${volume[x.id].volume}` : ''].filter(Boolean).join(' · ');
    return { ...x, score, reason };
  })
  .sort((a, b) => b.score - a.score);

const picked = candidates.slice(0, n);
for (const c of picked) queue.push({ type: 'article', id: c.id, keyword: c.keyword, stage: c.stage, status: 'picked', pickedAt: TODAY, score: Math.round(c.score), reason: c.reason });

// 建议新增选题：待写机会词里对不上节点的，展现 ≥ 3 才值得提
let proposals = 0;
for (const o of opps.filter((o) => o.action === '待写' && (o.impressions ?? 0) >= 3)) {
  if (scopeErrors({keyword:o.word}).length) continue;
  if (queue.some((q) => q.type === 'proposal' && norm(q.word) === norm(o.word))) continue;
  queue.push({ type: 'proposal', id: `proposal-${Date.now()}-${proposals}`, word: o.word, source: o.source, impressions: o.impressions, rank: o.rank, status: 'proposed', pickedAt: TODAY });
  proposals++;
}
writeJson(QUEUE, queue);
console.log(`选题：挑了 ${picked.length} 篇${picked.length ? '：' + picked.map((c) => `${c.id}「${c.keyword}」（${c.reason}）`).join('；') : ''}；候选还有 ${Math.max(0, candidates.length - picked.length)} 个；新增选题建议 ${proposals} 条`);
