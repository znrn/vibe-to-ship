// 把问法研究结果生成对照页（给自己看，不发布）
// 数据：plan/research/matched.json（自动匹配）+ plan/research/proposals.yaml（人工整理的调整建议）
// 用法：node scripts/research/report-page.mjs [输出路径]
//       默认写到 ~/launchpad/pages/aidev-topic-research.html
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import { ROADMAP, PLATFORMS } from '../../src/data/site.ts';
import { loadTopicMap } from '../lib/topic-map.mjs';

const out = resolve(process.argv[2] ?? `${homedir()}/launchpad/pages/aidev-topic-research.html`);
const matched = JSON.parse(readFileSync('plan/research/matched.json', 'utf8'));
const proposals = existsSync('plan/research/proposals.yaml') ? parse(readFileSync('plan/research/proposals.yaml', 'utf8')) : {};
const raw = JSON.parse(readFileSync('plan/research/raw.json', 'utf8'));
const { merged } = loadTopicMap();
const byId = new Map(merged.map((n) => [n.id, n]));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const stageName = (s) => ROADMAP.find((x) => x.slug === s)?.name ?? s;
const platformNames = (ps) => (ps ?? []).map((p) => PLATFORMS.find((x) => x.slug === p)?.name ?? p).join(' / ');
const SRC = { baidu: '百度', bing: 'Bing', so360: '360', sogou: '搜狗', csdn: 'CSDN', juejin: '掘金', v2ex: 'V2EX', zhihu: '知乎', wxcommunity: '微信开放社区' };
const ENGINES = new Set(['baidu', 'bing', 'so360', 'sogou']);
const srcTags = (list) => list.map((s) => `<span class="src ${ENGINES.has(s) ? 'eng' : 'com'}">${SRC[s] ?? esc(s)}</span>`).join('');
const nodeLabel = (id) => (byId.get(id) ? `${esc(byId.get(id).keyword)} <code>${esc(id)}</code>` : `<code>${esc(id)}</code>`);

const bySource = {};
for (const x of matched) for (const s of x.sources) bySource[s] = (bySource[s] ?? 0) + 1;
const count = (k) => matched.filter((x) => x.kind === k).length;

const perNode = new Map(merged.map((n) => [n.id, []]));
for (const x of matched) if (x.node) perNode.get(x.node).push(x);

