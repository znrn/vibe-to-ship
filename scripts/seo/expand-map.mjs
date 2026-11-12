import { runAI } from './ai.mjs';
// 选题地图自动扩充：待写的节点少于 MIN 个时，让 Claude 找真实问法，追加 ADD 个新节点。
// 每个节点 = 一个独立的搜索意图（同一意图的不同问法放进 covers，不单独成篇）。
// 加完跑撞词检查（check-keywords），不过就整份还原，保证不会把构建搞坏。
// 用法：node scripts/seo/expand-map.mjs [--force]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readJson, DATA, hasFlag } from './lib.mjs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const MIN = 30;
const ADD = 15;
const MAP = 'plan/topic-map.yaml';
const queue = readJson(`${DATA}/queue.json`, []);
const taken = new Set(queue.filter((q) => q.type === 'article').map((q) => q.id));
const { merged } = loadTopicMap();
const left = merged.filter((x) => x.status === 'planned' && !x.id.startsWith('flow-') && !taken.has(x.id) && x.keyword && x.intent);
if (left.length >= MIN && !hasFlag('--force')) { console.log(`选题地图：待写 ${left.length} 个，够用，不扩充`); process.exit(0); }

const before = readFileSync(MAP, 'utf8');
const curation = existsSync('plan/research/CURATION.md') ? readFileSync('plan/research/CURATION.md', 'utf8').slice(0, 4000) : '';
const prompt = `你在维护 eryx.cn（冬瓜站：教不会写代码的人靠 AI 一个人把网站、小程序、App 做到上线并收到钱）的选题地图 ${MAP}。
现在待写的节点只剩 ${left.length} 个，请新增 ${ADD} 个节点。

步骤：
1. 先 Read 整份 ${MAP}，弄清已有节点（含已发布的）覆盖了哪些意图，以及文件开头的字段说明。
2. 用 WebSearch 找真实问法：百度搜索下拉词和「相关搜索」、知乎和 V2EX 的提问、各平台官方帮助中心里常见问题。范围是上线链路上的卡点：想清楚、选底子、工具账号、开发、部署、域名备案、收款、审核、上线后。
3. 用 Edit 把新节点追加到对应阶段分组的末尾。字段：id（英文短横线）、stage、platforms、priority: P2、intent、keyword、covers（4～8 个同一意图的其他问法）、links（相关已有节点 id，没有就 []）。

硬性要求：
- 一个节点 = 一个读者要解决的独立问题。只是说法不同、答案相同的，放进已有节点或新节点的 covers，不要单独成节点。
- 按人群或场景细分可以（如「个人开发者小程序怎么收款」和「个体户小程序怎么收款」答案不同），但答案必须真的不同。
- 不要和已有节点意图重复；拿不准就不加。
- 不写教人绕开平台审核、地区限制、借用他人资质的选题。
- 只改 ${MAP}，不改别的文件。
${curation ? '\n站点范围说明（plan/research/CURATION.md 节选）：\n' + curation : ''}
最后一行只回复：ADDED <新增个数>`;

const r = runAI(prompt, {readOnly:false,timeout:30 * 60 * 1000});
if(r.status !== 0 || r.error){ console.error('Codex执行失败', (r.stderr||'').slice(-300));process.exit(1); }
const out = ((r.stdout || '') + (r.stderr || '')).trim();
writeFileSync(`${DATA}/expand-map.log`, out + '\n');
let added = [];
try {
  const now = loadTopicMap().merged.map((n) => n.id);
  const old = new Set(merged.map((n) => n.id));
  added = now.filter((i) => !old.has(i));
} catch (e) { added = null; }
const kw = spawnSync('node', ['scripts/check-keywords.mjs'], { encoding: 'utf8' });
if (added === null || kw.status !== 0) {
  writeFileSync(MAP, before);
  console.log(`选题地图：扩充后检查没过，已还原（${((kw.stdout || '') + (kw.stderr || '')).trim().split('\n').slice(-2).join(' ').slice(0, 200)}）`);
  process.exit(1);
}
console.log(`选题地图：待写原有 ${left.length} 个，新增 ${added.length} 个：${added.join('、')}`);
