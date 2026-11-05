// 分发页：~/launchpad/pages/aidev-seo-distribute.html。每篇文章四个平台的稿子：一键复制、打开发布页预填、推公众号草稿箱、标记已发；
// 底部是外链：谁提到了本站、候选站点和私信草稿。按钮走 launchpad 的 /api/seo/action。
import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readJson, DATA, TODAY } from './lib.mjs';

const PAGE = join(homedir(), 'launchpad', 'pages', 'aidev-seo-distribute.html');
const dist = readJson(`${DATA}/distribution.json`, { articles: {} });
const outreach = readJson(`${DATA}/outreach.json`, {});
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const P = [['zhihu', '知乎', '回答一个问题'], ['xiaohongshu', '小红书', '正文不能放链接，链接在评论区文案里'], ['v2ex', 'V2EX', '经验分享帖，只在最后放一条链接'], ['wechat', '公众号', '可直接推进草稿箱']];
const textOf = (p, k) => k === 'zhihu' ? `${p.question}\n\n${p.body}` : k === 'xiaohongshu' ? `${p.title}\n\n${p.body}\n\n${(p.tags ?? []).map((t) => '#' + t).join(' ')}` : k === 'v2ex' ? `${p.title}\n\n${p.body}` : `${p.title}\n\n${p.digest}`;
const entries = Object.entries(dist.articles).sort((a, b) => (b[1].generatedAt ?? '').localeCompare(a[1].generatedAt ?? ''));

const artHtml = entries.map(([id, a]) => `<section class="card">
  <div class="head"><div><h2>${esc(a.title)}</h2><p class="muted">${esc(a.date)} 发布 · 分发稿 ${esc(a.generatedAt)} 生成 · <a href="${esc(a.url)}" target="_blank" rel="noopener">原文 ↗</a></p></div><button class="btn small" data-act="distribute" data-id="${esc(id)}">重新生成</button></div>
  <div class="tabs">${P.map(([k, name], i) => `<button class="tab${i === 0 ? ' on' : ''}" data-tab="${id}-${k}">${name}${a.posted?.[k] ? ' ✓' : ''}</button>`).join('')}</div>
  ${P.map(([k, name, hint], i) => { const p = a.platforms?.[k]; if (!p) return ''; return `<div class="pane${i === 0 ? ' on' : ''}" id="${esc(id)}-${k}">
    <p class="hint">${esc(hint)}${a.posted?.[k] ? ` · <b class="ok">已发 ${esc(a.posted[k])}</b>` : ''}${k === 'wechat' && a.wechatDraft ? ` · <b class="ok">已进草稿箱 ${esc(a.wechatDraft.at)}</b>` : ''}</p>
    <h3>${esc(p.question ?? p.title)}</h3>
    ${k === 'wechat' ? `<p class="digest">${esc(p.digest)}</p><div class="html">${p.html}</div>` : `<pre>${esc(p.body)}</pre>`}
    ${k === 'xiaohongshu' ? `<p class="tags">${(p.tags ?? []).map((t) => `#${esc(t)}`).join(' ')}</p><p class="hint">评论区：${esc(p.comment)}</p>` : ''}
    ${k === 'v2ex' ? `<p class="hint">建议节点：${esc(p.node)}</p>` : ''}
    <p class="link">链接：<code>${esc(p.link)}</code></p>
    <div class="actions">
      <button class="btn primary" data-copy="${esc(textOf(p, k) + (k === 'wechat' ? '' : '\n\n' + (k === 'xiaohongshu' ? '' : p.link)))}">复制全文</button>
      ${k === 'xiaohongshu' ? `<button class="btn" data-copy="${esc(p.comment)}">复制评论区文案</button>` : ''}
      ${k === 'wechat' ? `<button class="btn" data-copy-html="${esc(p.html)}">复制正文 HTML</button><button class="btn" data-act="wechat-draft" data-id="${esc(id)}">推进公众号草稿箱</button>` : `<button class="btn" data-act="prefill" data-id="${esc(id)}" data-platform="${k}">在 Ego 打开发布页并预填</button>`}
      <button class="btn" data-act="posted" data-id="${esc(id)}" data-platform="${k}">${a.posted?.[k] ? '取消已发' : '标记已发'}</button>
    </div>
  </div>`; }).join('')}
</section>`).join('');

const m = outreach.mentions ?? [], c = outreach.candidates ?? [];
const outHtml = `<section class="card" id="outreach"><h2>外链 <span>${outreach.date ? `${outreach.date} 扫描` : '还没扫描'} · 每月 1 号自动</span> <button class="btn small" data-act="outreach" data-id="">现在扫描</button></h2>
  <p class="section-title">谁提到了本站（${m.length}）</p>
  ${m.length ? `<ul class="list">${m.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title || x.url)}</a> <span class="st ${x.linked ? 'ok' : x.linked === false ? 'warn' : ''}">${x.linked ? '带链接' : x.linked === false ? '没带链接' : '没查到'}</span></li>`).join('')}</ul>` : '<p class="muted">必应上还搜不到提到本站的页面</p>'}
  <p class="section-title">候选和私信草稿（${c.length}）· 候选在 plan/seo/outreach-seeds.txt 里加</p>
  ${c.length ? c.map((x) => `<div class="cand"><b>${esc(x.site)}</b> <span class="muted">${esc(x.why)}${x.contact ? ' · ' + esc(x.contact) : ''}</span><pre>${esc(x.draft)}</pre><button class="btn small" data-copy="${esc(x.draft)}">复制</button></div>`).join('') : '<p class="muted">没有候选。在 plan/seo/outreach-seeds.txt 加几行「站点 | 为什么 | 联系方式」，下次扫描会写好私信草稿。</p>'}