const sec = (title, sub, body) => `<section><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}${body}</section>`;
const evidence = (list) => (list?.length ? `<ul class="ev">${list.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : '');

const newNodes = (proposals.new_nodes ?? []).map((n) => `
  <div class="card add">
    <div class="top"><h3>${esc(n.keyword)}</h3><span class="badge pri-${esc(n.priority)}">${esc(n.priority)}</span></div>
    <p class="meta"><code>${esc(n.id)}</code> · 第 ${ROADMAP.find((s) => s.slug === n.stage)?.step ?? '?'} 步 ${esc(stageName(n.stage))} · ${esc(platformNames(n.platforms))}</p>
    <p class="intent">${esc(n.intent)}</p>
    ${n.covers?.length ? `<div class="chips">${n.covers.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
    ${n.why ? `<p class="why">${esc(n.why)}</p>` : ''}
    ${evidence(n.evidence)}
  </div>`).join('');

const addCovers = (proposals.add_covers ?? []).map((a) => `
  <tr><td>${nodeLabel(a.node)}</td><td><div class="chips">${a.terms.map((t) => `<span class="plus">${esc(t)}</span>`).join('')}</div>${a.why ? `<p class="why">${esc(a.why)}</p>` : ''}</td></tr>`).join('');

const changes = (proposals.changes ?? []).map((c) => `
  <tr><td>${nodeLabel(c.node)}</td><td><b>${esc(c.action)}</b>${c.to ? `：${esc(c.to)}` : ''}<p class="why">${esc(c.why)}</p>${evidence(c.evidence)}</td></tr>`).join('');

const nodeRows = merged.map((n) => {
  const list = perNode.get(n.id);
  const eng = list.filter((x) => x.sources.some((s) => ENGINES.has(s))).length;
  return `<details class="node"><summary><span class="k">${esc(n.keyword)}</span><span class="badge pri-${n.priority}">${n.priority}</span><span class="n ${eng === 0 ? 'zero' : ''}">联想词 ${eng} · 社区 ${list.length - eng}</span></summary>
    ${list.length ? `<ul class="qs">${list.slice(0, 60).map((x) => `<li><span class="kind k-${x.kind}">${x.kind === 'covered' ? '已覆盖' : '可补'}</span>${x.urls?.[0] ? `<a href="${esc(x.urls[0])}" target="_blank" rel="noopener">${esc(x.q)}</a>` : esc(x.q)}${srcTags(x.sources)}</li>`).join('')}</ul>` : '<p class="muted">没有匹配到问法</p>'}
  </details>`;
}).join('');

const unmatched = matched.filter((x) => x.kind === 'unmatched');
const unmatchedList = `<details class="node"><summary><span class="k">全部未匹配问法</span><span class="n">${unmatched.length} 条，按来源数排序</span></summary><ul class="qs">${unmatched.slice(0, 600).map((x) => `<li>${x.urls?.[0] ? `<a href="${esc(x.urls[0])}" target="_blank" rel="noopener">${esc(x.q)}</a>` : esc(x.q)}${srcTags(x.sources)}<span class="near">最近：${esc(x.nearestTerm)}</span></li>`).join('')}</ul></details>`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>冬瓜站问法对照</title>
<meta name="description" content="用百度、Bing、360、搜狗联想词和 CSDN、掘金、V2EX、知乎、微信开放社区的真实问法，对照冬瓜站选题地图：哪些已覆盖、哪些该补进长尾、哪些该新增或调整节点。">
<meta name="launchpad-group" content="AI 开发培训">
<style>
:root{--bg:#f7f6f2;--surface:#fff;--ink:#1d1f1c;--muted:#6b6f68;--line:#e3e1da;--accent:#2f6f4f;--accent-soft:#e6f0ea;--warm:#b4622a;--warm-soft:#f8ebe0;--blue:#2d5f9a;--blue-soft:#e5eef8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151714;--surface:#1e211d;--ink:#e9ebe6;--muted:#9aa096;--line:#30342e;--accent:#6fbf8f;--accent-soft:#1f3328;--warm:#e39a62;--warm-soft:#3a2a1e;--blue:#8ab4e8;--blue-soft:#1d2a3a}}
:root[data-theme="dark"]{--bg:#151714;--surface:#1e211d;--ink:#e9ebe6;--muted:#9aa096;--line:#30342e;--accent:#6fbf8f;--accent-soft:#1f3328;--warm:#e39a62;--warm-soft:#3a2a1e;--blue:#8ab4e8;--blue-soft:#1d2a3a}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1100px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:28px;letter-spacing:-.3px}
h2{font-size:20px;margin:40px 0 6px}
h3{font-size:16px;line-height:1.4}
.sub{color:var(--muted);font-size:14px;margin-bottom:14px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 16px}
.stat b{font-size:22px;display:block;line-height:1.2}
.stat span{font-size:12.5px;color:var(--muted)}
.srcs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;font-size:13px;color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.card.add{border-left:4px solid var(--accent)}
.top{display:flex;gap:8px;align-items:flex-start}
.top h3{flex:1}
.meta{font-size:12.5px;color:var(--muted);margin-top:4px}
.intent{font-size:13.5px;margin-top:6px}
.why{font-size:13px;color:var(--muted);margin-top:6px}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.chips span{font-size:12.5px;border:1px dashed var(--line);border-radius:6px;padding:0 7px}
.chips span.plus{border:0;background:var(--accent-soft);color:var(--accent)}
.ev{margin-top:8px;padding-left:1.2em;font-size:12.5px;color:var(--muted)}
.badge{font-size:11.5px;font-weight:700;border-radius:6px;padding:1px 7px;white-space:nowrap}
.pri-P1{background:var(--warm-soft);color:var(--warm)}
.pri-P2,.pri-P3{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:640px}
td{border-bottom:1px solid var(--line);padding:10px 12px;vertical-align:top;font-size:14px}
tr:last-child td{border-bottom:0}
td:first-child{width:34%}
code{font:12px ui-monospace,Menlo,monospace;color:var(--muted)}
.node{background:var(--surface);border:1px solid var(--line);border-radius:10px;margin-bottom:6px}
.node summary{cursor:pointer;display:flex;gap:8px;align-items:center;padding:9px 14px;list-style:none}
.node summary::-webkit-details-marker{display:none}
.node .k{flex:1;font-weight:600;font-size:14.5px}
.node .n{font-size:12.5px;color:var(--muted)}
.node .n.zero{color:var(--warm)}
.qs{list-style:none;padding:0 14px 12px;display:grid;gap:3px;font-size:13.5px}
.qs li{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.kind{font-size:11px;border-radius:5px;padding:0 6px;line-height:18px}
.k-covered{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.k-addable{background:var(--accent-soft);color:var(--accent)}
.src{font-size:11px;border-radius:5px;padding:0 5px;line-height:17px}
.src.eng{background:var(--blue-soft);color:var(--blue)}
.src.com{background:var(--warm-soft);color:var(--warm)}
.near{font-size:11.5px;color:var(--muted)}
.muted{color:var(--muted);font-size:13px;padding:0 14px 12px}
footer{margin-top:48px;font-size:12.5px;color:var(--muted)}
@media (max-width:600px){.cards{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <h1>冬瓜站问法对照</h1>
  <p class="sub">用真实问法校准选题地图。采集于 ${esc(raw.collected?.slice(0, 10))}，自动匹配后人工整理，建议是否已应用见「结论」。</p>
  <div class="stats">
    <div class="stat"><b>${matched.length}</b><span>去重后的问法</span></div>
    <div class="stat"><b>${count('covered')}</b><span>已被地图覆盖</span></div>
    <div class="stat"><b>${count('addable')}</b><span>属于已有节点但没写进长尾</span></div>
    <div class="stat"><b>${count('unmatched')}</b><span>对不上任何节点</span></div>
    <div class="stat"><b>${(proposals.new_nodes ?? []).length}</b><span>建议新增节点</span></div>
  </div>
  <div class="srcs">来源：${Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${SRC[s] ?? esc(s)} ${n}`).join(' · ')}</div>

  ${proposals.summary ? sec('结论', '', `<div class="card">${proposals.summary.split('\n').filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`) : ''}
  ${newNodes ? sec('建议新增的节点', '地图里没有、但真实问法里反复出现的意图。', `<div class="cards">${newNodes}</div>`) : ''}
  ${changes ? sec('建议调整的节点', '改主词、合并、拆分、调优先级。', `<div class="table-wrap"><table>${changes}</table></div>`) : ''}
  ${addCovers ? sec('建议补进长尾的问法', '属于已有节点，写进 covers，并在文章的小节或常见问题里回答。', `<div class="table-wrap"><table>${addCovers}</table></div>`) : ''}
  ${sec('每个节点命中的问法', '自动匹配结果。橙色数字 = 没有任何搜索联想词命中，可能是说法不对或需求小。', nodeRows)}
  ${sec('未匹配的问法', '自动匹配对不上的原始问法，人工整理建议时参考。', unmatchedList)}

  <footer>重新采集：node scripts/research/collect.mjs → node scripts/research/match.mjs → node scripts/research/report-page.mjs。建议写在 plan/research/proposals.yaml。</footer>
</div>
</body>
</html>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`问法对照页已生成：${out}`);
