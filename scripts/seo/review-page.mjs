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
  return `<section class="card draft" id="q-${esc(q.id)}" data-todo="${esc(c.todo ?? 0)}">
    <div class="head"><div><div class="kw">${esc(q.keyword)} · 第 ${esc(fm.stage ?? q.stage)} 步 · ${esc((fm.platforms ?? []).join(' / '))}</div><h2>${esc(fm.title ?? q.title)}</h2><p class="desc">${esc(fm.description)}</p></div>${badge(q.status)}</div>
    <div class="meta">写于 ${esc(q.draftedAt)} · ${esc(q.minutes ?? '?')} 分钟 · 正文 ${esc(c.words ?? '?')} 字 · <b class="${c.todo ? 'warn' : ''}">待冬瓜确认 ${esc(c.todo ?? 0)} 处</b> · 选题理由：${esc(q.reason)}</div>
    <ul class="checks">${chk.map(([ok, t, note]) => `<li class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${esc(t)}${note ? `<small>${esc(note)}</small>` : ''}</li>`).join('')}</ul>
    <div class="answer"><b>先说结论</b><p>${esc(fm.answer)}</p>${fm.steps?.length ? `<ol>${fm.steps.map((s) => `<li>${typeof s === 'string' ? esc(s) : `<span class="role ${esc(s.who)}">${{ me: '你来做', ai: '交给 AI', check: '你来验收' }[s.who] ?? s.who}</span> ${esc(s.text)}`}</li>`).join('')}</ol>` : ''}</div>
    <details><summary>参考来源（${(fm.sources ?? []).length}）和常见问题（${(fm.faq ?? []).length}）</summary><ul class="src">${(fm.sources ?? []).map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <small>${esc(s.url)}</small></li>`).join('')}</ul><dl class="faq">${(fm.faq ?? []).map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('')}</dl></details>
    <details><summary>全文预览</summary><div class="prose">${parsed ? md(parsed.body) : '<p>读不到文件</p>'}</div><p class="muted">文件：${esc(file)}（可以直接在编辑器里改，改完再点通过）</p></details>
    <div class="actions">
      <button class="btn primary" data-act="approve" data-id="${esc(q.id)}">${c.todo ? `先处理 ${c.todo} 处待确认再通过` : '通过，发布上线'}</button>
      <button class="btn" data-act="reject" data-id="${esc(q.id)}">退回重写（下面写意见）</button>
      <button class="btn danger" data-act="drop" data-id="${esc(q.id)}">放弃这篇</button>
      <textarea placeholder="退回意见：哪里不对、该怎么改。退回后 Claude 会按意见改。" data-note="${esc(q.id)}"></textarea>
    </div>
  </section>`;
}).join('');

const proposalHtml = proposals.length ? `<section class="card" id="proposals"><h2>建议新增选题 <span>来自有展现没点击、但地图上没有对应文章的词</span></h2><ul class="plist">${proposals.map((p) => `<li><b>${esc(p.word)}</b> <small>${esc(p.source)} · 展现 ${esc(p.impressions)}${p.rank ? ` · 排名 ${esc(p.rank)}` : ''}</small><span><button class="btn primary small" data-act="accept-proposal" data-id="${esc(p.id)}">采纳，建节点并写稿</button><button class="btn small" data-act="ignore-proposal" data-id="${esc(p.id)}">忽略</button></span></li>`).join('')}</ul></section>` : '';
const othersHtml = others.length ? `<section class="card"><h2>队列 <span>选题、写稿、发布记录</span></h2><table><thead><tr><th>文章</th><th>状态</th><th>日期</th><th>说明</th></tr></thead><tbody>${others.map((q) => `<tr><td><b>${esc(q.keyword)}</b><br><small>${esc(q.id)}${q.status === 'published' ? ` · <a href="https://eryx.cn/articles/${esc(q.id)}/" target="_blank" rel="noopener">看线上 ↗</a>` : ''}</small></td><td>${badge(q.status)}</td><td>${esc(q.publishedAt ?? q.draftedAt ?? q.pickedAt)}</td><td><small>${esc(q.error ?? q.note ?? q.reason ?? '')}</small></td></tr>`).join('')}</tbody></table></section>` : '';

const { shell } = await import('./ui.mjs');
const style = `
  .draft .head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
  .draft .head h2 { font-size:19px; font-weight:800; line-height:1.4; margin:2px 0 4px; }
  .kw { font-size:12.5px; color:var(--green); font-weight:700; } .desc { font-size:13.5px; color:#475569; margin:0; }
  .meta { font-size:12.5px; color:var(--muted); margin:10px 0; } .meta .warn { color:var(--amber); }
  .checks { list-style:none; display:flex; flex-wrap:wrap; gap:6px; margin:0 0 12px; padding:0; }
  .checks li { font-size:12.5px; border-radius:8px; padding:3px 10px; background:var(--green-bg); color:var(--green); font-weight:600; }
  .checks li.bad { background:var(--red-bg); color:var(--red); } .checks li small { display:block; font-weight:400; }
  .answer { background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:12px 16px; margin-bottom:10px; }
  .answer b { font-size:12px; color:var(--green); } .answer p { margin:4px 0 6px; } .answer ol { margin:0 0 0 20px; padding:0; font-size:14px; }
  .role { font-size:11px; font-weight:700; border-radius:999px; padding:0 7px; margin-right:4px; background:var(--blue-bg); color:var(--blue); } .role.me { background:var(--amber-bg); color:var(--amber); } .role.check { background:var(--green-bg); color:var(--green); }
  .draft details { margin:8px 0; } .draft summary { cursor:pointer; font-weight:700; font-size:14px; }
  .src, .faq { margin:8px 0 8px 18px; font-size:13.5px; padding:0; } .src small { color:var(--muted); display:block; } .faq dt { font-weight:700; margin-top:6px; } .faq dd { color:#334155; margin:0; }
  .prose { border:1px solid var(--line); border-radius:10px; padding:16px 20px; margin-top:8px; max-height:70vh; overflow:auto; font-size:14.5px; }
  .prose h2 { font-size:18px; margin:18px 0 6px; } .prose h3 { font-size:16px; margin:14px 0 4px; } .prose p { margin:6px 0; } .prose ul, .prose ol { margin:6px 0 6px 22px; }
  .prose table { border-collapse:collapse; margin:8px 0; font-size:13.5px; width:auto; } .prose th, .prose td { border:1px solid var(--line); padding:4px 8px; }
  .prose blockquote { border-left:3px solid var(--line); padding-left:12px; color:#475569; margin:8px 0; } .prose pre { background:#f1f5f9; padding:10px; border-radius:8px; font-size:12.5px; overflow:auto; }
  mark.todo { background:var(--amber-bg); color:var(--amber); font-weight:700; padding:0 4px; }
  .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; align-items:flex-start; }
  textarea { flex-basis:100%; min-height:60px; border:1px solid var(--line); border-radius:9px; padding:8px 10px; font-size:13.5px; }
  .plist { list-style:none; margin:0; padding:0; } .plist li { display:flex; justify-content:space-between; gap:10px; align-items:center; padding:8px 0; border-top:1px dashed var(--line); } .plist small { color:var(--muted); margin-left:6px; } .plist span { display:flex; gap:6px; }
  .empty { color:var(--muted); padding:24px; text-align:center; border:1px dashed var(--line); border-radius:12px; margin-bottom:16px; background:var(--surface); }
`;
const script = `
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    const note = document.querySelector('textarea[data-note="' + id + '"]')?.value?.trim() ?? '';
    if (act === 'reject' && !note) return showMsg('退回要写意见，不然 Claude 不知道改什么');
    if (act === 'approve') {
      const todo = Number(b.closest('.draft')?.dataset.todo ?? 0);
      if (todo && !/忽略待确认/.test(note)) return showMsg('还有 ' + todo + ' 处「待冬瓜确认」：先在文件里改成你的做法再通过；确实要带着发，在意见框写「忽略待确认」', true);
      if (!confirm('发布上线？会构建、部署并推送搜索引擎。')) return;
    }
    if (act === 'drop' && !confirm('放弃这篇草稿？文件会删除。')) return;
    document.querySelectorAll('button').forEach((x) => (x.disabled = true));
    showMsg({ approve: '发布中：构建、部署、线上巡检、推送…约 1～2 分钟', reject: '已退回，Claude 在后台改稿，几分钟后刷新这页', drop: '处理中…', write: '后台选题写稿中，几分钟后刷新这页', 'accept-proposal': '后台建节点并写稿，几分钟后刷新', 'ignore-proposal': '处理中…' }[act], true);
    try {
      const r = await fetch('/api/seo/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: act, id, note }) });
      const j = await r.json().catch(() => ({}));
      showMsg((j.ok ? '完成：' : '失败：') + (j.output || j.error || r.status), true);
      setTimeout(() => location.reload(), j.ok && !['reject', 'write', 'accept-proposal'].includes(act) ? 1500 : 2500);
    } catch (err) { showMsg('请求失败：' + err.message, true); document.querySelectorAll('button').forEach((x) => (x.disabled = false)); }
  });
`;
const html = shell({
  title: '冬瓜站 SEO 审核台',
  description: 'eryx.cn 自动写稿的审核队列：看结论、来源、检查结果和全文，一键通过发布或退回重写。',
  crumb: ['冬瓜站 SEO', '审核台'],
  headline: drafts.length ? `${drafts.length} 篇草稿等你审。` : proposals.length ? `${proposals.length} 条选题建议等你定。` : '没有待审的稿子。',
  sub: '通过 = 去 draft、构建、部署、线上巡检、推送百度和必应、提交 Git。退回 = 写意见，Claude 按意见改一稿再回来。文件在项目的 src/content/articles/ 下，直接改也行。',
  active: 'review', page: 'review',
  actions: `<button class="btn small" data-act="write" data-id="">现在选题并写稿</button>`,
  body: `${draftHtml || '<div class="empty">没有待审的草稿。每周一流水线会自动选题写稿；也可以点右上角现在写。</div>'}${proposalHtml}${othersHtml}`,
  style, script,
});
writeFileSync(PAGE, html);
console.log(`审核页：http://localhost:8088/pages/aidev-seo-review.html（待审 ${drafts.length} 篇）`);
