// 把选题地图生成一个可浏览的 HTML 页面（给自己看，不发布到网站）
// 用法：npm run plan:page              默认写到 ~/launchpad/pages/aidev-topic-map.html
//       npm run plan:page -- <输出路径>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { ROADMAP, PLATFORMS, TOPICS } from '../src/data/site.ts';
import { loadTopicMap, MAP } from './lib/topic-map.mjs';

const out = resolve(process.argv[2] ?? `${homedir()}/launchpad/pages/aidev-topic-map.html`);
const DEV = 'http://localhost:4321';

const { map, merged } = loadTopicMap();
// 需求分（联想词，scripts/research/match.mjs 算出）和搜索量（关键词工具导入，scripts/research/import-volume.mjs）
const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const demand = readJson('plan/research/demand.json')?.demand ?? {};
const volume = readJson('plan/research/volume.json')?.nodes ?? {};
const hasVolume = Object.keys(volume).length > 0;
const volumeAll = readJson('plan/research/volume.json');
const metric = volumeAll?.metric ?? '搜索量';
const vtag = (v) => (v == null ? '' : `<em>${v}</em>`);
const byId = new Map(merged.map((n) => [n.id, n]));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const platformName = (s) => PLATFORMS.find((p) => p.slug === s)?.name ?? s;
const topicName = (s) => TOPICS.find((t) => t.slug === s)?.name ?? s;
const STATUS = { published: '已发布', draft: '草稿', planned: '计划' };

const published = merged.filter((n) => n.status === 'published').length;
const p1Todo = merged.filter((n) => n.priority === 'P1' && n.status !== 'published').length;
const now = new Date();
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

const chip = (n) =>
  `<a class="node-chip s-${n.status} ${n.priority === 'P1' ? 'p1' : ''}" href="#${esc(n.id)}" title="${esc(n.intent)}${demand[n.id] ? ` · 需求分 ${demand[n.id].score}` : ''}${volume[n.id] ? ` · ${metric} ${volume[n.id].volume}` : ''}">${esc(n.keyword)}</a>`;

const matrix = `
<div class="table-wrap"><table class="matrix">
  <thead><tr><th></th>${PLATFORMS.map((p) => `<th>${p.icon} ${esc(p.name)}</th>`).join('')}</tr></thead>
  <tbody>
  ${ROADMAP.map((s) => `<tr><th>${s.step} ${esc(s.name)}</th>${PLATFORMS.map((p) => {
    const cell = merged.filter((n) => n.stage === s.slug && n.platforms.includes(p.slug));
    const done = cell.filter((n) => n.status === 'published').length;
    return `<td>${cell.length ? `<div class="count">${done} / ${cell.length}</div>${cell.map(chip).join('')}` : '<span class="muted">—</span>'}</td>`;
  }).join('')}</tr>`).join('')}
  </tbody>
</table></div>`;

