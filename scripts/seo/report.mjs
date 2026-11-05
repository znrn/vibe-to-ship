// 日报：把采集和分析结果写成 plan/seo/daily/<日期>.md 和 latest.json（工作台页面读它），异常发 macOS 通知。
import { writeFileSync, readFileSync } from 'node:fs';
import { readJson, writeJson, TODAY, YESTERDAY, daysAgo, DATA, DAILY, fmt, notify } from './lib.mjs';

const crawl = readJson(`${DATA}/crawl.json`, { days: {} });
const traffic = readJson(`${DATA}/traffic.json`, { days: {} });
const bing = readJson(`${DATA}/bing.json`, { days: {} });
const rank = readJson(`${DATA}/rank.json`, { days: {} });
const geo = readJson(`${DATA}/geo.json`, { weeks: {} });
const sources = readJson(`${DATA}/sources.json`, {});
const findings = readJson(`${DATA}/findings.json`, {});
const lastRun = readJson(`${DATA}/last-run.json`, {});
const live = readJson(`${DATA}/live.json`, {});
const changesAll = readJson(`${DATA}/changes.json`, []);
const changesToday = changesAll.filter((c) => c.date === TODAY);
const fixManual = readJson(`${DATA}/fix-manual.json`, {}).items ?? [];
// 转化回填：plan/seo/leads.csv（日期,类型,来源,备注），类型写 咨询 / 报名。意向事件在百度统计「事件分析」里看
const leads = (() => { try { return readFileSync('plan/seo/leads.csv', 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')).filter((r) => r[0]).map(([date, type, source, note]) => ({ date, type, source, note })); } catch { return []; } })();
const leads28 = leads.filter((l) => l.date >= daysAgo(28));
const queue = readJson(`${DATA}/queue.json`, []);
const qCount = (st) => queue.filter((q) => q.type === 'article' && q.status === st).length;
const qSummary = { draft: qCount('draft'), drafting: qCount('drafting') + qCount('picked') + qCount('rewrite'), failed: qCount('failed'), published: queue.filter((q) => q.status === 'published' && q.publishedAt >= daysAgo(28)).length, proposals: queue.filter((q) => q.type === 'proposal' && q.status === 'proposed').length };

const y = crawl.days[YESTERDAY];
const t = traffic.days[YESTERDAY];
const b = bing.days[YESTERDAY];
const rankDay = rank.days[Object.keys(rank.days).sort().at(-1)] ?? {};
const geoWeek = geo.weeks[Object.keys(geo.weeks).sort().at(-1)];
const num = (v) => (typeof v === 'number' ? v : null);
const top10 = (eng) => Object.entries(rankDay).filter(([, r]) => num(r[eng]) && r[eng] <= 10).map(([w, r]) => `${w}（${r[eng]}）`);
const top50 = (eng) => Object.values(rankDay).filter((r) => num(r[eng]) && r[eng] <= 50).length;
const spiders = Object.entries(y?.spiders ?? {}).sort((a, b) => b[1].hits - a[1].hits);
const engines = Object.entries(y?.human?.engines ?? {}).sort((a, b) => b[1] - a[1]);
const week = (pick) => Array.from({ length: 7 }, (_, i) => daysAgo(i + 1)).reverse().map((d) => ({ d, v: pick(d) }));

const summary = {
  date: TODAY, for: YESTERDAY,
  visits: t?.uv ?? null, pv: t?.pv ?? null,
  humanHits: y?.human?.hits ?? null, fromEngines: engines.reduce((s, [, v]) => s + v, 0),
  baiduspider: y?.spiders?.Baiduspider?.hits ?? null, baiduPages: Object.keys(y?.spiders?.Baiduspider?.pages ?? {}).length,
  bingIndexed: b?.indexed ?? null,
  rankTop10: { baidu: top10('baidu').length, bing: top10('bing').length }, rankTop50: { baidu: top50('baidu'), bing: top50('bing') }, rankWords: Object.keys(rankDay).length,
  geo: geoWeek ? Object.values(geoWeek).flatMap((w) => Object.values(w)).filter((x) => x.cited).length : null,
  opportunities: findings.opportunities?.length ?? 0, lowCtr: findings.lowCtrPages?.length ?? 0, weakLinks: findings.weakLinks?.length ?? 0, decline: findings.decline?.length ?? 0,
  spider404: findings.crawl?.notFound?.length ?? 0, notCrawled: findings.crawl?.notCrawled?.length ?? 0, deadSources: findings.deadSources?.length ?? 0,
  steps: lastRun.steps ?? [],
  channels7, distPending: distPending.length,
  queue: qSummary, drafts: queue.filter((q) => q.type === 'article' && q.status === 'draft').map((q) => ({ id: q.id, title: q.title ?? q.keyword, pass: q.checks?.pass, todo: q.checks?.todo ?? 0 })),
  liveProblems: live.problems ?? [], changesToday, fixManual, leads28: { 咨询: leads28.filter((l) => l.type === '咨询').length, 报名: leads28.filter((l) => l.type === '报名').length, total: leads.length },
  trend: { visits: week((d) => traffic.days[d]?.uv ?? crawl.days[d]?.human?.hits ?? null), baiduspider: week((d) => crawl.days[d]?.spiders?.Baiduspider?.hits ?? null) },
};

const L = [];
L.push(`# SEO 日报 ${TODAY}（数据到 ${YESTERDAY}）\n`);
L.push('## 一眼看');
L.push(`- 访客：${t ? `${fmt(t.uv)} 人 / ${fmt(t.pv)} PV（百度统计）` : `页面请求 ${fmt(y?.human?.hits)}（服务器日志，百度统计还没接）`}；搜索引擎来访 ${engines.map(([k, v]) => `${k} ${v}`).join('、') || '0'}`);
L.push(`- 蜘蛛：${spiders.map(([k, v]) => `${k} ${v.hits} 次 / ${Object.keys(v.pages).length} 页${v.status['404'] ? `（404 ${v.status['404']}）` : ''}`).join('；') || '昨天没有蜘蛛记录'}`);
L.push(`- 排名：${summary.rankWords} 个词，百度前 10 的 ${summary.rankTop10.baidu} 个、前 50 的 ${summary.rankTop50.baidu} 个；必应前 10 的 ${summary.rankTop10.bing} 个、前 50 的 ${summary.rankTop50.bing} 个${top10('baidu').length ? `。百度前 10：${top10('baidu').join('、')}` : ''}`);
if (b) L.push(`- Bing：索引 ${fmt(b.indexed)} 页，抓取 ${fmt(b.crawled)}，外链 ${fmt(b.inbound)}，展现 ${fmt(b.impressions)} / 点击 ${fmt(b.clicks)}`);
if (geoWeek) L.push(`- GEO（本周）：${Object.entries(geoWeek).map(([p, w]) => `${p} ${Object.values(w).filter((x) => x.cited).length}/${Object.keys(w).length}`).join('、')} 题提到本站`);
L.push('');
const sec = (title, rows, empty = '没有') => { L.push(`## ${title}`); if (!rows.length) L.push(`- ${empty}`); else L.push(...rows); L.push(''); };
sec('机会词', (findings.opportunities ?? []).slice(0, 20).map((o) => `- 【${o.action}】${o.word} ← ${o.source}${o.impressions != null ? `，展现 ${o.impressions} 点击 ${o.clicks ?? 0}` : ''}${o.rank ? `，排名 ${o.rank}` : ''}${o.page ? `，对应 ${o.page}` : ''}`), '没有新的机会词（需要百度站长、Bing 或排名数据）');
sec('有展现没人点的页面（改标题和描述）', (findings.lowCtrPages ?? []).map((p) => `- ${p.page}：展现 ${p.impressions}，点击 0（${p.basis}）`));
sec('排名变化', (findings.rankChanges ?? []).map((c) => `- ${c.word}：${c.engine} ${c.from} → ${c.to}`));
sec('弱内链（站内链接不到 2 条）', (findings.weakLinks ?? []).map((w) => `- ${w.page}（${w.inbound} 条）${w.suggest.length ? `，可从 ${w.suggest.join('、')} 链过来` : ''}`));
sec('衰退页（近 7 天比前 7 天少 30%+）', (findings.decline ?? []).map((d) => `- ${d.page}：${d.before} → ${d.now}（${d.basis}）`));
sec('抓取异常', [
  ...(findings.crawl?.notFound ?? []).slice(0, 15).map((n) => `- ${n.spider} 抓到 404：${n.path}（${n.hits} 次）`),
  ...(findings.crawl?.notCrawled ?? []).map((u) => `- 7 天没被百度抓过：${u}`),
]);
sec('来源失效', (findings.deadSources ?? []).map((d) => `- ${d.url}（${d.status}）出现在 ${d.in.join('、')}`), sources.date ? `没有（${sources.date} 查了 ${sources.checked} 个链接）` : '还没查');
sec('线上巡检', (live.problems ?? []).map((p) => `- ${p.url}：${p.issue}`), live.date ? `正常（${live.date} 查了 ${live.checked} 页）` : '还没查');
sec('脚本改了什么', changesToday.map((c) => `- 【${c.type}】${c.file.replace('src/content/articles/', '')}：${c.what}`), '今天没有自动改动');
sec('待人工处理', fixManual.map((m) => `- ${m.file.replace('src/content/articles/', '')}：${m.what}`));
L.push('## 内容流水线');
L.push(`- 待审核 ${qSummary.draft} 篇，在写 ${qSummary.drafting} 篇，写失败 ${qSummary.failed} 篇，近 28 天发布 ${qSummary.published} 篇，建议新增选题 ${qSummary.proposals} 条 → http://localhost:8088/pages/aidev-seo-review.html`);
for (const q of queue.filter((q) => q.type === 'article' && q.status === 'draft')) L.push(`- 待审：${q.title ?? q.keyword}（${q.id}，检查${q.checks?.pass ? '全过' : '有问题'}，待冬瓜确认 ${q.checks?.todo ?? 0} 处）`);
L.push('');
const channels7 = {};
for (const d of Array.from({ length: 7 }, (_, i) => daysAgo(i + 1))) for (const [k, v] of Object.entries(crawl.days[d]?.human?.channels ?? {})) channels7[k] = (channels7[k] ?? 0) + v;
const dist = readJson(`${DATA}/distribution.json`, { articles: {} });
const distPending = Object.values(dist.articles ?? {}).filter((a) => a.platforms && Object.keys(a.platforms).some((p) => !a.posted?.[p]));
L.push('## 分发（近 7 天从分发链接来的人）');
L.push(`- ${Object.keys(channels7).length ? Object.entries(channels7).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('、') : '还没有带 from= 参数的来访'}；待发的分发稿 ${distPending.length} 篇 → http://localhost:8088/pages/aidev-seo-distribute.html`);
L.push('');
L.push('## 转化（近 28 天）');
L.push(leads.length ? `- 咨询 ${leads28.filter((l) => l.type === '咨询').length}，报名 ${leads28.filter((l) => l.type === '报名').length}；来源：${Object.entries(leads28.reduce((o, l) => (o[l.source] = (o[l.source] ?? 0) + 1, o), {})).map(([k, v]) => `${k} ${v}`).join('、') || '-'}` : '- 还没有记录。有人加微信咨询或报名时，在 plan/seo/leads.csv 加一行：日期,咨询或报名,来源,备注');
L.push('- 意向事件（看实训营、点二维码、复制微信号）在百度统计 → 事件分析里看，分类「意向」');
L.push('');
if (findings.pageStats) {
  const ps = findings.pageStats;
  L.push(`## 页面状态（${ps.total} 页：推过 ${ps.pushed}，7 天内被百度抓过 ${ps.crawled7}，从没被抓 ${ps.neverCrawled}）`);
  L.push('| 页面 | 最近推送 | 最近被百度抓 | 百度展现 | 必应展现 | 7 天访问 |', '| --- | --- | --- | --- | --- | --- |');
  for (const p of findings.pages) L.push(`| ${p.url} | ${p.pushed || '-'} | ${p.crawled || '从没'} | ${p.baiduImp ?? '-'} | ${p.bingImp ?? '-'} | ${p.visits7 ?? '-'} |`);
  L.push('');
}
if (findings.notes?.length) sec('提醒', findings.notes.map((n) => `- ${n}`));
sec('脚本执行', (lastRun.steps ?? []).map((s) => `- ${s.ok ? '✓' : '✗'} ${s.label}（${s.seconds}s）${s.summary ? `：${s.summary}` : ''}`));

writeFileSync(`${DAILY}/${TODAY}.md`, L.join('\n') + '\n');
writeJson(`${DAILY}/latest.json`, { ...summary, markdown: L.join('\n'), findings });
console.log(`日报：${DAILY}/${TODAY}.md`);

const alerts = [];
if (summary.spider404 >= 5) alerts.push(`蜘蛛抓到 ${summary.spider404} 个 404`);
if (summary.deadSources) alerts.push(`${summary.deadSources} 个来源打不开`);
if (summary.decline) alerts.push(`${summary.decline} 页流量下滑`);
if (live.problems?.some((p) => /状态/.test(p.issue))) alerts.push(`线上有页面打不开`);
const failed = (lastRun.steps ?? []).filter((s) => !s.ok && !s.skipped);
if (failed.length) alerts.push(`${failed.map((s) => s.label).join('、')}失败`);
// 可选：把日报推到企业微信 / 飞书群机器人（deploy.env 里 DAILY_WEBHOOK_URL=，企业微信和飞书的 markdown 格式都支持）
const { loadEnv } = await import('./lib.mjs');
const hook = loadEnv().DAILY_WEBHOOK_URL;
if (hook) {
  const md = L.slice(0, 40).join('\n');
  const body = /feishu|lark/.test(hook) ? { msg_type: 'text', content: { text: md } } : { msgtype: 'markdown', markdown: { content: md.slice(0, 4000) } };
  await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) }).then((r) => console.log(`日报推群：${r.status}`)).catch((e) => console.log('日报推群失败：' + e.message));
}
notify('冬瓜站 SEO 日报', alerts.length ? alerts.join('；') : `正常。机会词 ${summary.opportunities}，百度蜘蛛 ${summary.baiduspider ?? '-'} 次`);
