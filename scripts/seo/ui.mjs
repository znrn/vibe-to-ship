// 三个 SEO 页面（工作台、审核台、分发台）共用的外壳：深色侧栏 + 面包屑 + 大标题，感觉跟本机导航一路。
// 用法：shell({ title, crumb, headline, sub, active, nav, body, style, script })
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const readJson = (f) => { try { return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { return null; } };
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 侧栏上的计数：待审草稿、待发分发稿、异常、待办
export function navCounts() {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daily = readJson('plan/seo/daily/latest.json') ?? {};
  const queue = readJson('plan/seo/data/queue.json') ?? [];
  const dist = readJson('plan/seo/data/distribution.json')?.articles ?? {};
  const todos = readJson(`${homedir()}/launchpad/todos.json`) ?? [];
  return {
    drafts: queue.filter((q) => q.type === 'article' && q.status === 'draft').length,
    proposals: queue.filter((q) => q.type === 'proposal' && q.status === 'proposed').length,
    dist: Object.values(dist).filter((a) => a.platforms && Object.keys(a.platforms).some((p) => !a.posted?.[p])).length,
    issues: (daily.spider404 ?? 0) + (daily.deadSources ?? 0) + (daily.decline ?? 0) + (daily.liveProblems?.length ?? 0),
    opportunities: daily.opportunities ?? 0,
    // 今天的日常待办 + 一次性准备里没做完的（历史上没勾的日常不算，免得越积越多）
    todos: todos.filter((t) => !t.done && /冬瓜站 SEO/.test(t.project ?? '') && (t.created === today || !/^SEO 日常/.test(t.detail ?? ''))).length,
    date: daily.date ?? '',
  };
}

// 侧栏结构：group → items { id, name, href, count? }。工作台内的锚点用 #sec-xxx，别的页面用完整地址。
export function navGroups(c = navCounts(), page = 'console') {
  const C = (p) => (page === 'console' ? '' : '/pages/aidev-seo-console.html');
  return [
    { title: '每天', items: [
      { id: 'overview', name: '总览', href: `${C()}#sec-daily`, icon: 'home' },
      { id: 'today', name: '今天要做', href: `${C()}#sec-today`, icon: 'check', count: c.todos },
      { id: 'review', name: '审核台', href: '/pages/aidev-seo-review.html', icon: 'edit', count: c.drafts + c.proposals, warn: true },
      { id: 'distribute', name: '分发台', href: '/pages/aidev-seo-distribute.html', icon: 'send', count: c.dist },
    ] },
    { title: '数据', items: [
      { id: 'findings', name: '要处理的事', href: `${C()}#sec-findings`, icon: 'alert', count: c.issues, warn: true },
      { id: 'pages', name: '页面状态', href: `${C()}#sec-pages`, icon: 'list' },
      { id: 'check', name: '站内检查', href: `${C()}#sec-check`, icon: 'shield' },
      { id: 'kw', name: '关键词目标', href: `${C()}#sec-kw`, icon: 'target' },
      { id: 'bank', name: '关键词库', href: `${C()}#sec-bank`, icon: 'book' },
    ] },
    { title: '安排', items: [
      { id: 'week', name: '本周 / 每月', href: `${C()}#sec-week`, icon: 'calendar' },
      { id: 'log', name: '工作日志', href: `${C()}#sec-log`, icon: 'note' },
      { id: 'learn', name: '学习地图', href: `${C()}#sec-learn`, icon: 'map' },
    ] },
    { title: '后台', items: [
      { id: 'zz', name: '百度站长', href: 'https://ziyuan.baidu.com/', icon: 'ext', ext: true },
      { id: 'tongji', name: '百度统计', href: 'https://tongji.baidu.com/', icon: 'ext', ext: true },
      { id: 'bing', name: 'Bing 站长', href: 'https://www.bing.com/webmasters/', icon: 'ext', ext: true },
      { id: 'gsc', name: 'Search Console', href: 'https://search.google.com/search-console', icon: 'ext', ext: true },
      { id: 'site', name: 'eryx.cn', href: 'https://eryx.cn/', icon: 'ext', ext: true },
    ] },
  ];
}

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  alert: '<path d="M12 9v4m0 4h.01M10.3 3.9L2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  map: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z"/><path d="M8 2v16M16 6v16"/>',
  ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
};
const icon = (k) => `<svg class="icon" viewBox="0 0 24 24">${ICONS[k] ?? ICONS.list}</svg>`;

