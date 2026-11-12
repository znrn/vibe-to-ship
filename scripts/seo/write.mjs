import { runAI } from './ai.mjs';
// 写稿：用本机 Claude Code 无头模式（claude -p）按 plan/WRITING.md 给队列里的节点写草稿（draft: true），
// 然后过检查：frontmatter 能解析、撞词检查（check-keywords）、AI 味词、来源链接存活、构建通过。
// 用法：node scripts/seo/write.mjs            写队列里所有 picked / rewrite 的
//       node scripts/seo/write.mjs <id>       只写这个
//       node scripts/seo/write.mjs --dry      只打印提示词
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import { readJson, writeJson, TODAY, DATA, UA, hasFlag } from './lib.mjs';
import { loadTopicMap } from '../lib/topic-map.mjs';
import { factCheck } from './factcheck.mjs';

const QUEUE = `${DATA}/queue.json`;
const DIR = 'src/content/articles';
const queue = readJson(QUEUE, []);
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
// 一次最多写 2 篇（--max=N 改），免得一次排太多、审不过来
const max = Number(process.argv.find((a) => a.startsWith('--max='))?.slice(6) ?? 2);
const targets = queue.filter((q) => q.type === 'article' && (only ? q.id === only : ['picked', 'rewrite'].includes(q.status))).slice(0, only ? 1 : max);
let failures=0;
if (!targets.length) { console.log('写稿：队列里没有要写的'); process.exit(0); }
const { merged, nodes } = loadTopicMap();
const published = merged.filter((x) => x.status === 'published');
const writing = readFileSync('plan/WRITING.md', 'utf8');
const sample = readFileSync(`${DIR}/icp-filing-process.md`, 'utf8');
const banned = readFileSync('plan/seo/banned-words.txt', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const curation = existsSync('plan/research/CURATION.md') ? (readFileSync('plan/research/CURATION.md', 'utf8').match(/## 范围[\s\S]*?(?=\n## |$)/) ?? [''])[0] : '';
const fmOf = (text) => { const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/); return m ? { fm: parse(m[1]), body: m[2] } : null; };

function prompt(q) {
  const node = nodes.get(q.id);
  const mustLink = (node?.links ?? []).map((l) => published.find((p) => p.id === l)).filter(Boolean);
  const nodeYaml = Object.entries(node).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
  return `你是 eryx.cn（冬瓜 AI 独立开发实战站）的写手。请按下面的写作标准，为选题地图上的节点「${q.id}」写一篇问题页，用 Write 工具保存到 ${DIR}/${q.id}.md（不要只在回复里贴内容）。

## 节点（选题地图 plan/topic-map.yaml）
${nodeYaml}

## 硬性要求
- frontmatter 必须有：title、description、intent、keyword、covers、stage、kind: question、platforms、topics、date: ${TODAY}、reviewed: ${TODAY}、answer、steps（带 who）、sources、faq、draft: true、sample: false。字段含义照样板文章。
- intent / keyword / stage / platforms 照节点写，不要改；covers 可以在节点基础上增删。
- 事实核对：每个数字、规则、费用、时限都先用 WebSearch 找官方页面（平台官方文档、帮助中心、政府网站），再用 WebFetch 打开核对原文。sources 只列你实际打开过的官方页面，title 写「平台：页面名」。核对不到的不写，不编。
- 这篇写完会自动检查后**直接上线，没人审核**。冬瓜的做法（怎么交给 AI、提示词怎么写）拿不准的地方，按写作标准里的通用做法写（新建项目 → 说想法 → 交给 Claude / Codex 处理）；还拿不准就不写这一段。不要留「待冬瓜确认」标记（这条优先于下面写作标准里的说法）。
- 写完会有另一个 AI 只对照你列的 sources 逐句核对：sources 页面上找不到依据的数字、规则、费用、时限会被拦下，所以没核对到的宁可不写。
- 正文必须链到这些已发布文章（链接文字用它的标题）：${mustLink.length ? mustLink.map((p) => `[${p.title}](/articles/${p.id}/)`).join('、') : '（没有）'}。其他已发布文章可以链：${published.filter((p) => !mustLink.includes(p)).map((p) => `${p.id}（${p.keyword}）`).join('、')}。不要链还没发布的文章。
- 正文和 frontmatter 里不要出现这些词：${banned.join('、')}。
- 不写教人绕开服务商地区限制的内容。${curation ? '\n' + curation : ''}
${q.note ? `\n## 上一稿被退回，审核意见\n${q.note}\n先读一遍现有的 ${DIR}/${q.id}.md，按意见改，其他部分别推倒重来。\n` : ''}
- 写完后，回复的最后一行只写：DONE ${DIR}/${q.id}.md

## 写作标准（plan/WRITING.md 全文）
${writing}

## 样板文章（格式、frontmatter 字段、语气都照这个）
${sample}
`;
}

async function checkSources(fm) {
  const dead = [];
  for (const s of fm.sources ?? []) {
    try {
      let res = await fetch(s.url, { method: 'HEAD', redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if ([403, 405, 501].includes(res.status)) res = await fetch(s.url, { redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if ([404, 410].includes(res.status)) dead.push(`${s.url} ${res.status}`);
    } catch (e) { dead.push(`${s.url} ${e.name === 'TimeoutError' ? '超时' : e.cause?.code ?? e.message}`); }
  }
  return dead;
}

for (const q of targets) {
  const p = prompt(q);
  if (hasFlag('--dry')) { console.log(p); continue; }
  q.status = 'drafting'; q.draftingAt = new Date().toISOString(); writeJson(QUEUE, queue);
  console.log(`写稿：${q.id}「${q.keyword}」${q.note ? '（按退回意见改）' : ''}…`);
  const t0 = Date.now();
  const r = runAI(p, {readOnly:false,timeout:30 * 60 * 1000});
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  writeFileSync(`${DATA}/write-${q.id}.log`, out + '\n');
  const file = `${DIR}/${q.id}.md`;
  const parsed = r.status === 0 && !r.error && existsSync(file) ? fmOf(readFileSync(file, 'utf8')) : null;
  if (!parsed?.fm) {
    failures++; q.status = 'failed'; q.error = r.error?.code === 'ETIMEDOUT' ? '超时（30 分钟）' : (out.split('\n').pop() ?? '').slice(0, 200);
    writeJson(QUEUE, queue);
    console.log(`  失败：${q.error}（日志 ${DATA}/write-${q.id}.log）`);
    continue;
  }
  // 草稿标记兜底
  if (parsed.fm.draft !== true) { writeFileSync(file, readFileSync(file, 'utf8').replace(/^draft:.*$/m, 'draft: true').replace(/^(---\n[\s\S]*?)(\n---)/, (m, a, b) => (/^draft:/m.test(a) ? m : `${a}\ndraft: true${b}`))); parsed.fm.draft = true; }
  // ── 检查 ──
  const checks = {};
  const kw = spawnSync('node', ['scripts/check-keywords.mjs'], { encoding: 'utf8' });
  const kwLines = ((kw.stdout || '') + (kw.stderr || '')).split('\n').filter((l) => l.includes(q.id));
  checks.keywords = { ok: kw.status === 0 && !kwLines.some((l) => /^✗|错误|报错/.test(l)), notes: kwLines.slice(0, 8) };
  const text = (parsed.body + ' ' + JSON.stringify(parsed.fm)).replace(/<[^>]+>/g, ' ');
  checks.banned = banned.filter((w) => text.includes(w));
  checks.sources = { count: parsed.fm.sources?.length ?? 0, dead: await checkSources(parsed.fm) };
  const b = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', timeout: 300000 });
  checks.build = { ok: b.status === 0, note: b.status === 0 ? '' : ((b.stderr || '') + (b.stdout || '')).trim().split('\n').filter((l) => /error|Error|错误/.test(l)).slice(-3).join(' ').slice(0, 300) };
  checks.todo = (parsed.body.match(/待冬瓜确认/g) ?? []).length;
  checks.words = parsed.body.replace(/\s/g, '').length;
  checks.pass = checks.keywords.ok && !checks.banned.length && !checks.sources.dead.length && checks.build.ok && checks.sources.count > 0;
  // 机器检查都过了、也没有待确认标记，才花钱跑独立事实核查；没过就记为不通过
  checks.facts = checks.pass && !checks.todo ? factCheck(q.id) : null;
  checks.pass = checks.pass && !checks.todo && checks.facts?.ok === true;
  Object.assign(q, { status: 'draft', draftedAt: TODAY, minutes: Math.round((Date.now() - t0) / 60000), title: parsed.fm.title, answer: parsed.fm.answer, checks, note: undefined });
  writeJson(QUEUE, queue);
  console.log(`  草稿好了（${q.minutes} 分钟，正文 ${checks.words} 字，来源 ${checks.sources.count} 条，待冬瓜确认 ${checks.todo} 处）：检查${checks.pass ? '全过' : '有问题：' + [!checks.keywords.ok && '撞词', checks.banned.length && `AI 味词 ${checks.banned.join('/')}`, checks.sources.dead.length && `来源打不开 ${checks.sources.dead.length}`, !checks.build.ok && '构建失败', !checks.sources.count && '没有来源', checks.todo && `待确认 ${checks.todo} 处`, checks.facts && !checks.facts.ok && `事实核查 ${checks.facts.issues.filter((i) => i.severity === 'high').length} 处`].filter(Boolean).join('，')}`);
}
try { spawnSync('node', ['scripts/seo/review-page.mjs'], { stdio: 'ignore' }); } catch {}

if(failures)process.exitCode=1;
