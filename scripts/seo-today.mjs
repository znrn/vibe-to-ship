// 冬瓜站 SEO / GEO 工作台：按日期组合「每天 + 周几 + 每月 1 号 + 每季度」的事，先跑站内检查，
// 然后生成一个页面 ~/launchpad/pages/aidev-seo-console.html（本机导航 http://localhost:8088 里会自动出现），
// 并把要你亲自做的事写进 ~/launchpad/todos.json（同一天不重复）。
// 用法：npm run seo:today              清单 + 检查 + 页面 + 待办
//       npm run seo:today -- --no-todo   不写待办
// 规则和登录入口见 plan/seo-playbook.md；关键词表 plan/seo/keywords.csv；日志 plan/seo/log.md
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { runSeoCheck } from './seo-check.mjs';
import { loadTopicMap } from './lib/topic-map.mjs';
import { ROADMAP, PLATFORMS, WHAT_IS } from '../src/data/site.ts';

const today = new Date();
const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const weekday = today.getDay(); // 0 周日
const dom = today.getDate();
const month = today.getMonth() + 1;
const W = ['日', '一', '二', '三', '四', '五', '六'];
const PROJECT = 'AI 开发培训 · 冬瓜站 SEO';
const LAUNCHPAD = join(homedir(), 'launchpad');
const TODOS = join(LAUNCHPAD, 'todos.json');
const PAGE = join(LAUNCHPAD, 'pages', 'aidev-seo-console.html');
const PAGE_URL = 'http://localhost:8088/pages/aidev-seo-console.html';
const HISTORY = 'plan/seo/history.json';
const noTodo = process.argv.includes('--no-todo');

const LINKS = [
  ['百度站长', 'https://ziyuan.baidu.com/'],
  ['Bing 站长', 'https://www.bing.com/webmasters/'],
  ['Search Console', 'https://search.google.com/search-console'],
  ['百度统计', 'https://tongji.baidu.com/'],
  ['富媒体测试', 'https://search.google.com/test/rich-results'],
  ['PageSpeed', 'https://pagespeed.web.dev/'],
  ['网站', 'https://eryx.cn/'],
  ['GitHub', 'https://github.com/znrn/vibe-to-ship'],
];

// ── 任务表：human = 要你亲自做（写进待办）；auto = 脚本做 ──
const daily = [
  { human: true, title: '百度站长「流量与关键词」：昨天有展现没点击的词，记到关键词表的待写区', link: 'https://ziyuan.baidu.com/' },
  { human: true, title: '统计后台：昨天哪一页被看、从哪来', link: 'https://tongji.baidu.com/' },
  { human: true, title: '回复读者的问题，真实问题记进选题地图当选题' },
  { auto: 'npm run seo:push', title: '把还没推过的网址推给百度（每天配额 10 条，脚本自动挑）' },
];
const weekly = {
  1: [{ human: true, title: '定本周要写的一篇问题页：优先「有展现没点击」的词和读者问过的问题' }],
  2: [{ human: true, title: '学习地图：读一个还没勾的知识点（工作台底部），顺手看看本站这一项该不该做' }],
  3: [{ human: true, title: '内链：本周新文章链到所属支柱页，支柱页反链回来；看检查结果里的孤立页' }],
  4: [],
  5: [{ human: true, title: '分发：知乎 / V2EX / 即刻 / 小红书各发一条，带原文链接，记下哪个渠道来人' }],
  6: [],
  0: [
    { human: true, title: '收录：site:eryx.cn 和站长平台索引量，没收录的页手动提交', link: 'https://ziyuan.baidu.com/' },
    { human: true, title: '在 plan/seo/log.md 写两行：这周做了什么、看到什么' },
  ],
};
const monthly = [
  { human: true, title: '关键词表填当月排名；进前 20 的词加内链、更新内容' },
  { human: true, title: '流量最高的 3 页精修：补 FAQ、补来源、更新日期' },
  { human: true, title: '外链：找 2～3 个相关站点、公众号互推或投稿' },
  { human: true, title: 'GEO 核对：豆包 / Kimi / Perplexity / ChatGPT 各问一遍站点主词和 3 个支柱词，记录是否引用、引用哪页' },
  { auto: 'npm run check:links', title: '外链死链检查（要联网，约 1 分钟）' },
];
const quarterly = [
  { human: true, title: '关键词研究再做一轮（scripts/research），更新选题地图' },
  { human: true, title: 'PageSpeed Insights 跑首页和一个支柱页', link: 'https://pagespeed.web.dev/' },
  { human: true, title: '砍掉三个月零流量的方向，把精力集中到有搜索的词上' },
];
const sections = [['每天', daily], [`周${W[weekday]}`, weekly[weekday]]];
if (dom === 1) sections.push(['每月 1 号', monthly]);
if (dom === 1 && [1, 4, 7, 10].includes(month)) sections.push(['每季度', quarterly]);

