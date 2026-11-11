// 自动采纳「建议新增选题」（百度 / 必应有展现、但地图上没有对应文章的词）：
// 每天最多 MAX 条，交给 add-node.mjs 登记节点并写稿（重复意图的会被识别为 DUPLICATE，不新增）。
// 用法：node scripts/seo/accept-proposals.mjs
import { spawnSync } from 'node:child_process';
import { readJson, writeJson, DATA, TODAY } from './lib.mjs';

const MAX = 2;
const QUEUE = `${DATA}/queue.json`;
const ids = readJson(QUEUE, []).filter((q) => q.type === 'proposal' && q.status === 'proposed').slice(0, MAX).map((q) => q.id);
if (!ids.length) { console.log('建议选题：没有待采纳的'); process.exit(0); }
for (const id of ids) {
  const queue = readJson(QUEUE, []);
  const p = queue.find((q) => q.id === id);
  Object.assign(p, { status: 'accepted', acceptedAt: TODAY, auto: true });
  writeJson(QUEUE, queue);
  const r = spawnSync('node', ['scripts/seo/add-node.mjs', id], { encoding: 'utf8', timeout: 60 * 60 * 1000 });
  console.log(`「${p.word}」：${((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).pop() ?? ''}`);
}
