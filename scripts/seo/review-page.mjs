// 审核页：把队列里的草稿渲染成 ~/launchpad/pages/aidev-seo-review.html，按钮走 launchpad 的 /api/seo/action。
// 每次写稿、审核动作、每日流水线后都会重新生成。
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { readJson, DATA, TODAY } from './lib.mjs';

const QUEUE = `${DATA}/queue.json`;
const DIR = 'src/content/articles';
const PAGE = join(homedir(), 'launchpad', 'pages', 'aidev-seo-review.html');
const queue = readJson(QUEUE, []);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 够用的 markdown → html（标题、段落、列表、表格、粗体、链接、引用、代码）
function md(src) {
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/&lt;mark class=&quot;todo&quot;&gt;(.*?)&lt;\/mark&gt;/g, '<mark class="todo">$1</mark>').replace(/&lt;span class=&quot;role-tag ([a-z]+)&quot;&gt;(.*?)&lt;\/span&gt;/g, '<span class="role $1">$2</span>');
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre>${esc(buf.join('\n'))}</pre>`); continue; }
    if (/^#{1,4} /.test(l)) { const n = l.match(/^#+/)[0].length; out.push(`<h${n + 1}>${inline(l.replace(/^#+ /, ''))}</h${n + 1}>`); i++; continue; }
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]); const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim())); out.push(`<table><thead><tr>${cells(rows[0]).map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`); continue; }
    if (/^\s*[-*] /.test(l)) { const items = []; while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, '')); out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); continue; }
    if (/^\s*\d+\. /.test(l)) { const items = []; while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\. /, '')); out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`); continue; }
    if (/^> /.test(l)) { const buf = []; while (i < lines.length && /^> /.test(lines[i])) buf.push(lines[i++].slice(2)); out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue; }
    if (!l.trim()) { i++; continue; }
    const buf = [l]; i++; while (i < lines.length && lines[i].trim() && !/^(#|\||[-*] |\d+\. |> |```)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}
const fmOf = (text) => { const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/); return m ? { fm: parse(m[1]), body: m[2] } : null; };
const STATUS = { picked: ['已选题，等写', 'later'], drafting: ['写稿中', 'doing'], draft: ['待审核', 'warn'], rewrite: ['退回，待重写', 'warn'], failed: ['写稿失败', 'bad'], published: ['已发布', 'ok'], dropped: ['已放弃', 'skip'], proposed: ['建议新增选题', 'warn'], accepted: ['已采纳', 'ok'], ignored: ['已忽略', 'skip'] };
const badge = (s) => { const [t, c] = STATUS[s] ?? [s, '']; return `<span class="st ${c}">${t}</span>`; };

const drafts = queue.filter((q) => q.type === 'article' && q.status === 'draft');
const others = queue.filter((q) => q.type === 'article' && q.status !== 'draft').sort((a, b) => (b.pickedAt ?? '').localeCompare(a.pickedAt ?? ''));
const proposals = queue.filter((q) => q.type === 'proposal' && q.status === 'proposed');

