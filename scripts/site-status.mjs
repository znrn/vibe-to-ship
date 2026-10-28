// 建站进度：读 plan/site-plan.yaml，加上能从代码里自动查出来的状态，
// 在终端打印摘要，并生成本机导航页 ~/launchpad/pages/aidev-site-status.html
// 用法：npm run status            打印 + 生成页面
//       npm run status -- --quiet 只生成页面
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { parse } from 'yaml';
import { ROADMAP } from '../src/data/site.ts';
import { loadTopicMap } from './lib/topic-map.mjs';

const OUT = `${homedir()}/launchpad/pages/aidev-site-status.html`;
const quiet = process.argv.includes('--quiet');
const plan = parse(readFileSync('plan/site-plan.yaml', 'utf8'));

// ── 读 src/ 下的文本文件（自动检查和找空位用） ──
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|ts|mjs|md|css)$/.test(name)) out.push(p);
  }
  return out;
}
const srcFiles = walk('src').map((f) => ({ file: f, lines: readFileSync(f, 'utf8').split('\n') }));
const isComment = (l) => /^\s*(\/\/|\/\*|\*)/.test(l);
const grep = (re) =>
  srcFiles.flatMap(({ file, lines }) => lines.map((l, i) => ({ file, line: i + 1, text: l.trim() })).filter((x) => !isComment(x.text) && re.test(x.text)));

// ── 清单里的自动检查 ──
function autoCheck(auto) {
  if (!auto) return null;
  if (auto.file) return existsSync(auto.file);
  if (auto.built) return existsSync(join('dist', auto.built)) ? true : existsSync('dist') ? false : null;
  if (auto.absent) return grep(new RegExp(auto.absent, 'm')).length === 0;
  return null;
}
const groups = plan.groups.map((g) => ({
  ...g,
  items: g.items.map((it) => {
    const ok = autoCheck(it.auto);
    const status = ok === true ? 'done' : ok === false && it.status === 'done' ? 'todo' : it.status;
    return { ...it, status, autoChecked: ok !== null };
  }),
}));

// ── 9 个流程页：来自 src/data/flow.ts 和文章 ──
const { articles } = loadTopicMap();
const live = [...articles].filter(([, a]) => !a.data.draft);
const flows = ROADMAP.map((s) => {
  const pillar = live.find(([, a]) => a.data.kind === 'flow' && a.data.stage === s.slug);
  const questions = live.filter(([, a]) => a.data.stage === s.slug && a.data.kind !== 'flow').map(([id]) => id);
  const pending = pillar ? grep(/待冬瓜确认|待定/).filter((x) => x.file.endsWith(`/${pillar[0]}.md`)).length : 0;
  const sample = pillar?.[1].data.sample;
  const status = !pillar ? (questions.length ? 'doing' : 'todo') : pending || sample ? 'wait' : 'done';
  const note = !pillar
    ? questions.length ? `还没有流程页文章，已有 ${questions.length} 个问题页` : '还没开始'
    : pending ? `流程页已写，${pending} 处待定（等冬瓜）` : sample ? '流程页是示例，待定稿' : `流程页已定稿，${questions.length} 个问题页`;
  return { ...s, status, note, questions, pillar: pillar?.[0] };
});

// ── 内容：示例、没核对 ──
const samples = live.filter(([, a]) => a.data.sample).map(([id]) => id);
const unreviewed = live.filter(([, a]) => !a.data.reviewed).map(([id]) => id);

// ── 还空着的地方 ──
const holes = grep(/待填|待定|待冬瓜确认|待办理|（占位）|先占位/).map((x) => ({ ...x, file: relative('.', x.file) }));