// ── 终端输出 ──
console.log(`\n${ymd} 周${W[weekday]} · 冬瓜站 SEO / GEO 清单\n`);
let n = 0;
const humanTasks = [];
for (const [name, tasks] of sections) {
  if (!tasks.length) continue;
  console.log(`【${name}】`);
  for (const t of tasks) {
    n++;
    console.log(`  ${n}. ${t.title}${t.link ? `  ${t.link}` : ''}${t.auto ? `  （脚本：${t.auto}）` : ''}`);
    if (t.human) humanTasks.push(t);
  }
}

// ── 站内检查：dist 比 src 旧就先构建 ──
console.log('\n【脚本检查】');
const stale = !existsSync('dist/index.html') || execSync('find src public -type f -newer dist/index.html | head -1').toString().trim() !== '';
if (stale) {
  console.log('  dist/ 过期，先构建…');
  execSync('npm run build', { stdio: 'ignore' });
}
const check = runSeoCheck({ print: false });
for (const e of check.errors) console.log('  ✗ ' + e);
for (const w of check.warns.slice(0, 12)) console.log('  ⚠ ' + w);
if (check.warns.length > 12) console.log(`  … 还有 ${check.warns.length - 12} 条建议，页面里有全部`);
if (!check.errors.length && !check.warns.length) console.log('  站内检查全绿');

// ── 百度推送：每天的配额用在没推过的网址上 ──
try { console.log('  ' + execSync('node scripts/seo-push.mjs').toString().trim().split('\n')[0]); } catch (e) { console.log('  百度推送出错：' + (e.stdout?.toString().trim() || e.message)); }

// ── 历史：每天一条，同一天覆盖 ──
mkdirSync('plan/seo', { recursive: true });
const history = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, 'utf8')) : [];
const rec = { date: ymd, pages: check.pages ?? 0, errors: check.errors.length, warns: check.warns.length };
const idx = history.findIndex((h) => h.date === ymd);
if (idx >= 0) history[idx] = rec; else history.push(rec);
writeFileSync(HISTORY, JSON.stringify(history.slice(-90), null, 2) + '\n');

// ── 自动流水线的日报（plan/seo/daily/latest.json，由 npm run seo:daily 生成）──
const autoDaily = existsSync('plan/seo/daily/latest.json') ? JSON.parse(readFileSync('plan/seo/daily/latest.json', 'utf8')) : null;
if (autoDaily?.date === ymd) {
  const f = autoDaily.findings ?? {};
  if ((f.notes ?? []).some((n) => /没登录百度站长/.test(n))) humanTasks.push({ title: '在 Ego 浏览器登录百度站长平台（任务空间 eryx seo baidu console），之后流量与关键词就能自动抓', link: 'https://ziyuan.baidu.com/' });
  if (f.deadSources?.length) humanTasks.push({ title: `${f.deadSources.length} 条参考来源打不开，看日报换新地址` });
  if (f.decline?.length) humanTasks.push({ title: `${f.decline.length} 页流量比上周少 30% 以上，看日报决定要不要更新` });
  if ((f.opportunities ?? []).some((o) => o.action === '待写')) humanTasks.push({ title: `日报里有 ${f.opportunities.filter((o) => o.action === '待写').length} 个「待写」机会词，挑一个进选题地图` });
}

// ── 待办：写进 launchpad，同一天同一条不重复 ──
let todos = existsSync(TODOS) ? JSON.parse(readFileSync(TODOS, 'utf8')) : [];
if (!noTodo && existsSync(TODOS)) {
  let added = 0;
  for (const t of humanTasks) {
    if (todos.some((x) => x.project === PROJECT && x.title === t.title && x.created === ymd)) continue;
    todos.push({ id: `t${Date.now()}${added}`, title: t.title, project: PROJECT, detail: `SEO 日常 · ${ymd}`, link: t.link ?? '', done: false, created: ymd });
    added++;
  }
  if (added) writeFileSync(TODOS, JSON.stringify(todos, null, 2) + '\n');
}
const mine = todos.filter((x) => x.project === PROJECT);
const oneTime = mine.filter((x) => !/^SEO 日常/.test(x.detail ?? ''));
const todayTodos = mine.filter((x) => x.created === ymd && /^SEO 日常/.test(x.detail ?? ''));

