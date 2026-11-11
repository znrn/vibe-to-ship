// 全自动发布：不等人审核。
//   待审草稿检查全过（撞词、AI 味词、来源能打开、构建、没有待确认标记、独立事实核查）→ 直接发布（构建、部署、推送、提交）
//   没过 → 把没过的原因当退回意见，自动重写一稿再查，最多 MAX_TRIES 次
//   还不过 → 放弃这篇（删草稿，队列记原因），不上线
// 每天由 daily.mjs 调用；也可以手动：node scripts/seo/auto-publish.mjs
import { spawnSync } from 'node:child_process';
import { readJson, writeJson, DATA, TODAY, notify } from './lib.mjs';
import { factCheck } from './factcheck.mjs';

const QUEUE = `${DATA}/queue.json`;
const MAX_TRIES = 2;
const load = () => readJson(QUEUE, []);
const save = (queue) => writeJson(QUEUE, queue);
const action = (...args) => {
  const r = spawnSync('node', ['scripts/seo/review-action.mjs', ...args], { encoding: 'utf8', timeout: 20 * 60 * 1000, env: { ...process.env, SEO_AUTO: '1' } });
  return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim() };
};

function problems(c = {}) {
  const out = [];
  if (!c.keywords?.ok) out.push(`撞词检查没过：${(c.keywords?.notes ?? []).join('；') || '换一个和已有文章不重叠的角度'}`);
  if (c.banned?.length) out.push(`删掉这些词：${c.banned.join('、')}`);
  if (c.sources?.dead?.length) out.push(`这些来源打不开，换成能打开的官方页面，或删掉依赖它的内容：${c.sources.dead.join('；')}`);
  if (!c.sources?.count) out.push('没有 sources：每个事实都要有实际打开过的官方页面');
  if (c.build && !c.build.ok) out.push(`构建失败：${c.build.note}`);
  if (c.todo) out.push(`还有 ${c.todo} 处「待冬瓜确认」：按通用做法改写，拿不准就删掉那一段，不要留标记`);
  for (const i of (c.facts?.issues ?? []).filter((x) => x.severity === 'high')) out.push(`事实核查：「${i.quote}」— ${i.problem}。改成和 sources 一致，找不到依据就删掉这句`);
  return out;
}

const ids = load().filter((q) => q.type === 'article' && q.status === 'draft').map((q) => q.id);
if (!ids.length) { console.log('自动发布：没有待发布的草稿'); process.exit(0); }
const result = [];
for (const id of ids) {
  for (;;) {
    let queue = load();
    let q = queue.find((x) => x.id === id);
    if (q?.status !== 'draft') break;
    const c = q.checks ?? {};
    // 旧草稿（加事实核查之前写的）机器检查已过，补跑一次事实核查
    if (c.pass && !c.todo && !c.facts) {
      console.log(`${id}：补跑事实核查…`);
      c.facts = factCheck(id);
      c.pass = c.facts.ok;
      q.checks = c; save(queue);
    }
    if (c.pass && !c.todo && c.facts?.ok) {
      const r = action('approve', id);
      console.log(`${id}：${r.out}`);
      result.push(r.ok ? `已发布 ${id}` : `${id} 发布失败，明天重试`);
      if (!r.ok) notify('冬瓜站 SEO', `${id} 自动发布失败：${r.out.slice(0, 80)}`);
      break;
    }
    const tries = q.autoTries ?? 0;
    if (tries >= MAX_TRIES) {
      const why = problems(c).join('；').slice(0, 300);
      action('drop', id);
      queue = load(); q = queue.find((x) => x.id === id);
      Object.assign(q, { note: `自动重写 ${MAX_TRIES} 次仍没过：${why}` }); save(queue);
      console.log(`${id}：自动重写 ${MAX_TRIES} 次仍没过，已放弃（${why}）`);
      result.push(`放弃 ${id}`);
      break;
    }
    const note = problems(c);
    Object.assign(q, { status: 'rewrite', note: note.join('\n') || '检查没过，按写作标准重写一遍', rejectedAt: TODAY, autoTries: tries + 1 });
    save(queue);
    console.log(`${id}：检查没过，自动重写第 ${tries + 1} 次（${note.length} 个问题）…`);
    spawnSync('node', ['scripts/seo/write.mjs', id], { stdio: 'inherit', timeout: 60 * 60 * 1000 });
    queue = load(); q = queue.find((x) => x.id === id);
    if (q?.status === 'failed') { console.log(`${id}：重写失败（${q.error}）`); result.push(`${id} 重写失败`); break; }
  }
}
console.log(`自动发布：${result.join('；')}`);
