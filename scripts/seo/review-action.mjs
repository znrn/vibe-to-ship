// 审核动作（审核页按钮和命令行都走这里）：
//   approve <id>          去掉 draft、构建、部署（含巡检、推送、IndexNow）、提交 Git
//   reject <id> <意见>    退回，Claude 在后台按意见改一稿
//   drop <id>             放弃，删草稿
//   write                 后台选题并写稿
//   accept-proposal <id>  采纳建议选题：Claude 在后台把它登记进选题地图，然后写稿
//   ignore-proposal <id>
// 用法：node scripts/seo/review-action.mjs <action> [id] [note]
import { existsSync, readFileSync, writeFileSync, unlinkSync, openSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { readJson, writeJson, TODAY, DATA } from './lib.mjs';

const QUEUE = `${DATA}/queue.json`;
const DIR = 'src/content/articles';
const [action, id, ...rest] = process.argv.slice(2);
const note = rest.join(' ').trim();
const queue = readJson(QUEUE, []);
const q = queue.find((x) => x.id === id);
const say = (s) => console.log(s);
const bg = (args, log) => { const out = openSync(`${DATA}/${log}`, 'a'); const c = spawn('node', args, { detached: true, stdio: ['ignore', out, out], cwd: process.cwd() }); c.unref(); };
const refresh = () => spawnSync('node', ['scripts/seo/review-page.mjs'], { stdio: 'ignore' });

// ── 四期：分发与外链 ──
const refreshDist = () => spawnSync('node', ['scripts/seo/distribute-page.mjs'], { stdio: 'ignore' });
if (action === 'distribute') { bg(['scripts/seo/distribute.mjs', ...(id ? [id] : [])], 'distribute.log'); say(id ? '后台重新生成这篇的分发稿' : '后台给近 7 天发布的文章生成分发稿'); process.exit(0); }
if (action === 'outreach') { bg(['scripts/seo/outreach.mjs', '--force'], 'outreach.log'); say('后台扫描品牌提及、写私信草稿'); process.exit(0); }
if (action === 'prefill') { const r = spawnSync('node', ['scripts/seo/prefill.mjs', note, id], { encoding: 'utf8', timeout: 120000 }); say((r.stdout || r.stderr || '').trim()); process.exit(r.status ?? 1); }
if (action === 'wechat-draft') { const r = spawnSync('node', ['scripts/seo/wechat-draft.mjs', id], { encoding: 'utf8', timeout: 120000 }); refreshDist(); say((r.stdout || r.stderr || '').trim()); process.exit(r.status ?? 1); }
if (action === 'posted') {
  const DIST = `${DATA}/distribution.json`;
  const dist = readJson(DIST, { articles: {} });
  const a = dist.articles[id];
  if (!a) { say('没有这篇'); process.exit(1); }
  a.posted ??= {};
  if (a.posted[note]) delete a.posted[note]; else a.posted[note] = TODAY;
  writeJson(DIST, dist); refreshDist();
  say(a.posted[note] ? `已记：${note} 发于 ${TODAY}` : '已取消');
  process.exit(0);
}

if (action === 'write') { bg(['scripts/seo/pick-topic.mjs'], 'write.log'); setTimeout(() => bg(['scripts/seo/write.mjs'], 'write.log'), 3000); say('已在后台选题写稿，几分钟后看审核页'); refresh(); process.exit(0); }
if (!q) { say(`队列里没有 ${id}`); process.exit(1); }

if (action === 'approve') {
  const file = `${DIR}/${id}.md`;
  if (!existsSync(file)) { say('草稿文件不存在'); process.exit(1); }
  let text = readFileSync(file, 'utf8');
  text = text.replace(/^draft:.*\n?/m, '').replace(/^date:.*$/m, `date: ${TODAY}`);
  writeFileSync(file, text);
  const steps = [['构建', 'npm', ['run', 'build'], 300000], ['部署', 'bash', ['scripts/deploy.sh'], 600000], ['推送这篇', 'node', ['scripts/seo-push.mjs', `/articles/${id}/`], 60000]];
  for (const [label, cmd, args, timeout] of steps) {
    const r = spawnSync(cmd, args, { encoding: 'utf8', timeout });
    if (r.status !== 0 && label !== '推送这篇') {
      const err = ((r.stderr || '') + (r.stdout || '')).trim().split('\n').slice(-3).join(' ').slice(0, 300);
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^---\n/, '---\ndraft: true\n'));
      say(`${label}失败，已把文章改回草稿：${err}${label === '部署' ? '。线上如有问题：bash scripts/rollback.sh' : ''}`);
      process.exit(1);
    }
  }
  spawnSync('git', ['add', file, 'plan/topic-map.yaml'], { stdio: 'ignore' });
  spawnSync('git', ['commit', '-q', '-m', `发布「${q.title ?? q.keyword}」（${id}）：自动写稿，冬瓜审核通过`], { stdio: 'ignore' });
  try { spawnSync('node', ['scripts/topic-map-page.mjs'], { stdio: 'ignore' }); } catch {}
  Object.assign(q, { status: 'published', publishedAt: TODAY });
  writeJson(QUEUE, queue); refresh();
  say(`已发布 https://eryx.cn/articles/${id}/ ，构建、部署、巡检、推送都过了，Git 已提交`);
} else if (action === 'reject') {
  if (!note) { say('退回要写意见'); process.exit(1); }
  Object.assign(q, { status: 'rewrite', note, rejectedAt: TODAY });
  writeJson(QUEUE, queue); refresh();
  bg(['scripts/seo/write.mjs', id], `write-${id}.log`);
  say('已退回，Claude 在后台按意见改稿');
} else if (action === 'drop') {
  const file = `${DIR}/${id}.md`;
  if (existsSync(file)) unlinkSync(file);
  Object.assign(q, { status: 'dropped', droppedAt: TODAY });
  writeJson(QUEUE, queue); refresh();
  say('已放弃，草稿删除');
} else if (action === 'accept-proposal') {
  Object.assign(q, { status: 'accepted', acceptedAt: TODAY });
  writeJson(QUEUE, queue); refresh();
  bg(['scripts/seo/add-node.mjs', id], 'write.log');
  say('已采纳，Claude 在后台登记节点并写稿');
} else if (action === 'ignore-proposal') {
  Object.assign(q, { status: 'ignored' });
  writeJson(QUEUE, queue); refresh();
  say('已忽略');
} else { say('未知动作'); process.exit(1); }