const card = (n) => {
  const links = n.links.map((to) => byId.get(to)).filter(Boolean);
  return `
  <article class="card" id="${esc(n.id)}" data-platforms="${n.platforms.join(' ')}" data-priority="${n.priority}" data-status="${n.status}" data-demand="${demand[n.id]?.score ?? 0}" data-volume="${volume[n.id]?.volume ?? -1}">
    <div class="card-top">
      <h3>${esc(n.keyword)}</h3>
      <span class="badge pri-${n.priority}">${n.priority}</span>
      <span class="badge st-${n.status}">${STATUS[n.status]}</span>
    </div>
    ${n.title ? `<p class="title">《${esc(n.title)}》${n.status === 'published' ? ` <a href="${DEV}/articles/${esc(n.id)}/" target="_blank">打开 ↗</a>` : ''}</p>` : ''}
    <p class="intent">${esc(n.intent)}</p>
    <div class="signal">
      <span class="dm ${demand[n.id]?.score ? '' : 'zero'}" title="${esc((demand[n.id]?.top ?? []).join(' / ') || '没有联想词命中')}">需求分 <b>${demand[n.id]?.score ?? 0}</b></span>
      ${volume[n.id] ? `<span class="vol" title="文章主词 ${volume[n.id].keyword ?? '无数据'}">${metric} <b>${volume[n.id].volume}</b><small>（${volume[n.id].queried}/${volume[n.id].total} 个词有数据）</small></span>` : hasVolume ? `<span class="vol muted">${metric} 未查</span>` : ''}
    </div>
    ${n.covers.length ? `<div class="covers">${n.covers.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
    <div class="meta">
      <code>${esc(n.id)}</code>
      <span>${n.platforms.map(platformName).join(' / ')}</span>
      ${n.topics.map((t) => `<span>#${esc(topicName(t))}</span>`).join('')}
    </div>
    ${links.length ? `<div class="links">链到 → ${links.map((l) => `<a href="#${esc(l.id)}">${esc(l.keyword)}</a>`).join('')}</div>` : ''}
  </article>`;
};

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>冬瓜站选题地图</title>
<meta name="description" content="冬瓜 AI 独立开发实战站的内容框架：站点主词、五步路线 × 产品形态的类目词、${merged.length} 个选题节点及其长尾问法和内链。由 vibe-to-ship 的 ${MAP} 生成。">
<meta name="launchpad-group" content="AI 开发培训">
<style>
:root{--bg:#f7f6f2;--surface:#fff;--ink:#1d1f1c;--muted:#6b6f68;--line:#e3e1da;--accent:#2f6f4f;--accent-soft:#e6f0ea;--warm:#b4622a;--warm-soft:#f8ebe0;--draft:#7a5cc2;--draft-soft:#eee8fa}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151714;--surface:#1e211d;--ink:#e9ebe6;--muted:#9aa096;--line:#30342e;--accent:#6fbf8f;--accent-soft:#1f3328;--warm:#e39a62;--warm-soft:#3a2a1e;--draft:#b39ce8;--draft-soft:#2c2540}}
:root[data-theme="dark"]{--bg:#151714;--surface:#1e211d;--ink:#e9ebe6;--muted:#9aa096;--line:#30342e;--accent:#6fbf8f;--accent-soft:#1f3328;--warm:#e39a62;--warm-soft:#3a2a1e;--draft:#b39ce8;--draft-soft:#2c2540}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1180px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:28px;letter-spacing:-.3px}
h2{font-size:20px;margin:40px 0 14px}
.sub{color:var(--muted);margin-top:4px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 16px}
.stat b{font-size:22px;display:block;line-height:1.2}
.stat span{font-size:12.5px;color:var(--muted)}
.layers{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.layer{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.layer .n{font-size:12px;color:var(--accent);font-weight:700}
.layer h3{font-size:15px;margin:2px 0 6px}
.layer p{font-size:13px;color:var(--muted)}
.layer .kw{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.kw span{font-size:12.5px;background:var(--accent-soft);color:var(--accent);border-radius:6px;padding:1px 8px}
.kw em{font-style:normal;font-weight:700;margin-left:6px;color:var(--ink)}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.matrix{border-collapse:collapse;width:100%;min-width:760px}
.matrix th,.matrix td{border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:10px;vertical-align:top;text-align:left}
.matrix thead th{background:var(--bg);font-size:14px}
.matrix tbody th{white-space:nowrap;font-size:14px;background:var(--bg)}
.matrix tr:last-child td,.matrix tr:last-child th{border-bottom:0}
.matrix td:last-child,.matrix th:last-child{border-right:0}
.count{font-size:12px;color:var(--muted);margin-bottom:6px}
.node-chip{display:block;font-size:13px;line-height:1.4;padding:4px 8px;margin-bottom:5px;border-radius:7px;border:1px solid var(--line);color:var(--ink)}
.node-chip:hover{border-color:var(--accent);text-decoration:none}
.node-chip.p1{font-weight:600}
.node-chip.s-published{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
.node-chip.s-draft{background:var(--draft-soft);border-color:transparent;color:var(--draft)}
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:var(--muted);margin-top:10px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;border:1px solid var(--line)}
.filters{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 14px;position:sticky;top:8px;z-index:2}
.filters label{font-size:13px;color:var(--muted)}
.filters select{font:inherit;font-size:13px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:7px;padding:3px 6px;margin-left:4px}
.filters .shown{margin-left:auto;font-size:13px;color:var(--muted)}
.stage-head{display:flex;align-items:baseline;gap:10px;margin:28px 0 10px}
.stage-head h3{font-size:18px}
.stage-head span{font-size:13px;color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px;scroll-margin-top:70px}
.card:target{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.card-top{display:flex;gap:6px;align-items:flex-start}
.card-top h3{font-size:16px;line-height:1.4;flex:1}
.badge{font-size:11.5px;font-weight:700;border-radius:6px;padding:1px 7px;white-space:nowrap}
.pri-P1{background:var(--warm-soft);color:var(--warm)}
.pri-P2,.pri-P3{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.st-published{background:var(--accent-soft);color:var(--accent)}
.st-draft{background:var(--draft-soft);color:var(--draft)}
.st-planned{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.title{font-size:13px;margin-top:4px}
.intent{font-size:13.5px;color:var(--muted);margin-top:6px}
.covers{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.covers span{font-size:12.5px;border:1px dashed var(--line);border-radius:6px;padding:0 7px}
.meta{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;color:var(--muted);margin-top:10px}
.meta code{font:12px ui-monospace,Menlo,monospace}
.signal{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--muted);margin-top:8px}
.signal b{color:var(--ink);font-size:14px}
.signal .zero b{color:var(--warm)}
.signal small{font-size:11.5px}
.links{font-size:12.5px;color:var(--muted);margin-top:6px}
.links a{margin-left:8px}
.muted{color:var(--muted)}
.hidden{display:none}
footer{margin-top:48px;font-size:12.5px;color:var(--muted)}
@media (max-width:760px){.layers{grid-template-columns:1fr 1fr}.cards{grid-template-columns:1fr}.filters .shown{margin-left:0}}
@media (max-width:460px){.layers{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <h1>冬瓜站选题地图</h1>
  <p class="sub">网站内容的施工图：先定框架，再往里填文章。生成于 ${stamp}，数据来自 vibe-to-ship/${MAP} 和已写的文章。</p>
  <div class="stats">
    <div class="stat"><b>${merged.length}</b><span>选题节点</span></div>
    <div class="stat"><b>${published}</b><span>已发布</span></div>
    <div class="stat"><b>${p1Todo}</b><span>P1 待写</span></div>
    <div class="stat"><b>${merged.reduce((s, n) => s + 1 + n.covers.length, 0)}</b><span>覆盖的关键词</span></div>
  </div>

  <h2>四层结构</h2>
  <div class="layers">
    <div class="layer"><div class="n">第 1 层 · 站点主词</div><h3>首页</h3><p>整站只有一个</p><div class="kw">${[map.site?.keyword, ...(map.site?.covers ?? [])].filter(Boolean).map((k) => `<span>${esc(k)}${vtag(volumeAll?.site?.[k])}</span>`).join('')}</div></div>
    <div class="layer"><div class="n">第 2 层 · 类目词</div><h3>阶段页 + 形态页</h3><p>五步路线 × 四种形态，各一个聚合页</p><div class="kw">${[...ROADMAP.map((s) => [`stages/${s.slug}`, s.keyword]), ...PLATFORMS.map((p) => [`platforms/${p.slug}`, p.keyword])].map(([id, k]) => `<span>${esc(k)}${vtag(volumeAll?.hubs?.[id]?.volume)}</span>`).join('')}</div></div>
    <div class="layer"><div class="n">第 3 层 · 问题簇</div><h3>文章</h3><p>一个搜索意图 = 一篇文章，标题即文章主词。下方每张卡片是一个节点。</p></div>
    <div class="layer"><div class="n">第 4 层 · 长尾问法</div><h3>小节与常见问题</h3><p>同一意图的其他说法，写进文章的小节标题和文末常见问题，不另写一篇。卡片里虚线框的就是。</p></div>
  </div>

  <h2>阶段 × 形态覆盖</h2>
  ${matrix}
  <div class="legend"><span><i style="background:var(--accent-soft)"></i>已发布</span><span><i style="background:var(--draft-soft)"></i>草稿</span><span><i></i>计划</span><span><b>加粗</b> = P1</span><span>格子里的数字：已发布 / 计划总数（适用多种形态的选题会在多个格子里出现）</span></div>

  <h2>全部选题</h2>
  <div class="filters">
    <label>形态<select id="f-platform"><option value="">全部</option>${PLATFORMS.map((p) => `<option value="${p.slug}">${esc(p.name)}</option>`).join('')}</select></label>
    <label>优先级<select id="f-priority"><option value="">全部</option><option>P1</option><option>P2</option><option>P3</option></select></label>
    <label>状态<select id="f-status"><option value="">全部</option><option value="planned">计划</option><option value="draft">草稿</option><option value="published">已发布</option></select></label>
    <label>排序<select id="f-sort"><option value="">优先级</option><option value="demand">需求分</option>${hasVolume ? `<option value="volume">${metric}</option>` : ''}</select></label>
    <span class="shown" id="shown"></span>
  </div>
  ${ROADMAP.map((s) => {
    const list = merged.filter((n) => n.stage === s.slug).sort((a, b) => a.priority.localeCompare(b.priority));
    return `<section class="stage" data-stage="${s.slug}"><div class="stage-head"><h3>${s.icon} ${s.step} · ${esc(s.name)}</h3><span>${esc(s.desc)}</span></div><div class="cards">${list.map(card).join('')}</div></section>`;
  }).join('')}

  <footer>需求分：联想词里和该节点足够像的问法条数，按出现在几个搜索引擎里加权，只用来比较相对大小（node scripts/research/match.mjs 重算）。搜索量：关键词工具导出后用 node scripts/research/import-volume.mjs 导入，站点主词和类目词各记一个数，文章按节点把文章主词和长尾加总（指标是 5118 长尾词数时取最大值，只看相对大小）。<br>改地图：编辑 vibe-to-ship/${MAP}，然后在项目里运行 <code>npm run check:keywords</code> 检查、<code>npm run plan:page</code> 重新生成本页。</footer>
</div>
<script>
const f = { platform: document.getElementById('f-platform'), priority: document.getElementById('f-priority'), status: document.getElementById('f-status'), sort: document.getElementById('f-sort') };
const cards = [...document.querySelectorAll('.card')];
cards.forEach((c, i) => (c.dataset.order = i));
function apply() {
  let shown = 0;
  for (const c of cards) {
    const ok = (!f.platform.value || c.dataset.platforms.split(' ').includes(f.platform.value))
      && (!f.priority.value || c.dataset.priority === f.priority.value)
      && (!f.status.value || c.dataset.status === f.status.value);
    c.classList.toggle('hidden', !ok);
    if (ok) shown++;
  }
  for (const s of document.querySelectorAll('.stage')) {
    const box = s.querySelector('.cards');
    const list = [...box.children];
    const key = f.sort.value;
    list.sort((a, b) => key ? Number(b.dataset[key]) - Number(a.dataset[key]) : Number(a.dataset.order) - Number(b.dataset.order));
    list.forEach((c) => box.appendChild(c));
    s.classList.toggle('hidden', !s.querySelector('.card:not(.hidden)'));
  }
  document.getElementById('shown').textContent = '显示 ' + shown + ' / ' + cards.length;
}
Object.values(f).forEach((el) => el.addEventListener('change', apply));
apply();
</script>
</body>
</html>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`选题地图页面已生成：${out}`);