</section>`;

const { shell } = await import('./ui.mjs');
const style = `
  .head { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:8px; } .head h2 { font-size:17px; font-weight:800; margin:0; }
  .tabs { display:flex; gap:4px; border-bottom:1px solid var(--line); margin-bottom:12px; }
  .tab { border:0; background:none; padding:8px 14px; font-weight:700; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; }
  .tab.on { color:var(--accent); border-bottom-color:var(--accent); }
  .pane { display:none; } .pane.on { display:block; } .pane h3 { font-size:16px; margin:4px 0 8px; }
  pre { white-space:pre-wrap; font:inherit; font-size:14px; background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:12px 14px; max-height:420px; overflow:auto; margin:0; }
  .html { border:1px solid var(--line); border-radius:10px; padding:12px 16px; max-height:420px; overflow:auto; font-size:14px; } .html h2 { font-size:16px; margin:12px 0 4px; } .html p { margin:6px 0; } .html ul { margin:6px 0 6px 20px; }
  .digest { color:#475569; font-size:13.5px; margin:0 0 8px; }
  .hint { font-size:12.5px; color:var(--muted); margin:4px 0; } .ok { color:var(--green); }
  .tags { color:var(--blue); font-size:13px; margin:6px 0 0; } .link { font-size:12.5px; color:var(--muted); margin:6px 0 0; } code { background:#f1f5f9; border-radius:5px; padding:1px 6px; }
  .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .list { list-style:none; margin:0; padding:0; } .list li { padding:5px 0; border-top:1px dashed var(--line); font-size:14px; }
  .cand { border-top:1px dashed var(--line); padding:8px 0; } .cand pre { margin:6px 0; max-height:160px; }
  .empty { color:var(--muted); padding:24px; text-align:center; border:1px dashed var(--line); border-radius:12px; margin-bottom:16px; background:var(--surface); }
`;
const script = `
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { const card = t.closest('.card'); card.querySelectorAll('.tab').forEach((x) => x.classList.remove('on')); card.querySelectorAll('.pane').forEach((x) => x.classList.remove('on')); t.classList.add('on'); document.getElementById(t.dataset.tab)?.classList.add('on'); }));
  document.addEventListener('click', async (e) => {
    const c = e.target.closest('button[data-copy], button[data-copy-html]');
    if (c) { const v = c.dataset.copy ?? c.dataset.copyHtml; try { if (c.dataset.copyHtml) { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([v], { type: 'text/html' }), 'text/plain': new Blob([v], { type: 'text/plain' }) })]); } else await navigator.clipboard.writeText(v); showMsg('已复制'); } catch { showMsg('复制失败，手动选中复制'); } return; }
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'distribute' && !confirm(b.dataset.id ? '重新生成这篇的分发稿？' : '给近 7 天发布的文章生成分发稿？（后台跑几分钟）')) return;
    document.querySelectorAll('button[data-act]').forEach((x) => (x.disabled = true));
    showMsg({ distribute: '后台生成中，几分钟后刷新', prefill: '打开 Ego 浏览器并预填…', 'wechat-draft': '推进公众号草稿箱…', posted: '记录中…', outreach: '后台扫描中，几分钟后刷新' }[act], true);
    try {
      const r = await fetch('/api/seo/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: act, id: b.dataset.id ?? '', note: b.dataset.platform ?? '' }) });
      const j = await r.json().catch(() => ({}));
      showMsg((j.ok ? '' : '失败：') + (j.output || j.error || r.status), true);
      if (['posted', 'wechat-draft'].includes(act)) setTimeout(() => location.reload(), 1200); else document.querySelectorAll('button[data-act]').forEach((x) => (x.disabled = false));
    } catch (err) { showMsg('请求失败：' + err.message, true); document.querySelectorAll('button[data-act]').forEach((x) => (x.disabled = false)); }
  });
`;
const pending = entries.filter(([, a]) => a.platforms && Object.keys(a.platforms).some((p) => !a.posted?.[p])).length;
const html = shell({
  title: '冬瓜站 SEO 分发台',
  description: 'eryx.cn 文章的四平台分发稿：知乎、小红书、V2EX、公众号，一键复制、预填发布页、推公众号草稿箱；外链提及和候选。',
  crumb: ['冬瓜站 SEO', '分发台'],
  headline: pending ? `${pending} 篇稿子等你发。` : entries.length ? '都发完了。' : '还没有分发稿。',
  sub: '分发只到预填为止，发布你自己点；不自动发帖、不批量私信。每条稿子带 ?from= 参数，日报「分发」栏按渠道算来人。',
  active: 'distribute', page: 'distribute',
  actions: `<button class="btn small" data-act="distribute" data-id="">给近 7 天发布的文章生成分发稿</button>`,
  body: `${artHtml || '<div class="empty">还没有分发稿。每周五流水线会给本周发布的文章自动生成；也可以点右上角现在生成。</div>'}${outHtml}`,
  style, script,
});
writeFileSync(PAGE, html);
console.log(`分发页：http://localhost:8088/pages/aidev-seo-distribute.html（${entries.length} 篇）`);