export const CSS = `
:root{color-scheme:light;--bg:#f6f7f9;--surface:#fff;--ink:#202936;--muted:#7b8493;--line:#e9edf2;--accent:#d96c43;--accent-soft:#fff0e8;--nav:#192431;--nav-ink:#eef3f9;--nav-muted:#92a0b2;--green:#38836c;--green-bg:#edf8f2;--amber:#b45309;--amber-bg:#fef3c7;--red:#b91c1c;--red-bg:#fef2f2;--blue:#2563eb;--blue-bg:#eff6ff;--shadow:0 4px 20px #25364a05}
*{box-sizing:border-box}html{scroll-padding-top:24px;scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif}
a{color:inherit;text-decoration:none}button,input,textarea{font:inherit}button{cursor:pointer}
.icon{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.app{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:100vh}
.side{background:var(--nav);color:var(--nav-ink);padding:18px 14px 20px;position:sticky;top:0;height:100vh;overflow:auto;display:flex;flex-direction:column;gap:4px}
.brand{display:flex;align-items:center;gap:10px;padding:4px 8px 14px}
.brand .logo{width:34px;height:34px;border-radius:10px;background:var(--accent);display:grid;place-items:center;color:#fff;font-weight:800;font-size:15px}
.brand b{display:block;font-size:15px;line-height:1.2}.brand small{color:var(--nav-muted);font-size:10.5px;letter-spacing:1.5px}
.group{margin-top:10px}.group h4{margin:0 0 4px 10px;font-size:10.5px;letter-spacing:1.2px;color:var(--nav-muted);font-weight:700;text-transform:uppercase}
.nav a{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;color:var(--nav-ink);font-size:13.5px;font-weight:600;opacity:.88}
.nav a:hover{background:#ffffff12;opacity:1}.nav a.active{background:#ffffff1c;opacity:1}
.nav a .n{margin-left:auto;font-size:11.5px;font-weight:700;color:var(--nav-muted)}.nav a .n.warn{color:#f6b26b}.nav a .icon{opacity:.8}
.side .foot{margin-top:auto;padding:12px 10px 0;font-size:11.5px;color:var(--nav-muted);line-height:1.5}.side .foot code{color:var(--nav-ink);background:#ffffff14;border-radius:5px;padding:0 5px;font-size:11px}
.main{padding:22px 32px 80px;min-width:0}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--muted);font-size:12.5px;margin-bottom:14px}.top .crumb b{color:var(--ink)}.top .right{display:flex;gap:8px;align-items:center}
.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:7px 13px;font-size:13px;font-weight:700;color:var(--ink)}
.btn:hover{border-color:var(--accent);color:var(--accent)}.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}.btn.primary:hover{opacity:.9;color:#fff}.btn.small{padding:4px 10px;font-size:12px}.btn.danger{color:var(--red)}.btn:disabled{opacity:.5;cursor:wait}
h1.hl{font-size:26px;margin:0 0 4px;font-weight:800;letter-spacing:-.3px}p.sub{margin:0 0 20px;color:var(--muted);font-size:13.5px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 22px;margin-bottom:16px;box-shadow:var(--shadow)}
.card>h2{font-size:16px;font-weight:800;margin:0 0 10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.card>h2 span{font-size:12px;color:var(--muted);font-weight:500}.card>h2 .right{margin-left:auto}
.grid2{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px}@media(max-width:960px){.grid2{grid-template-columns:1fr}.app{grid-template-columns:1fr}.side{position:static;height:auto}}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px;margin:4px 0 14px}
.tile{border-radius:12px;padding:12px 14px;background:#f8fafc;border:1px solid var(--line)}.tile b{display:block;font-size:24px;line-height:1.2;font-weight:800}.tile small{color:var(--muted);font-size:12px}
.tile.ok{background:var(--green-bg);border-color:transparent}.tile.ok b{color:var(--green)}.tile.warn{background:var(--amber-bg);border-color:transparent}.tile.warn b{color:var(--amber)}.tile.bad{background:var(--red-bg);border-color:transparent}.tile.bad b{color:var(--red)}.tile.accent{background:var(--accent-soft);border-color:transparent}.tile.accent b{color:var(--accent)}
.st{font-size:10.5px;font-weight:700;border-radius:999px;padding:1px 8px;background:#f1f5f9;color:#64748b;white-space:nowrap}.st.ok{background:var(--green-bg);color:var(--green)}.st.warn{background:var(--amber-bg);color:var(--amber)}.st.bad{background:var(--red-bg);color:var(--red)}.st.doing{background:var(--blue-bg);color:var(--blue)}.st.later,.st.skip{background:#f1f5f9;color:#94a3b8}
.section-title{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;margin:12px 0 4px}
.muted{color:var(--muted)}.how{font-size:12.5px;color:var(--muted);margin:6px 0 0}.how code,code.cmd{background:#f1f5f9;border-radius:5px;padding:1px 6px;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:600;font-size:12px}
.scroll{max-height:420px;overflow:auto;border:1px solid var(--line);border-radius:10px}.scroll th{position:sticky;top:0;background:#f8fafc}
.tasks{list-style:none;margin:0;padding:0}.task{padding:8px 0;border-bottom:1px dashed var(--line);display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}.task:last-child{border-bottom:0}
.task label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;flex:1}.task input{margin-top:5px;accent-color:var(--accent)}.task.done span{color:var(--muted);text-decoration:line-through}
.task .go{font-size:12px;color:var(--accent);font-weight:700;white-space:nowrap;margin-top:3px}.task code{font-size:12px;background:#f1f5f9;border-radius:5px;padding:1px 6px}
.issues{list-style:none;margin:4px 0 0;padding:0;font-size:13px;max-height:360px;overflow:auto}.issues li{padding:5px 8px;border-radius:6px;margin-bottom:4px;background:#f8fafc;color:#334155}.issues .e{background:var(--red-bg);color:var(--red)}.issues .w{background:var(--amber-bg);color:var(--amber)}
details.block{margin-top:8px}details.block summary{cursor:pointer;font-size:13px;font-weight:700}details.block summary .n{color:var(--muted);font-weight:500;margin-left:4px}
.bars{display:flex;align-items:flex-end;gap:4px;height:56px;margin:6px 0 20px}.bars div{flex:1;background:#cbd5e1;border-radius:3px 3px 0 0;min-height:2px;position:relative}.bars div.hi{background:var(--accent)}.bars div i{position:absolute;bottom:-18px;left:0;right:0;font-size:9px;color:#94a3b8;text-align:center;font-style:normal}
.trend2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.cal{display:flex;flex-direction:column;gap:6px}.day{display:flex;gap:12px;align-items:flex-start;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:12.5px}.day.today{border-color:var(--accent);background:var(--accent-soft)}.day b{flex:0 0 34px}.day p{margin:0;color:#475569;line-height:1.5}
.cycle{margin:0 0 4px 18px;padding:0;font-size:13px}.cycle li{margin-bottom:4px}
.log h4{font-size:13px;margin:10px 0 4px;color:var(--green)}.log li,.log p{font-size:13px;margin:0}.log li{margin-left:18px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}.chip{display:inline-flex;flex-direction:column;font-size:12.5px;font-weight:600;background:#f8fafc;border:1px solid var(--line);border-radius:8px;padding:4px 10px}.chip small{font-size:10px;color:#94a3b8;font-weight:600}.chip:hover{border-color:var(--accent)}
.kw-tools{display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:12.5px;margin:4px 0 8px}.kw-tools input[type=search]{flex:1;min-width:180px;border:1px solid var(--line);border-radius:8px;padding:6px 10px}
#kw-table td small{color:var(--muted)}#kw-table details{font-size:11.5px;color:var(--muted);margin-top:2px}#kw-table summary{cursor:pointer}.lt{display:inline-block;border:1px dashed var(--line);border-radius:6px;padding:0 6px;margin:2px 4px 0 0}tr.hide{display:none}
.mods{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(max-width:1100px){.mods{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.mods{grid-template-columns:1fr}}
.mod{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:#fbfcfd}.mod h3{font-size:14px;font-weight:800;margin:0 0 6px}.mod h3 small{display:block;font-size:12px;color:var(--muted);font-weight:500}.mod ul{list-style:none;margin:0;padding:0}.mod li{padding:6px 0;border-top:1px dashed var(--line);font-size:12.5px}.mod li label{cursor:pointer}.mod li input{accent-color:var(--accent);margin-right:4px}.mod li.learned b{color:var(--muted);text-decoration:line-through}.mod li p{color:#475569;line-height:1.55;margin:2px 0 0}.mod li em{font-style:normal;color:var(--green)}.mod li a{color:var(--blue);white-space:nowrap}
.tut-list{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;counter-reset:ch;margin:0;padding:0}@media(max-width:1100px){.tut-list{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.tut-list{grid-template-columns:1fr}}
.tut-list li{border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:12.5px;background:#fbfcfd;counter-increment:ch}.tut-list li::before{content:counter(ch,decimal-leading-zero);font-size:10px;font-weight:800;color:#94a3b8;margin-right:6px}.tut-list li>a{font-weight:700}.tut-list li p{color:#475569;line-height:1.5;margin:2px 0 0}
#msg{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--nav);color:#fff;padding:10px 18px;border-radius:10px;font-size:13.5px;display:none;max-width:80vw;white-space:pre-wrap;z-index:9}
`;

