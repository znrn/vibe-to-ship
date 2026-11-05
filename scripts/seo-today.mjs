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
  { auto: 'npm run seo:daily', title: '站长后台的展现 / 点击 / 排名、蜘蛛日志、线上巡检：流水线每天 7:30 自动采集，结果在上面的「自动日报」' },
  { human: true, title: '看一眼自动日报：机会词进选题地图、待人工处理的改掉', link: 'http://localhost:8088/pages/aidev-seo-console.html#sec-daily' },
  { human: true, title: '回复读者的问题，真实问题记进选题地图当选题' },
  { auto: 'npm run seo:push', title: '把还没推过的网址推给百度（每天配额 10 条，脚本自动挑）' },
];
const weekly = {
  1: [{ human: true, title: '定本周要写的一篇问题页：优先「有展现没点击」的词和读者问过的问题' }],
  2: [{ human: true, title: '学习地图：读一个还没勾的知识点（工作台底部），顺手看看本站这一项该不该做' }],
  3: [{ human: true, title: '内链：本周新文章链到所属支柱页，支柱页反链回来；看检查结果里的孤立页' }],
  4: [],
  5: [{ human: true, title: '分发：分发台里本周文章的四平台稿子已写好，复制或预填后你点发布，发完标记已发', link: 'http://localhost:8088/pages/aidev-seo-distribute.html' }],
  6: [],
  0: [
    { human: true, title: '收录：site:eryx.cn 和站长平台索引量，没收录的页手动提交', link: 'https://ziyuan.baidu.com/' },
    { human: true, title: '在 plan/seo/log.md 写两行：这周做了什么、看到什么' },
  ],
};
const monthly = [
  { human: true, title: '关键词表填当月排名；进前 20 的词加内链、更新内容' },
  { human: true, title: '流量最高的 3 页精修：补 FAQ、补来源、更新日期' },
  { human: true, title: '外链：分发台底部有本月扫到的提及和候选私信草稿，挑 2～3 个发', link: 'http://localhost:8088/pages/aidev-seo-distribute.html' },
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
  if (autoDaily.queue?.draft) humanTasks.push({ title: `审核 ${autoDaily.queue.draft} 篇自动写的草稿：看结论和来源，通过就上线`, link: 'http://localhost:8088/pages/aidev-seo-review.html' });
  if (autoDaily.distPending) humanTasks.push({ title: `${autoDaily.distPending} 篇文章的分发稿还没发完，去分发台复制或预填后发布`, link: 'http://localhost:8088/pages/aidev-seo-distribute.html' });
  if (autoDaily.queue?.proposals) humanTasks.push({ title: `${autoDaily.queue.proposals} 条建议新增选题，采纳或忽略`, link: 'http://localhost:8088/pages/aidev-seo-review.html' });
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

// ── 页面：共用外壳在 scripts/seo/ui.mjs，这里只拼各个分区 ──
const esc0 = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = autoDaily?.findings ?? {};
const tile = (n, label, cls = '') => `<div class="tile ${cls}"><b>${typeof n === 'string' && n.startsWith('<a ') ? n : esc0(n ?? '-')}</b><small>${label}</small></div>`;
const bars = (arr, hi) => { const max = Math.max(1, ...arr.map((x) => x.v ?? 0)); return `<div class="bars">${arr.map((x) => `<div class="${hi ? 'hi' : ''}" style="height:${Math.max(3, Math.round(((x.v ?? 0) / max) * 48))}px" title="${x.d}：${x.v ?? '-'}"><i>${x.d.slice(5)}</i></div>`).join('')}</div>`; };
const list = (title, rows, open) => rows.length ? `<details class="block"${open ?? rows.length <= 6 ? ' open' : ''}><summary>${title}<span class="n">${rows.length}</span></summary><ul class="issues">${rows.map((r) => `<li class="${r[0]}">${esc0(r[1])}</li>`).join('')}</ul></details>` : '';
const issuesN = autoDaily ? (autoDaily.spider404 ?? 0) + (autoDaily.deadSources ?? 0) + (autoDaily.decline ?? 0) + (autoDaily.liveProblems?.length ?? 0) : 0;

// 总览：数字 + 两条 7 天走势
const overviewHtml = autoDaily ? `<section class="card" id="sec-daily">
  <h2>总览 <span>数据到 ${esc0(autoDaily.for)} · ${esc0(autoDaily.date)} 生成</span><a class="btn small right" href="/pages/aidev-seo-review.html">审核台${autoDaily.queue?.draft ? ` · ${autoDaily.queue.draft} 篇待审` : ''}</a><a class="btn small" href="/pages/aidev-seo-distribute.html">分发台${autoDaily.distPending ? ` · ${autoDaily.distPending} 篇待发` : ''}</a></h2>
  <div class="tiles">
    ${tile(autoDaily.visits ?? autoDaily.humanHits, autoDaily.visits != null ? '昨天访客' : '昨天页面请求')}
    ${tile(autoDaily.baiduspider, '百度蜘蛛来了几次')}
    ${tile(`${autoDaily.rankTop10?.baidu ?? 0} / ${autoDaily.rankTop50?.baidu ?? 0}`, '百度前 10 / 前 50 的词', autoDaily.rankTop10?.baidu ? 'ok' : '')}
    ${tile(autoDaily.opportunities, '机会词', autoDaily.opportunities ? 'accent' : '')}
    ${tile(autoDaily.queue ? `<a href="/pages/aidev-seo-review.html">${autoDaily.queue.draft}</a>` : '-', '待审草稿', autoDaily.queue?.draft ? 'warn' : '')}
    ${tile(autoDaily.leads28 ? `${autoDaily.leads28.咨询} / ${autoDaily.leads28.报名}` : '-', '28 天咨询 / 报名', autoDaily.leads28?.报名 ? 'ok' : '')}
    ${tile(issuesN, '要处理的异常', issuesN ? 'bad' : 'ok')}
  </div>
  <div class="trend2"><div><p class="section-title">访客 7 天</p>${bars(autoDaily.trend?.visits ?? [], true)}</div><div><p class="section-title">百度蜘蛛 7 天</p>${bars(autoDaily.trend?.baiduspider ?? [], false)}</div></div>
  ${list('脚本执行', (autoDaily.steps ?? []).map((s) => [s.ok ? '' : 'e', `${s.ok ? '✓' : '✗'} ${s.label}（${s.seconds}s）${s.summary ? `：${s.summary}` : ''}`]), false)}
</section>` : `<section class="card" id="sec-daily"><h2>总览 <span>还没跑过</span></h2><p class="how">运行 <code>npm run seo:daily</code>（launchd 每天 7:30 自动跑）后这里显示昨天的流量、蜘蛛、排名和要处理的事。</p></section>`;

// 要处理的事：机会词、异常、改动、待人工
const findingsHtml = autoDaily ? `<section class="card" id="sec-findings">
  <h2>要处理的事 <span>流水线分析出来的，按轻重排</span></h2>
  ${[
    list('机会词', (f.opportunities ?? []).slice(0, 20).map((o) => [o.action === '待写' ? 'w' : '', `【${o.action}】${o.word} ← ${o.source}${o.impressions != null ? `，展现 ${o.impressions} 点击 ${o.clicks ?? 0}` : ''}${o.rank ? `，排名 ${o.rank}` : ''}${o.page ? `，对应 ${o.page}` : ''}`])),
    list('有展现没人点的页面', (f.lowCtrPages ?? []).map((p) => ['w', `${p.page}：展现 ${p.impressions}，点击 0（${p.basis}）`])),
    list('排名变化', (f.rankChanges ?? []).map((c) => ['', `${c.word}：${c.engine} ${c.from} → ${c.to}`])),
    list('线上巡检', (autoDaily.liveProblems ?? []).map((p) => ['e', `${p.url}：${p.issue}`])),
    list('衰退页', (f.decline ?? []).map((d) => ['e', `${d.page}：${d.before} → ${d.now}（${d.basis}）`])),
    list('来源失效', (f.deadSources ?? []).map((d) => ['e', `${d.url}（${d.status}）出现在 ${d.in.join('、')}`])),
    list('抓取异常', [...(f.crawl?.notFound ?? []).slice(0, 12).map((n) => ['w', `${n.spider} 抓到 404：${n.path}（${n.hits} 次）`]), ...(f.crawl?.notCrawled ?? []).map((u) => ['w', `7 天没被百度抓过：${u}`])]),
    list('弱内链', (f.weakLinks ?? []).map((w) => ['w', `${w.page}（${w.inbound} 条）${w.suggest?.length ? `，可从 ${w.suggest.join('、')} 链过来` : ''}`])),
    list('待人工处理', (autoDaily.fixManual ?? []).map((m) => ['w', `${m.file.replace('src/content/articles/', '')}：${m.what}`])),
    list('脚本改了什么', (autoDaily.changesToday ?? []).map((c) => ['', `【${c.type}】${c.file.replace('src/content/articles/', '')}：${c.what}`])),
    list('提醒', (f.notes ?? []).map((n) => ['w', n])),
  ].join('') || '<p class="muted">今天没有要处理的事。</p>'}
</section>` : '';

// 页面状态表
const pagesHtml = f.pageStats ? `<section class="card" id="sec-pages">
  <h2>页面状态 <span>分清「推过 / 被抓 / 有展现 / 有人看」，推过不等于收录</span></h2>
  <div class="tiles">${tile(f.pageStats.total, '站点地图页数')}${tile(f.pageStats.pushed, '推过百度')}${tile(f.pageStats.crawled7, '7 天内被百度抓过', f.pageStats.crawled7 ? 'ok' : '')}${tile(f.pageStats.neverCrawled, '从没被抓', f.pageStats.neverCrawled ? 'warn' : 'ok')}</div>
  <div class="scroll"><table><thead><tr><th>页面</th><th>最近推送</th><th>最近被百度抓</th><th>百度展现</th><th>必应展现</th><th>7 天访问</th></tr></thead><tbody>${(f.pages ?? []).map((p) => `<tr><td><a href="https://eryx.cn${esc0(p.url)}" target="_blank" rel="noopener">${esc0(p.url)}</a></td><td>${esc0(p.pushed || '-')}</td><td class="${p.crawled ? '' : 'muted'}">${esc0(p.crawled || '从没')}</td><td>${esc0(p.baiduImp ?? '-')}</td><td>${esc0(p.bingImp ?? '-')}</td><td>${esc0(p.visits7 ?? '-')}</td></tr>`).join('')}</tbody></table></div>
</section>` : '';

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


const rankAll = existsSync('plan/seo/data/rank.json') ? JSON.parse(readFileSync('plan/seo/data/rank.json', 'utf8')) : { days: {} };
const rankToday = rankAll.days[Object.keys(rankAll.days).sort().at(-1)] ?? {};
const { shell } = await import('./seo/ui.mjs');
const body = `
${overviewHtml}
<div class="grid2">
<div>
  <section class="card" id="sec-today">
    <h2>今天要做的 <span>勾选只记在这台电脑的浏览器里；待办页里也有同样的事</span></h2>
    ${sections.filter(([, t]) => t.length).map(([name, tasks]) => `<p class="section-title">${esc(name)}</p><ul class="tasks">${tasks.map(taskRow).join('')}</ul>`).join('')}
    ${oneTime.length ? `<p class="section-title">一次性准备 · ${oneTime.filter((x) => x.done).length} / ${oneTime.length}</p><ul class="tasks">${oneTime.map((x) => `<li class="task${x.done ? ' done' : ''}"><label><input type="checkbox" disabled ${x.done ? 'checked' : ''}/> <span>${esc(x.title)}</span></label>${x.link ? ` <a class="go" href="${esc(x.link)}" target="_blank" rel="noopener">打开 ↗</a>` : ''}</li>`).join('')}</ul>` : ''}
  </section>
  ${findingsHtml}
  ${pagesHtml}
  <section class="card" id="sec-check">
    <h2>站内检查 <span>${check.pages ?? 0} 页 · 规则见 plan/seo-playbook.md</span></h2>
    <div class="tiles">${tile(check.errors.length, '必须改', check.errors.length ? 'bad' : 'ok')}${tile(check.warns.length, '建议改', check.warns.length ? 'warn' : 'ok')}${tile(check.pages ?? 0, '页面')}</div>
    <p class="section-title">近 ${last14.length} 次的问题数走势，越矮越好</p>
    <div class="bars">${last14.map((h) => `<div class="${h.date === ymd ? 'hi' : ''}" style="height:${Math.max(4, Math.round(((h.errors + h.warns) / maxW) * 56))}px" title="${h.date}：${h.errors} 必须改 / ${h.warns} 建议改"><i>${h.date.slice(5)}</i></div>`).join('')}</div>
    <ul class="issues">${check.errors.map((e) => `<li class="e">✗ ${esc(e)}</li>`).join('')}${check.warns.map((w) => `<li class="w">⚠ ${esc(w)}</li>`).join('') || '<li>全绿</li>'}</ul>
  </section>
</div>
<div>
  <section class="card" id="sec-week">
    <h2>本周安排 <span>每天固定的事之外</span></h2>
    <div class="cal">${cal}</div>
    <p class="section-title">每月 1 号</p><ul class="cycle">${monthly.map((t) => `<li>${esc(t.title)}</li>`).join('')}</ul>
    <p class="section-title">每季度（1、4、7、10 月）</p><ul class="cycle">${quarterly.map((t) => `<li>${esc(t.title)}</li>`).join('')}</ul>
  </section>
  <section class="card" id="sec-kw">
    <h2>关键词目标 <span>plan/seo/keywords.csv · 排名由流水线每天查</span></h2>
    <table><thead><tr><th>词</th><th>目标</th><th>百度</th><th>必应</th></tr></thead>
    <tbody>${csv.slice(1).map((r) => { const rk = rankToday?.[r[0]?.trim()] ?? {}; const pos = (v) => (typeof v === 'number' ? `<b style="color:var(--green)">${v}</b>` : esc(v ?? '-')); return `<tr><td><a href="https://eryx.cn${esc(r[2])}" target="_blank" rel="noopener" title="${esc(r[1])} · ${esc(r[2])}">${esc(r[0])}</a><br><small class="muted">${esc(r[1])}</small></td><td>${esc(r[3])}</td><td>${pos(rk.baidu)}</td><td>${pos(rk.bing)}</td></tr>`; }).join('')}</tbody></table>
    <p class="how">数字是 eryx.cn 在搜索结果里的位置；「>50」是前 50 没有；每天由流水线在 Ego 浏览器里查。</p>
  </section>
  <section class="card log" id="sec-log">
    <h2>工作日志 <span>plan/seo/log.md · 周日流水线自动补两行</span></h2>
    ${logHtml || '<p class="muted">还没有</p>'}
  </section>
</div>
</div>
${kwHtml ? `<section class="card" id="sec-bank"><h2>关键词库 <span>plan/topic-map.yaml · 改选题先改地图</span></h2>${kwHtml}</section>` : ''}
${lmap ? `<section class="card" id="sec-learn">
  <h2>SEO / GEO 学习地图 <span>勾掉学过的，记在这台电脑的浏览器里 · <span id="learn-count"></span></span></h2>
  <p class="how" style="margin-bottom:10px">来源：${esc(lmap.source)}。每条标了本站现状：<span class="st ok">已做</span> <span class="st doing">在做</span> <span class="st later">以后</span> <span class="st skip">不需要</span>，点「↗」是学习资料。</p>
  <div class="mods">${learnHtml}</div>
  <h2 style="margin-top:18px">做法教程 <span>学习地图说「有哪些事」，这本说「怎么做」</span></h2>
  ${tutHtml}
</section>` : ''}
`;
const pageScript = `
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
    for (const r of kwRowsEl) { const ok = (!q || r.dataset.text.includes(q)) && (!st || r.dataset.status === st) && (!p1 || r.dataset.p === 'P1'); r.classList.toggle('hide', !ok); if (ok) shown++; }
    const n = document.getElementById('kw-n'); if (n) n.textContent = shown + ' / ' + kwRowsEl.length + ' 条';
  };
  for (const el of document.querySelectorAll('#kw-q, input[name=kw-s], #kw-p1')) el.addEventListener('input', kwFilter);
  kwFilter();
  for (const box of document.querySelectorAll('input[data-key]')) {
    const k = 'seo-task:' + box.dataset.key;
    try { if (localStorage.getItem(k) === '1') { box.checked = true; box.closest('.task').classList.add('done'); } } catch {}
    box.addEventListener('change', () => { box.closest('.task').classList.toggle('done', box.checked); try { localStorage.setItem(k, box.checked ? '1' : '0'); } catch {} });
  }
`;
const html = shell({
  title: '冬瓜站 SEO 工作台',
  description: 'eryx.cn 的 SEO / GEO 工作台：总览、今天要做、要处理的事、页面状态、站内检查、关键词、学习地图。每天 7:30 流水线自动生成。',
  crumb: ['冬瓜站 SEO', '工作台'],
  headline: autoDaily ? (issuesN ? `有 ${issuesN} 件事要看一眼。` : (autoDaily.queue?.draft ? `有 ${autoDaily.queue.draft} 篇草稿等你审。` : '今天一切正常。')) : '先跑一遍流水线。',
  sub: `${ymd} 周${W[weekday]} · 自动采集、分析、改站、写稿都跑完了，这页只放要你看和要你做的。`,
  active: 'overview', page: 'console', body, script: pageScript,
  actions: `<a class="btn small" href="/pages/aidev-seo-review.html">审核台</a><a class="btn small" href="/pages/aidev-seo-distribute.html">分发台</a>`,
});
mkdirSync(join(LAUNCHPAD, 'pages'), { recursive: true });
writeFileSync(PAGE, html);
try { execSync('node scripts/topic-map-page.mjs', { stdio: 'ignore' }); } catch {}
console.log(`\n页面：${PAGE_URL}`);
if (!noTodo && existsSync(TODOS)) console.log(`待办：http://localhost:8088 → 项目「${PROJECT}」`);
console.log('');