// ── 汇总 ──
const all = [...groups.flatMap((g) => g.items), ...flows];
const count = (s) => all.filter((x) => x.status === s).length;
const LABEL = { done: '完成', doing: '进行中', todo: '待做', wait: '等冬瓜' };
const ICON = { done: '✅', doing: '🔄', todo: '⬜', wait: '⏳' };
const waits = [...flows.filter((f) => f.status === 'wait').map((f) => ({ title: `流程第 ${f.step} 步「${f.name}」`, note: f.note })), ...groups.flatMap((g) => g.items.filter((i) => i.status === 'wait'))];

if (!quiet) {
  console.log(`\n建站进度：完成 ${count('done')} · 进行中 ${count('doing')} · 待做 ${count('todo')} · 等冬瓜 ${count('wait')}`);
  console.log('\n9 个流程页');
  for (const f of flows) console.log(`  ${ICON[f.status]} ${f.step} ${f.name}：${f.note}`);
  for (const g of groups) {
    console.log(`\n${g.name}`);
    for (const it of g.items) console.log(`  ${ICON[it.status]} ${it.title}${it.note ? `：${it.note}` : ''}`);
  }
  console.log(`\n还空着的地方（${holes.length} 处）`);
  for (const h of holes) console.log(`  ${h.file}:${h.line}  ${h.text.slice(0, 60)}`);
  console.log(`\n示例文章 ${samples.length} 篇：${samples.join('、') || '无'}`);
  console.log(`没核对过的文章 ${unreviewed.length} 篇：${unreviewed.join('、') || '无'}\n`);
}