const draftHtml = drafts.map((q) => {
  const file = `${DIR}/${q.id}.md`;
  const parsed = existsSync(file) ? fmOf(readFileSync(file, 'utf8')) : null;
  const fm = parsed?.fm ?? {};
  const c = q.checks ?? {};
  const chk = [
    [c.keywords?.ok, '撞词检查', (c.keywords?.notes ?? []).join('；')],
    [!c.banned?.length, 'AI 味词', (c.banned ?? []).join('、')],
    [!c.sources?.dead?.length && c.sources?.count > 0, `来源 ${c.sources?.count ?? 0} 条都能打开`, (c.sources?.dead ?? []).join('；')],
    [c.build?.ok, '构建通过', c.build?.note ?? ''],
  ];
  return `<section class="card draft" id="q-${esc(q.id)}">
    <div class="head"><div><div class="kw">${esc(q.keyword)} · 第 ${esc(fm.stage ?? q.stage)} 步 · ${esc((fm.platforms ?? []).join(' / '))}</div><h2>${esc(fm.title ?? q.title)}</h2><p class="desc">${esc(fm.description)}</p></div>${badge(q.status)}</div>
    <div class="meta">写于 ${esc(q.draftedAt)} · ${esc(q.minutes ?? '?')} 分钟 · 正文 ${esc(c.words ?? '?')} 字 · <b class="${c.todo ? 'warn' : ''}">待冬瓜确认 ${esc(c.todo ?? 0)} 处</b> · 选题理由：${esc(q.reason)}</div>
    <ul class="checks">${chk.map(([ok, t, note]) => `<li class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${esc(t)}${note ? `<small>${esc(note)}</small>` : ''}</li>`).join('')}</ul>
    <div class="answer"><b>先说结论</b><p>${esc(fm.answer)}</p>${fm.steps?.length ? `<ol>${fm.steps.map((s) => `<li>${typeof s === 'string' ? esc(s) : `<span class="role ${esc(s.who)}">${{ me: '你来做', ai: '交给 AI', check: '你来验收' }[s.who] ?? s.who}</span> ${esc(s.text)}`}</li>`).join('')}</ol>` : ''}</div>
    <details><summary>参考来源（${(fm.sources ?? []).length}）和常见问题（${(fm.faq ?? []).length}）</summary><ul class="src">${(fm.sources ?? []).map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <small>${esc(s.url)}</small></li>`).join('')}</ul><dl class="faq">${(fm.faq ?? []).map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('')}</dl></details>
    <details><summary>全文预览</summary><div class="prose">${parsed ? md(parsed.body) : '<p>读不到文件</p>'}</div><p class="muted">文件：${esc(file)}（可以直接在编辑器里改，改完再点通过）</p></details>
    <div class="actions">
      <button class="primary" data-act="approve" data-id="${esc(q.id)}">通过，发布上线</button>
      <button data-act="reject" data-id="${esc(q.id)}">退回重写（下面写意见）</button>
      <button class="danger" data-act="drop" data-id="${esc(q.id)}">放弃这篇</button>
      <textarea placeholder="退回意见：哪里不对、该怎么改。退回后 Claude 会按意见改。" data-note="${esc(q.id)}"></textarea>
    </div>
  </section>`;
}).join('');

const proposalHtml = proposals.length ? `<section class="card"><h2>建议新增选题 <span>来自有展现没点击、但地图上没有对应文章的词</span></h2><ul class="plist">${proposals.map((p) => `<li><b>${esc(p.word)}</b> <small>${esc(p.source)} · 展现 ${esc(p.impressions)}${p.rank ? ` · 排名 ${esc(p.rank)}` : ''}</small><span><button class="primary small" data-act="accept-proposal" data-id="${esc(p.id)}">采纳，建节点并写稿</button><button class="small" data-act="ignore-proposal" data-id="${esc(p.id)}">忽略</button></span></li>`).join('')}</ul></section>` : '';
const othersHtml = others.length ? `<section class="card"><h2>队列 <span>选题、写稿、发布记录</span></h2><table><thead><tr><th>文章</th><th>状态</th><th>日期</th><th>说明</th></tr></thead><tbody>${others.map((q) => `<tr><td><b>${esc(q.keyword)}</b><br><small>${esc(q.id)}${q.status === 'published' ? ` · <a href="https://eryx.cn/articles/${esc(q.id)}/" target="_blank" rel="noopener">看线上 ↗</a>` : ''}</small></td><td>${badge(q.status)}</td><td>${esc(q.publishedAt ?? q.draftedAt ?? q.pickedAt)}</td><td><small>${esc(q.error ?? q.note ?? q.reason ?? '')}</small></td></tr>`).join('')}</tbody></table></section>` : '';

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>冬瓜站 SEO 审核台</title>
<meta name="description" content="eryx.cn 自动写稿的审核队列：看结论、来源、检查结果和全文，一键通过发布或退回重写。" />
<meta name="launchpad-group" content="AI 开发培训" />
<style>
  :root { --bg:#f8fafc; --card:#fff; --line:#e2e8f0; --ink:#0f172a; --muted:#64748b; --green:#059669; --green-soft:#ecfdf5; --red:#b91c1c; --red-soft:#fef2f2; --amber:#b45309; --amber-soft:#fef3c7; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--ink); font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB",sans-serif; padding:24px 16px 80px; }
  .wrap { max-width:960px; margin:0 auto; }
  header { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:10px; margin-bottom:16px; }
  h1 { font-size:24px; font-weight:800; } h1 small { font-size:13px; color:var(--muted); font-weight:500; margin-left:10px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:20px 22px; margin-bottom:16px; }
  .card > h2 { font-size:16px; font-weight:800; margin-bottom:10px; } .card > h2 span { font-size:12px; color:var(--muted); font-weight:500; margin-left:8px; }
  .head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
  .head h2 { font-size:19px; font-weight:800; line-height:1.4; margin:2px 0 4px; }
  .kw { font-size:12.5px; color:var(--green); font-weight:700; } .desc { font-size:13.5px; color:#475569; }
  .meta { font-size:12.5px; color:var(--muted); margin:10px 0; } .meta .warn { color:var(--amber); }
  .checks { list-style:none; display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
  .checks li { font-size:12.5px; border-radius:8px; padding:3px 10px; background:var(--green-soft); color:var(--green); font-weight:600; }
  .checks li.bad { background:var(--red-soft); color:var(--red); } .checks li small { display:block; font-weight:400; }
  .answer { background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:12px 16px; margin-bottom:10px; }
  .answer b { font-size:12px; color:var(--green); } .answer p { margin:4px 0 6px; } .answer ol { margin-left:20px; font-size:14px; }
  .role { font-size:11px; font-weight:700; border-radius:999px; padding:0 7px; margin-right:4px; background:#eff6ff; color:#2563eb; } .role.me { background:#fef3c7; color:#b45309; } .role.check { background:#ecfdf5; color:#059669; }
  details { margin:8px 0; } summary { cursor:pointer; font-weight:700; font-size:14px; }
  .src, .faq { margin:8px 0 8px 18px; font-size:13.5px; } .src small { color:var(--muted); display:block; } .faq dt { font-weight:700; margin-top:6px; } .faq dd { color:#334155; }
  .prose { border:1px solid var(--line); border-radius:10px; padding:16px 20px; margin-top:8px; max-height:70vh; overflow:auto; font-size:14.5px; }
  .prose h2 { font-size:18px; margin:18px 0 6px; } .prose h3 { font-size:16px; margin:14px 0 4px; } .prose p { margin:6px 0; } .prose ul, .prose ol { margin:6px 0 6px 22px; }
  .prose table { border-collapse:collapse; margin:8px 0; font-size:13.5px; } .prose th, .prose td { border:1px solid var(--line); padding:4px 8px; text-align:left; }
  .prose blockquote { border-left:3px solid var(--line); padding-left:12px; color:#475569; } .prose pre { background:#f1f5f9; padding:10px; border-radius:8px; font-size:12.5px; overflow:auto; }
  mark.todo { background:var(--amber-soft); color:var(--amber); font-weight:700; padding:0 4px; }
  .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; align-items:flex-start; }
  button { font:inherit; font-size:13.5px; font-weight:700; border:1px solid var(--line); background:#fff; border-radius:9px; padding:8px 14px; cursor:pointer; }
  button.primary { background:var(--green); color:#fff; border-color:var(--green); } button.danger { color:var(--red); } button.small { padding:4px 10px; font-size:12.5px; }
  button:disabled { opacity:.5; cursor:wait; }
  textarea { flex-basis:100%; min-height:60px; border:1px solid var(--line); border-radius:9px; padding:8px 10px; font:inherit; font-size:13.5px; }
  .st { font-size:11px; font-weight:700; border-radius:999px; padding:2px 9px; white-space:nowrap; background:#f1f5f9; color:#64748b; }
  .st.ok { background:var(--green-soft); color:var(--green); } .st.warn { background:var(--amber-soft); color:var(--amber); } .st.bad { background:var(--red-soft); color:var(--red); } .st.doing { background:#eff6ff; color:#2563eb; }
  .plist { list-style:none; } .plist li { display:flex; justify-content:space-between; gap:10px; align-items:center; padding:8px 0; border-top:1px dashed var(--line); } .plist small { color:var(--muted); margin-left:6px; } .plist span { display:flex; gap:6px; }
  table { width:100%; border-collapse:collapse; font-size:13.5px; } th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; } th { color:var(--muted); font-size:12px; }
  .muted { color:var(--muted); font-size:12.5px; } .empty { color:var(--muted); padding:20px; text-align:center; border:1px dashed var(--line); border-radius:12px; }
  #msg { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; padding:10px 18px; border-radius:10px; font-size:13.5px; display:none; max-width:90vw; white-space:pre-wrap; }
</style></head>
<body><div class="wrap">
<header><h1>冬瓜站 SEO 审核台 <small>生成于 ${TODAY} ${new Date().toTimeString().slice(0, 5)} · 待审 ${drafts.length} 篇</small></h1>
<div><button data-act="write" data-id="">现在选题并写稿（后台跑，几分钟后刷新）</button> <a href="/pages/aidev-seo-console.html" style="font-size:13px;margin-left:10px">← 工作台</a></div></header>
${draftHtml || '<div class="empty">没有待审的草稿。每周一流水线会自动选题写稿；也可以点右上角现在写。</div>'}
${proposalHtml}
${othersHtml}
<p class="muted" style="margin-top:14px">通过 = 去掉 draft、构建、部署、线上巡检、推送百度和必应、提交 Git。退回 = Claude 按你的意见改一稿再回到这里。文件在项目的 src/content/articles/ 下，直接改也行。</p>
</div>
<div id="msg"></div>
<script>
  const msg = document.getElementById('msg');
  const show = (t, keep) => { msg.textContent = t; msg.style.display = 'block'; if (!keep) setTimeout(() => (msg.style.display = 'none'), 4000); };
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    const note = document.querySelector('textarea[data-note="' + id + '"]')?.value?.trim() ?? '';
    if (act === 'reject' && !note) return show('退回要写意见，不然 Claude 不知道改什么');
    if (act === 'approve' && !confirm('发布上线？会构建、部署并推送搜索引擎。')) return;
    if (act === 'drop' && !confirm('放弃这篇草稿？文件会删除。')) return;
    document.querySelectorAll('button').forEach((x) => (x.disabled = true));
    show({ approve: '发布中：构建、部署、线上巡检、推送…约 1～2 分钟', reject: '已退回，Claude 在后台改稿，几分钟后刷新这页', drop: '处理中…', write: '后台选题写稿中，几分钟后刷新这页', 'accept-proposal': '后台建节点并写稿，几分钟后刷新', 'ignore-proposal': '处理中…' }[act], true);
    try {
      const r = await fetch('/api/seo/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: act, id, note }) });
      const j = await r.json().catch(() => ({}));
      show((j.ok ? '完成：' : '失败：') + (j.output || j.error || r.status), true);
      if (j.ok && !['reject', 'write', 'accept-proposal'].includes(act)) setTimeout(() => location.reload(), 1500);
      else setTimeout(() => location.reload(), 2500);
    } catch (err) { show('请求失败：' + err.message, true); document.querySelectorAll('button').forEach((x) => (x.disabled = false)); }
  });
</script></body></html>`;
mkdirSync(join(homedir(), 'launchpad', 'pages'), { recursive: true });
writeFileSync(PAGE, html);
console.log(`审核页：http://localhost:8088/pages/aidev-seo-review.html（待审 ${drafts.length} 篇）`);
