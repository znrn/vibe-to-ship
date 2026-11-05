// 采纳「建议新增选题」：让 Claude 把这个词登记成选题地图的节点（id、stage、platforms、intent、keyword、covers），
// 再把新节点加进队列并写稿。用法：node scripts/seo/add-node.mjs <proposal-id>
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readJson, writeJson, TODAY, DATA } from './lib.mjs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const QUEUE = `${DATA}/queue.json`;
const queue = readJson(QUEUE, []);
const p = queue.find((x) => x.id === process.argv[2]);
if (!p) { console.log('没有这条建议'); process.exit(1); }
const before = new Set(loadTopicMap().merged.map((n) => n.id));
const head = readFileSync('plan/topic-map.yaml', 'utf8').split('\nnodes:')[0];
const prompt = `读者在百度搜「${p.word}」看到了 eryx.cn 但没点进来（展现 ${p.impressions}${p.rank ? `，排名 ${p.rank}` : ''}）。请把它登记成选题地图 plan/topic-map.yaml 的一个新节点，用 Edit 工具追加到 nodes 列表合适的阶段分组末尾。
要求：id 用英文短横线（像 icp-filing-rejected）；stage 取 idea/base/accounts/build/deploy/domain/payment/review/grow 之一；platforms 从 web/miniprogram/app/desktop 选；priority: P1；intent 写读者真正想解决的事；keyword 写读者会搜的说法（可以就是「${p.word}」的规范写法）；covers 写 4～8 个同一意图的其他问法；links 填相关的已有节点 id（没有就 []）。
先读一遍地图里已有的节点，别和已有节点重复意图；如果已有节点已经覆盖这个意图，就不要新增，回复「DUPLICATE <已有节点 id>」。
地图文件开头的说明：
${head}
最后一行只回复：ADDED <新节点 id> 或 DUPLICATE <已有节点 id>`;
const r = spawnSync('claude', ['-p', '--output-format', 'text', '--permission-mode', 'acceptEdits', '--allowedTools', 'Read', 'Edit', 'Write', 'Grep', 'Glob'], { input: prompt, encoding: 'utf8', timeout: 10 * 60 * 1000 });
const out = ((r.stdout || '') + (r.stderr || '')).trim();
const after = loadTopicMap().merged.map((n) => n.id).filter((i) => !before.has(i));
const dup = out.match(/DUPLICATE\s+([\w-]+)/)?.[1];
if (after.length) {
  const id = after[0];
  const node = loadTopicMap().merged.find((n) => n.id === id);
  p.nodeId = id;
  queue.push({ type: 'article', id, keyword: node.keyword, stage: node.stage, status: 'picked', pickedAt: TODAY, reason: `采纳建议选题「${p.word}」（${p.source}，展现 ${p.impressions}）` });
  writeJson(QUEUE, queue);
  console.log(`已登记节点 ${id}，开始写稿`);
  spawnSync('node', ['scripts/seo/write.mjs', id], { stdio: 'inherit' });
} else if (dup) {
  p.nodeId = dup; p.note = `已有节点 ${dup} 覆盖了这个意图`;
  writeJson(QUEUE, queue);
  console.log(p.note);
} else { p.status = 'proposed'; p.error = out.split('\n').pop()?.slice(0, 160); writeJson(QUEUE, queue); console.log('登记失败：' + p.error); }
spawnSync('node', ['scripts/seo/review-page.mjs'], { stdio: 'ignore' });