// ── 页面 ──
const esc0 = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dailyHtml = (() => {
  if (!autoDaily) return `<section class="card"><h2>自动日报 <span>还没跑过</span></h2><p class="how">运行 <code>npm run seo:daily</code>（launchd 每天 7:30 自动跑）后这里显示昨天的流量、蜘蛛、排名和要处理的事。</p></section>`;
  const f = autoDaily.findings ?? {};
  const st = (n, label, cls = '') => `<div class="${cls}"><b>${esc0(n ?? '-')}</b>${label}</div>`;
  const bars = (arr, cls) => { const max = Math.max(1, ...arr.map((x) => x.v ?? 0)); return `<div class="bars">${arr.map((x) => `<div class="${cls}" style="height:${Math.max(3, Math.round(((x.v ?? 0) / max) * 48))}px" title="${x.d}：${x.v ?? '-'}"><i>${x.d.slice(5)}</i></div>`).join('')}</div>`; };
  const list = (title, rows) => rows.length ? `<details${rows.length <= 6 ? ' open' : ''}><summary><b>${title}</b> ${rows.length}</summary><ul class="issues">${rows.map((r) => `<li class="${r[0]}">${esc0(r[1])}</li>`).join('')}</ul></details>` : '';
  const rows = [
    list('机会词', (f.opportunities ?? []).slice(0, 20).map((o) => [o.action === '待写' ? 'w' : 'e', `【${o.action}】${o.word} ← ${o.source}${o.impressions != null ? `，展现 ${o.impressions} 点击 ${o.clicks ?? 0}` : ''}${o.rank ? `，排名 ${o.rank}` : ''}${o.page ? `，对应 ${o.page}` : ''}`])),
    list('排名变化', (f.rankChanges ?? []).map((c) => ['w', `${c.word}：${c.engine} ${c.from} → ${c.to}`])),
    list('弱内链', (f.weakLinks ?? []).map((w) => ['w', `${w.page}（${w.inbound} 条）${w.suggest?.length ? `，可从 ${w.suggest.join('、')} 链过来` : ''}`])),
    list('衰退页', (f.decline ?? []).map((d) => ['e', `${d.page}：${d.before} → ${d.now}（${d.basis}）`])),
    list('抓取异常', [...(f.crawl?.notFound ?? []).slice(0, 12).map((n) => ['w', `${n.spider} 抓到 404：${n.path}（${n.hits} 次）`]), ...(f.crawl?.notCrawled ?? []).map((u) => ['w', `7 天没被百度抓过：${u}`])]),
    list('来源失效', (f.deadSources ?? []).map((d) => ['e', `${d.url}（${d.status}）出现在 ${d.in.join('、')}`])),
    list('提醒', (f.notes ?? []).map((n) => ['w', n])),
    list('脚本执行', (autoDaily.steps ?? []).map((s) => [s.ok ? '' : 'e', `${s.ok ? '✓' : '✗'} ${s.label}（${s.seconds}s）${s.summary ? `：${s.summary}` : ''}`])),
  ].join('');
  return `<section class="card">
    <h2>自动日报 <span>${esc0(autoDaily.date)} 生成 · 数据到 ${esc0(autoDaily.for)} · plan/seo/daily/</span></h2>
    <div class="stat">
      ${st(autoDaily.visits ?? autoDaily.humanHits, autoDaily.visits != null ? '访客' : '页面请求')}
      ${st(autoDaily.baiduspider, '百度蜘蛛')}
      ${st(`${autoDaily.rankTop10?.baidu ?? 0}/${autoDaily.rankTop50?.baidu ?? 0}`, '百度前10/前50', autoDaily.rankTop10?.baidu ? 'ok' : '')}
      ${st(autoDaily.opportunities, '机会词', autoDaily.opportunities ? 'ok' : '')}
      ${st((autoDaily.spider404 ?? 0) + (autoDaily.deadSources ?? 0) + (autoDaily.decline ?? 0), '异常', (autoDaily.spider404 ?? 0) + (autoDaily.deadSources ?? 0) + (autoDaily.decline ?? 0) ? 'warn' : 'ok')}
    </div>
    <div class="trend2"><div><p class="section-title">访客 7 天</p>${bars(autoDaily.trend?.visits ?? [], 'today')}</div><div><p class="section-title">百度蜘蛛 7 天</p>${bars(autoDaily.trend?.baiduspider ?? [], '')}</div></div>
    <div class="daily-lists">${rows || '<p class="muted">没有要处理的事</p>'}</div>
  </section>`;
})();
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const csv = existsSync('plan/seo/keywords.csv') ? readFileSync('plan/seo/keywords.csv', 'utf8').trim().split('\n').map((l) => l.split(',')) : [];
const log = existsSync('plan/seo/log.md') ? readFileSync('plan/seo/log.md', 'utf8') : '';
const logHtml = esc(log)
  .replace(/^# .*$/m, '')
  .replace(/^## (.*)$/gm, '<h4>$1</h4>')
  .replace(/^- (.*)$/gm, '<li>$1</li>')
  .replace(/^(?!<h4|<li|\s*$)(.+)$/gm, '<p>$1</p>');
// ── 关键词库：来自选题地图（plan/topic-map.yaml + 文章 frontmatter）、需求分和搜索量 ──
const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const demand = readJson('plan/research/demand.json')?.demand ?? {};
const volumeAll = readJson('plan/research/volume.json');
const volume = volumeAll?.nodes ?? {};
const metric = volumeAll?.metric ?? '搜索量';
let kwNodes = [];
let kwMap = null;
try { ({ map: kwMap, merged: kwNodes } = loadTopicMap()); } catch (e) { console.log('  （读不到选题地图：' + e.message + '）'); }
const stageName = Object.fromEntries(ROADMAP.map((r) => [r.slug, `${r.step} ${r.short}`]));
const KW_STATUS = { published: ['已发布', 'ok'], draft: ['草稿', 'later'], planned: ['计划', 'doing'] };
const topWords = [
  ...['vibe coding', '一人公司'].map((w) => ({ w, level: '站点主词', page: '/' })),
  { w: WHAT_IS.keyword, level: '入口页', page: WHAT_IS.path },
  ...ROADMAP.map((r) => ({ w: r.keyword, level: '支柱词', page: `/flow/${r.slug}/` })),
  ...PLATFORMS.map((pf) => ({ w: pf.keyword, level: '类目词', page: `/platforms/${pf.slug}/` })),
];
const kwSorted = [...kwNodes].sort((a, b) => (a.status === 'published' ? 0 : 1) - (b.status === 'published' ? 0 : 1) || (a.priority > b.priority ? 1 : -1) || (demand[b.id]?.score ?? 0) - (demand[a.id]?.score ?? 0));
const longtail = kwNodes.reduce((n, x) => n + x.covers.length, 0);
const kwRows = kwSorted.map((n) => {
  const [label, cls] = KW_STATUS[n.status] ?? ['', ''];
  const link = n.status === 'published' ? `https://eryx.cn/articles/${n.id}/` : '';
  return `<tr data-status="${n.status}" data-p="${esc(n.priority)}" data-text="${esc((n.keyword + ' ' + n.covers.join(' ') + ' ' + (n.title ?? '')).toLowerCase())}"><td><b>${esc(n.keyword)}</b>${n.title ? `<br><small>${link ? `<a href="${link}" target="_blank" rel="noopener">${esc(n.title)} ↗</a>` : esc(n.title)}</small>` : ''}${n.covers.length ? `<details><summary>${n.covers.length} 个长尾</summary>${n.covers.map((c) => `<span class="lt">${esc(c)}</span>`).join('')}</details>` : ''}</td><td>${esc(stageName[n.stage] ?? n.stage ?? '')}</td><td>${esc(n.platforms.join(' / '))}</td><td>${esc(n.priority)}</td><td><span class="st ${cls}">${label}</span></td><td>${demand[n.id]?.score ?? '-'}</td><td>${volume[n.id]?.volume ?? '-'}</td></tr>`;
}).join('');
const kwHtml = kwNodes.length ? `
  <p class="how" style="margin-bottom:8px">四层结构：站点主词 → 类目词 / 支柱词 → 文章主词（一个节点 = 一篇文章）→ 长尾（写进小标题和 FAQ）。
  来源 plan/topic-map.yaml；需求分 = 联想词命中数（scripts/research/match.mjs），${esc(metric)} 来自关键词工具导入。
  更完整的视图：<a href="/pages/aidev-topic-map.html">选题地图</a> · <a href="/pages/aidev-topic-research.html">问法对照</a> · <a href="/pages/aidev-keyword-bank.html">培训关键词库</a></p>
  <div class="stat"><div><b>${topWords.length}</b>主词 / 类目 / 支柱词</div><div><b>${kwNodes.length}</b>文章节点</div><div class="ok"><b>${kwNodes.filter((n) => n.status === 'published').length}</b>已发布</div><div><b>${kwNodes.filter((n) => n.priority === 'P1' && n.status !== 'published').length}</b>P1 待写</div><div><b>${longtail}</b>长尾问法</div></div>
  <p class="section-title">第 1～2 层 · 首页、入口页、支柱页、形态页</p>
  <div class="chips">${topWords.map((t) => `<a class="chip" href="https://eryx.cn${esc(t.page)}" target="_blank" rel="noopener"><small>${esc(t.level)}</small>${esc(t.w)}</a>`).join('')}</div>
  <p class="section-title">第 3～4 层 · 文章主词和长尾</p>
  <div class="kw-tools"><input id="kw-q" type="search" placeholder="搜词、长尾或标题…" /><label><input type="radio" name="kw-s" value="" checked /> 全部</label><label><input type="radio" name="kw-s" value="published" /> 已发布</label><label><input type="radio" name="kw-s" value="planned" /> 计划</label><label><input type="checkbox" id="kw-p1" /> 只看 P1</label><span id="kw-n" class="muted"></span></div>
  <div class="kw-wrap"><table id="kw-table"><thead><tr><th>文章主词 / 标题 / 长尾</th><th>步骤</th><th>形态</th><th>优先级</th><th>状态</th><th>需求分</th><th>${esc(metric)}</th></tr></thead><tbody>${kwRows}</tbody></table></div>` : '';
const lmap = existsSync('plan/seo/learning-map.json') ? JSON.parse(readFileSync('plan/seo/learning-map.json', 'utf8')) : null;
const STATUS = { done: ['已做', 'ok'], doing: ['在做', 'doing'], later: ['以后', 'later'], skip: ['不需要', 'skip'] };
const learnHtml = lmap ? lmap.modules.map((m, mi) => `<div class="mod"><h3>${esc(m.name)} <small>${esc(m.why)}</small></h3><ul>${m.points.map((pt, pi) => {
  const [label, cls] = STATUS[pt.site] ?? ['', ''];
  return `<li><label><input type="checkbox" data-learn="${mi}-${pi}" /> <b>${esc(pt.name)}</b></label><span class="st ${cls}">${label}</span><p>${esc(pt.what)}${pt.note ? ` <em>本站：${esc(pt.note)}</em>` : ''}${(pt.learn ?? []).map(([t, u]) => ` <a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</p></li>`;
}).join('')}</ul></div>`).join('') : '';
const tut = lmap?.tutorial;
const tutHtml = tut ? `<div class="tut"><p class="how" style="margin-bottom:8px"><b><a href="${esc(tut.url)}" target="_blank" rel="noopener">${esc(tut.title)} ↗</a></b> ${esc(tut.note)}</p><ol class="tut-list">${tut.chapters.map((c) => { const [label, cls] = STATUS[c.site] ?? ['', '']; return `<li><a href="${esc(tut.url)}#${esc(c.id)}" target="_blank" rel="noopener">${esc(c.name)}</a><span class="st ${cls}">${label}</span><p>${esc(c.note)}</p></li>`; }).join('')}</ol></div>` : '';
const last14 = history.slice(-14);
const maxW = Math.max(1, ...last14.map((h) => h.warns + h.errors));
const taskRow = (t, i) => {
  const done = todayTodos.find((x) => x.title === t.title)?.done;
  return `<li class="task${done ? ' done' : ''}"><label><input type="checkbox" data-key="${esc(ymd + '|' + t.title)}" ${done ? 'checked' : ''}/> <span>${esc(t.title)}</span></label>${t.link ? ` <a class="go" href="${esc(t.link)}" target="_blank" rel="noopener">打开 ↗</a>` : ''}${t.auto ? ` <code>${esc(t.auto)}</code>` : ''}</li>`;
};
const cal = [1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="day${d === weekday ? ' today' : ''}"><b>周${W[d]}</b>${(weekly[d] ?? []).map((t) => `<p>${esc(t.title)}</p>`).join('') || '<p class="muted">只做每天的三件事</p>'}</div>`).join('');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>冬瓜站 SEO 工作台</title>
<meta name="description" content="eryx.cn 的 SEO / GEO 日常工作台：今天的清单、站内检查结果、关键词目标、周期安排和日志。每天 npm run seo:today 重新生成。" />
<meta name="launchpad-group" content="AI 开发培训" />
<style>
  :root { --bg:#f8fafc; --card:#fff; --line:#e2e8f0; --ink:#0f172a; --muted:#64748b; --green:#059669; --green-soft:#ecfdf5; --red:#b91c1c; --red-soft:#fef2f2; --amber:#b45309; --amber-soft:#fef3c7; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--ink); font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB",sans-serif; padding:24px 16px 60px; }
  .wrap { max-width:1100px; margin:0 auto; }
  header { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:18px; }
  h1 { font-size:24px; font-weight:800; }
  h1 small { font-size:13px; color:var(--muted); font-weight:500; margin-left:10px; }
  .platforms { display:flex; flex-wrap:wrap; gap:6px; }
  .platforms a { font-size:12.5px; font-weight:600; color:#334155; background:#fff; border:1px solid var(--line); border-radius:999px; padding:4px 11px; text-decoration:none; }
  .platforms a:hover { border-color:var(--green); color:var(--green); }
  .grid { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:16px; }
  @media (max-width:860px) { .grid { grid-template-columns:1fr; } }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 20px; margin-bottom:16px; }
  .card h2 { font-size:15px; font-weight:800; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; }
  .card h2 span { font-size:12px; color:var(--muted); font-weight:500; }
  .tasks { list-style:none; }
  .task { padding:8px 0; border-bottom:1px dashed var(--line); display:flex; align-items:flex-start; gap:8px; flex-wrap:wrap; }
  .task:last-child { border-bottom:0; }
  .task label { display:flex; gap:10px; align-items:flex-start; cursor:pointer; flex:1; }
  .task input { margin-top:6px; accent-color:var(--green); }
  .task.done span { color:var(--muted); text-decoration:line-through; }
  .task .go { font-size:12px; color:var(--green); font-weight:700; text-decoration:none; white-space:nowrap; margin-top:3px; }
  .task code { font-size:12px; background:#f1f5f9; border-radius:5px; padding:1px 6px; }
  .section-title { font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#94a3b8; margin:12px 0 2px; }
  .stat { display:flex; gap:10px; margin-bottom:12px; }
  .stat div { flex:1; border-radius:10px; padding:10px 12px; background:#f8fafc; border:1px solid var(--line); }
  .stat b { display:block; font-size:22px; }
  .stat .bad b { color:var(--red); } .stat .warn b { color:var(--amber); } .stat .ok b { color:var(--green); }
  .issues { list-style:none; font-size:13px; max-height:360px; overflow:auto; }
  .issues li { padding:5px 8px; border-radius:6px; margin-bottom:4px; }
  .issues .e { background:var(--red-soft); color:var(--red); } .issues .w { background:var(--amber-soft); color:var(--amber); }
  .bars { display:flex; align-items:flex-end; gap:4px; height:60px; margin:6px 0 2px; }
  .bars div { flex:1; background:#cbd5e1; border-radius:3px 3px 0 0; min-height:2px; position:relative; }
  .bars div.today { background:var(--green); }
  .bars div i { position:absolute; bottom:-18px; left:0; right:0; font-size:9px; color:#94a3b8; text-align:center; font-style:normal; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:12px; }
  .cal { display:flex; flex-direction:column; gap:6px; }
  .day { display:flex; gap:12px; align-items:flex-start; background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:8px 12px; font-size:12.5px; }
  .day.today { border-color:var(--green); background:var(--green-soft); }
  .day b { flex:0 0 34px; color:var(--ink); }
  .day p { color:#475569; line-height:1.5; }
  .muted { color:#94a3b8; }
  .cycle li { font-size:13px; margin:0 0 4px 18px; }
  .log h4 { font-size:13px; margin:10px 0 4px; color:var(--green); }
  .log li { font-size:13px; margin-left:18px; } .log p { font-size:13px; }
  .onetime .task.done { opacity:.6; }
  .trend2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:4px 0 26px; }
  .daily-lists details { margin-top:8px; } .daily-lists summary { cursor:pointer; font-size:13px; } .daily-lists .issues { margin-top:4px; max-height:240px; }
  .daily-lists .issues li { background:#f8fafc; color:#334155; }
  .how { font-size:12.5px; color:var(--muted); margin-top:4px; }
  .how code { background:#f1f5f9; border-radius:5px; padding:1px 6px; }
  .learn { grid-column:1 / -1; }
  .mods { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @media (max-width:1000px) { .mods { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:640px) { .mods { grid-template-columns:1fr; } }
  .mod { border:1px solid var(--line); border-radius:12px; padding:12px 14px; background:#fbfcfd; }
  .mod h3 { font-size:14px; font-weight:800; margin-bottom:6px; }
  .mod h3 small { display:block; font-size:12px; color:var(--muted); font-weight:500; }
  .mod ul { list-style:none; }
  .mod li { padding:6px 0; border-top:1px dashed var(--line); font-size:12.5px; }
  .mod li label { cursor:pointer; } .mod li input { accent-color:var(--green); margin-right:4px; }
  .mod li.learned b { color:var(--muted); text-decoration:line-through; }
  .mod li p { color:#475569; line-height:1.55; margin-top:2px; }
  .mod li em { font-style:normal; color:var(--green); }
  .mod li a { color:#2563eb; text-decoration:none; white-space:nowrap; }
  .st { font-size:10.5px; font-weight:700; border-radius:999px; padding:0 7px; margin-left:6px; vertical-align:1px; }
  .st.ok { background:var(--green-soft); color:var(--green); } .st.doing { background:#eff6ff; color:#2563eb; } .st.later { background:#f1f5f9; color:#64748b; } .st.skip { background:#f8fafc; color:#94a3b8; }
  .learn-progress { font-size:12px; color:var(--muted); }
  .kw { grid-column:1 / -1; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
  .chip { display:inline-flex; flex-direction:column; font-size:12.5px; font-weight:600; color:var(--ink); background:#f8fafc; border:1px solid var(--line); border-radius:8px; padding:4px 10px; text-decoration:none; }
  .chip small { font-size:10px; color:#94a3b8; font-weight:600; }
  .chip:hover { border-color:var(--green); }
  .kw-tools { display:flex; flex-wrap:wrap; align-items:center; gap:12px; font-size:12.5px; margin:4px 0 8px; }
  .kw-tools input[type=search] { flex:1; min-width:180px; border:1px solid var(--line); border-radius:8px; padding:6px 10px; font:inherit; }
  .kw-wrap { max-height:520px; overflow:auto; border:1px solid var(--line); border-radius:10px; }
  #kw-table th { position:sticky; top:0; background:#f8fafc; }
  #kw-table td small { color:var(--muted); }
  #kw-table details { font-size:11.5px; color:var(--muted); margin-top:2px; } #kw-table summary { cursor:pointer; }
  .lt { display:inline-block; border:1px dashed var(--line); border-radius:6px; padding:0 6px; margin:2px 4px 0 0; }
  tr.hide { display:none; }
  .tut-list { list-style:none; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; counter-reset:ch; }
  @media (max-width:1000px) { .tut-list { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:640px) { .tut-list { grid-template-columns:1fr; } }
  .tut-list li { border:1px solid var(--line); border-radius:10px; padding:8px 12px; font-size:12.5px; background:#fbfcfd; counter-increment:ch; }
  .tut-list li::before { content:counter(ch, decimal-leading-zero); font-size:10px; font-weight:800; color:#94a3b8; margin-right:6px; }
  .tut-list li > a { font-weight:700; color:var(--ink); text-decoration:none; } .tut-list li > a:hover { color:var(--green); }
  .tut-list li p { color:#475569; line-height:1.5; margin-top:2px; }
</style>
</head>
<body><div class="wrap">
<header>
  <h1>冬瓜站 SEO 工作台 <small>${ymd} 周${W[weekday]} · 生成于 ${today.toTimeString().slice(0, 5)}</small></h1>
  <nav class="platforms">${LINKS.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</nav>
</header>
<div class="grid">
<div>
  ${dailyHtml}
  <section class="card">
    <h2>今天要做的 <span>勾选只记在这台电脑的浏览器里；待办页里也有同样的事</span></h2>
    ${sections.filter(([, t]) => t.length).map(([name, tasks]) => `<p class="section-title">${esc(name)}</p><ul class="tasks">${tasks.map(taskRow).join('')}</ul>`).join('')}
    <p class="how">重新生成这个页面：在项目目录运行 <code>npm run seo:today</code>（会先构建并检查）。</p>
  </section>
  <section class="card">
    <h2>站内检查 <span>${check.pages ?? 0} 页 · 规则见 plan/seo-playbook.md</span></h2>
    <div class="stat">
      <div class="${check.errors.length ? 'bad' : 'ok'}"><b>${check.errors.length}</b>必须改</div>
      <div class="${check.warns.length ? 'warn' : 'ok'}"><b>${check.warns.length}</b>建议改</div>
      <div class="ok"><b>${check.pages ?? 0}</b>页面</div>
    </div>
    <div class="bars">${last14.map((h) => `<div class="${h.date === ymd ? 'today' : ''}" style="height:${Math.max(4, Math.round(((h.errors + h.warns) / maxW) * 56))}px" title="${h.date}：${h.errors} 必须改 / ${h.warns} 建议改"><i>${h.date.slice(5)}</i></div>`).join('')}</div>
    <p class="how" style="margin-top:22px">近 ${last14.length} 次检查的问题数走势，越矮越好。</p>
    <ul class="issues" style="margin-top:10px">${check.errors.map((e) => `<li class="e">✗ ${esc(e)}</li>`).join('')}${check.warns.map((w) => `<li class="w">⚠ ${esc(w)}</li>`).join('') || '<li class="muted">全绿</li>'}</ul>
  </section>
  <section class="card onetime">
    <h2>一次性准备 <span>在待办页勾完成；${oneTime.filter((x) => x.done).length} / ${oneTime.length}</span></h2>
    <ul class="tasks">${oneTime.map((x) => `<li class="task${x.done ? ' done' : ''}"><label><input type="checkbox" disabled ${x.done ? 'checked' : ''}/> <span>${esc(x.title)}</span></label>${x.link ? ` <a class="go" href="${esc(x.link)}" target="_blank" rel="noopener">打开 ↗</a>` : ''}</li>`).join('') || '<li class="muted">没有</li>'}</ul>
  </section>
</div>
<div>
  <section class="card">
    <h2>本周安排 <span>每天固定三件事之外</span></h2>
    <div class="cal">${cal}</div>
  </section>
  <section class="card">
    <h2>每月 1 号 / 每季度</h2>
    <p class="section-title">每月 1 号</p><ul class="cycle">${monthly.map((t) => `<li>${esc(t.title)}</li>`).join('')}</ul>
    <p class="section-title">每季度（1、4、7、10 月）</p><ul class="cycle">${quarterly.map((t) => `<li>${esc(t.title)}</li>`).join('')}</ul>
  </section>
  <section class="card">
    <h2>关键词目标 <span>plan/seo/keywords.csv · 每月填排名</span></h2>
    <table><thead><tr>${(csv[0] ?? []).slice(0, 5).map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${csv.slice(1).map((r) => `<tr>${r.slice(0, 5).map((c, i) => `<td>${i === 2 ? `<a href="https://eryx.cn${esc(c)}" target="_blank" rel="noopener">${esc(c)}</a>` : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </section>
  <section class="card log">
    <h2>工作日志 <span>plan/seo/log.md</span></h2>
    ${logHtml || '<p class="muted">还没有</p>'}
  </section>
</div>
</div>
${kwHtml ? `<section class="card kw"><h2>关键词库 <span>plan/topic-map.yaml · 改选题先改地图</span></h2>${kwHtml}</section>` : ''}
${lmap ? `<section class="card learn">
  <h2>SEO / GEO 学习地图 <span class="learn-progress">勾掉学过的，记在这台电脑的浏览器里 · <span id="learn-count"></span></span></h2>
  <p class="how" style="margin-bottom:10px">来源：${esc(lmap.source)}。每条标了本站现状：<span class="st ok">已做</span><span class="st doing">在做</span><span class="st later">以后</span><span class="st skip">不需要</span>，点「↗」是学习资料。</p>
  <div class="mods">${learnHtml}</div>
  <h2 style="margin-top:18px">做法教程 <span>学习地图说「有哪些事」，这本说「怎么做」</span></h2>
  ${tutHtml}
</section>` : ''}
</div>
<script>
  const learnBoxes = document.querySelectorAll('input[data-learn]');
  const learnCount = () => { const el = document.getElementById('learn-count'); if (el) el.textContent = [...learnBoxes].filter((b) => b.checked).length + ' / ' + learnBoxes.length + ' 学过'; };
  for (const box of learnBoxes) {
    const k = 'seo-learn:' + box.dataset.learn;
    try { if (localStorage.getItem(k) === '1') { box.checked = true; box.closest('li').classList.add('learned'); } } catch {}
    box.addEventListener('change', () => { box.closest('li').classList.toggle('learned', box.checked); try { localStorage.setItem(k, box.checked ? '1' : '0'); } catch {} learnCount(); });
  }
  learnCount();
  const kwRowsEl = document.querySelectorAll('#kw-table tbody tr');
  const kwFilter = () => {
    const q = (document.getElementById('kw-q')?.value ?? '').trim().toLowerCase();
    const st = document.querySelector('input[name=kw-s]:checked')?.value ?? '';
    const p1 = document.getElementById('kw-p1')?.checked;
    let shown = 0;
    for (const r of kwRowsEl) {
      const ok = (!q || r.dataset.text.includes(q)) && (!st || r.dataset.status === st) && (!p1 || r.dataset.p === 'P1');
      r.classList.toggle('hide', !ok); if (ok) shown++;
    }
    const n = document.getElementById('kw-n'); if (n) n.textContent = shown + ' / ' + kwRowsEl.length + ' 条';
  };
  for (const el of document.querySelectorAll('#kw-q, input[name=kw-s], #kw-p1')) el.addEventListener('input', kwFilter);
  kwFilter();
  for (const box of document.querySelectorAll('input[data-key]')) {
    const k = 'seo-task:' + box.dataset.key;
    try { if (localStorage.getItem(k) === '1') { box.checked = true; box.closest('.task').classList.add('done'); } } catch {}
    box.addEventListener('change', () => {
      box.closest('.task').classList.toggle('done', box.checked);
      try { localStorage.setItem(k, box.checked ? '1' : '0'); } catch {}
    });
  }
</script>
</body>
</html>
`;
mkdirSync(join(LAUNCHPAD, 'pages'), { recursive: true });
writeFileSync(PAGE, html);
try { execSync('node scripts/topic-map-page.mjs', { stdio: 'ignore' }); } catch {}
console.log(`\n页面：${PAGE_URL}`);
if (!noTodo && existsSync(TODOS)) console.log(`待办：http://localhost:8088 → 项目「${PROJECT}」`);
console.log('');