export function shell({ title, description = '', crumb = [], headline, sub = '', active = '', page = 'console', body, style = '', script = '', actions = '' }) {
  const c = navCounts();
  const groups = navGroups(c, page);
  const nav = groups.map((g) => `<div class="group"><h4>${esc(g.title)}</h4><div class="nav">${g.items.map((it) => `<a href="${esc(it.href)}"${it.ext ? ' target="_blank" rel="noopener"' : ''} class="${it.id === active ? 'active' : ''}" data-nav="${esc(it.id)}">${icon(it.icon)}<span>${esc(it.name)}</span>${it.count ? `<span class="n${it.warn ? ' warn' : ''}">${esc(it.count)}</span>` : ''}</a>`).join('')}</div></div>`).join('');
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toTimeString().slice(0, 5)}`;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="launchpad-group" content="AI 开发培训" />
<style>${CSS}${style}</style></head>
<body><div class="app">
<aside class="side">
  <a class="brand" href="/pages/aidev-seo-console.html"><span class="logo">瓜</span><span><b>冬瓜站 SEO</b><small>ERYX.CN · WORKBENCH</small></span></a>
  ${nav}
  <div class="foot">生成于 ${stamp}${c.date ? ` · 日报 ${esc(c.date)}` : ''}<br>每天 7:30 自动；手动 <code>npm run seo:daily</code><br><a href="/" style="color:var(--nav-ink)">← 本机导航</a></div>
</aside>
<main class="main">
  <div class="top"><div class="crumb">${crumb.map((x, i) => (i ? ' / ' : '') + (i === crumb.length - 1 ? `<b>${esc(x)}</b>` : esc(x))).join('')}</div><div class="right">${actions}</div></div>
  <h1 class="hl">${esc(headline)}</h1>
  <p class="sub">${sub}</p>
  ${body}
</main></div>
<div id="msg"></div>
<script>
  // 工作台内的锚点随滚动高亮
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  if (navLinks.length) {
    const secs = navLinks.map((a) => ({ a, el: document.querySelector(a.getAttribute('href')) })).filter((x) => x.el);
    const spy = () => { const y = window.scrollY + 120; let cur = secs[0]; for (const s of secs) if (s.el.offsetTop <= y) cur = s; navLinks.forEach((a) => a.classList.remove('active')); cur?.a.classList.add('active'); };
    window.addEventListener('scroll', spy, { passive: true }); spy();
  }
  const msgEl = document.getElementById('msg');
  window.showMsg = (t, keep) => { msgEl.textContent = t; msgEl.style.display = 'block'; if (!keep) setTimeout(() => (msgEl.style.display = 'none'), 3500); };
  ${script}
</script>
</body></html>`;
}