// ── 生成本机导航页 ──
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const now = new Date();
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
const badge = (s) => `<span class="st st-${s}">${ICON[s]} ${LABEL[s]}</span>`;
const row = (it) => `<li class="row"><div class="t">${badge(it.status)}<span class="title">${esc(it.title)}</span>${it.owner ? `<span class="owner">${esc(it.owner)}</span>` : ''}${it.autoChecked ? '<span class="auto" title="由脚本自动检查">自动</span>' : ''}</div>${it.note ? `<p class="note">${esc(it.note)}</p>` : ''}</li>`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>冬瓜站建站进度</title>
<meta name="description" content="冬瓜 AI 独立开发实战站的建站总账：9 个流程页、各类页面、SEO 和上线事项做到哪了，哪些在等冬瓜，全站还空着的地方。由 vibe-to-ship 的 plan/site-plan.yaml 和代码自动检查生成。">
<meta name="launchpad-group" content="AI 开发培训">
<style>
:root{--bg:#f7f6f2;--surface:#fff;--ink:#1d1f1c;--muted:#6b6f68;--line:#e3e1da;--accent:#2f6f4f;--accent-soft:#e6f0ea;--warm:#b4622a;--warm-soft:#f8ebe0;--blue:#2d5f9a;--blue-soft:#e5eef8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151714;--surface:#1e211d;--ink:#e9ebe6;--muted:#9aa096;--line:#30342e;--accent:#6fbf8f;--accent-soft:#1f3328;--warm:#e39a62;--warm-soft:#3a2a1e;--blue:#8ab4e8;--blue-soft:#1d2a3a}}
:root[data-theme="dark"]{--bg:#151714;--surface:#1e211d;--ink:#e9ebe6;--muted:#9aa096;--line:#30342e;--accent:#6fbf8f;--accent-soft:#1f3328;--warm:#e39a62;--warm-soft:#3a2a1e;--blue:#8ab4e8;--blue-soft:#1d2a3a}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif}
.wrap{max-width:980px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:28px;letter-spacing:-.3px}
h2{font-size:19px;margin:36px 0 10px}
.sub{color:var(--muted);font-size:14px;margin-top:4px}
code{font:12.5px ui-monospace,Menlo,monospace}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 16px;min-width:110px}
.stat b{font-size:24px;display:block;line-height:1.2}
.stat span{font-size:12.5px;color:var(--muted)}
.stat.wait b{color:var(--warm)}
.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.box.warm{border-color:color-mix(in srgb,var(--warm) 40%,var(--line))}
ul{list-style:none}
.row{padding:10px 16px;border-bottom:1px solid var(--line)}
.row:last-child{border-bottom:0}
.t{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.title{font-weight:600}
.note{font-size:13.5px;color:var(--muted);margin-top:2px}
.owner,.auto{font-size:11.5px;border:1px solid var(--line);border-radius:6px;padding:0 6px;color:var(--muted)}
.auto{border-style:dashed}
.st{font-size:12px;font-weight:700;border-radius:999px;padding:1px 9px;white-space:nowrap}
.st-done{background:var(--accent-soft);color:var(--accent)}
.st-doing{background:var(--blue-soft);color:var(--blue)}
.st-todo{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.st-wait{background:var(--warm-soft);color:var(--warm)}
.flows{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.flow{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.flow h3{font-size:15.5px;display:flex;gap:8px;align-items:center}
.flow .no{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;border:2px solid var(--accent);color:var(--accent);flex:none}
.flow .note{margin-top:6px}
.holes li{padding:7px 16px;border-bottom:1px solid var(--line);font-size:13.5px}
.holes li:last-child{border-bottom:0}
.holes code{color:var(--muted);margin-right:8px}
footer{margin-top:40px;font-size:12.5px;color:var(--muted)}
</style>
</head>
<body>
<div class="wrap">
  <h1>冬瓜站建站进度</h1>
  <p class="sub">生成于 ${stamp}。来自 vibe-to-ship 的 <code>plan/site-plan.yaml</code>，标「自动」的由脚本检查代码得出。改清单后在项目里运行 <code>npm run status</code> 更新本页。</p>
  <div class="stats">
    <div class="stat"><b>${count('done')}</b><span>完成</span></div>
    <div class="stat"><b>${count('doing')}</b><span>进行中</span></div>
    <div class="stat"><b>${count('todo')}</b><span>待做</span></div>
    <div class="stat wait"><b>${count('wait')}</b><span>等冬瓜</span></div>
    <div class="stat"><b>${holes.length}</b><span>还空着的地方</span></div>
  </div>

  <h2>⏳ 等冬瓜（${waits.length}）</h2>
  <div class="box warm"><ul>${waits.map((w) => row({ ...w, status: 'wait' })).join('')}</ul></div>

  <h2>9 个流程页</h2>
  <div class="flows">${flows.map((f) => `<div class="flow"><h3><span class="no">${f.step}</span>${esc(f.name)}</h3><div class="t" style="margin-top:6px">${badge(f.status)}<code>/flow/${f.slug}/</code></div><p class="note">${esc(f.note)}</p></div>`).join('')}</div>

  ${groups.map((g) => `<h2>${esc(g.name)}</h2><div class="box"><ul>${g.items.map(row).join('')}</ul></div>`).join('')}

  <h2>还空着的地方（${holes.length}）</h2>
  <p class="sub" style="margin-bottom:10px">全站搜「待填」「待定」「待冬瓜确认」「待办理」「（占位）」，代码注释不算。</p>
  <div class="box"><ul class="holes">${holes.map((h) => `<li><code>${esc(h.file)}:${h.line}</code>${esc(h.text.slice(0, 90))}</li>`).join('') || '<li>没有了</li>'}</ul></div>

  <h2>文章</h2>
  <div class="box"><ul>
    ${row({ title: `示例文章 ${samples.length} 篇`, note: samples.join('、') || '无', status: samples.length ? 'todo' : 'done' })}
    ${row({ title: `没核对过的文章 ${unreviewed.length} 篇`, note: unreviewed.join('、') || '无', status: unreviewed.length ? 'todo' : 'done' })}
  </ul></div>

  <footer>相关页面：冬瓜站选题地图、冬瓜站问法对照（同在「AI 开发培训」分类）。</footer>
</div>
</body>
</html>
`;
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
if (!quiet) console.log(`进度页已生成：${OUT}`);
