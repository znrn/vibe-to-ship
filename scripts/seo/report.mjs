// 日报：把采集和分析结果写成 plan/seo/daily/<日期>.md 和 latest.json（工作台页面读它），异常发 macOS 通知。
import { writeFileSync } from 'node:fs';
import { readJson, writeJson, TODAY, YESTERDAY, daysAgo, DATA, DAILY, fmt, notify } from './lib.mjs';

const crawl = readJson(`${DATA}/crawl.json`, { days: {} });
const traffic = readJson(`${DATA}/traffic.json`, { days: {} });
const bing = readJson(`${DATA}/bing.json`, { days: {} });
const rank = readJson(`${DATA}/rank.json`, { days: {} });
const geo = readJson(`${DATA}/geo.json`, { weeks: {} });
const sources = readJson(`${DATA}/sources.json`, {});
const findings = readJson(`${DATA}/findings.json`, {});
const lastRun = readJson(`${DATA}/last-run.json`, {});

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
  opportunities: findings.opportunities?.length ?? 0, weakLinks: findings.weakLinks?.length ?? 0, decline: findings.decline?.length ?? 0,
  spider404: findings.crawl?.notFound?.length ?? 0, notCrawled: findings.crawl?.notCrawled?.length ?? 0, deadSources: findings.deadSources?.length ?? 0,
  steps: lastRun.steps ?? [],
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
sec('排名变化', (findings.rankChanges ?? []).map((c) => `- ${c.word}：${c.engine} ${c.from} → ${c.to}`));
sec('弱内链（站内链接不到 2 条）', (findings.weakLinks ?? []).map((w) => `- ${w.page}（${w.inbound} 条）${w.suggest.length ? `，可从 ${w.suggest.join('、')} 链过来` : ''}`));
sec('衰退页（近 7 天比前 7 天少 30%+）', (findings.decline ?? []).map((d) => `- ${d.page}：${d.before} → ${d.now}（${d.basis}）`));
sec('抓取异常', [
  ...(findings.crawl?.notFound ?? []).slice(0, 15).map((n) => `- ${n.spider} 抓到 404：${n.path}（${n.hits} 次）`),
  ...(findings.crawl?.notCrawled ?? []).map((u) => `- 7 天没被百度抓过：${u}`),
]);
sec('来源失效', (findings.deadSources ?? []).map((d) => `- ${d.url}（${d.status}）出现在 ${d.in.join('、')}`), sources.date ? `没有（${sources.date} 查了 ${sources.checked} 个链接）` : '还没查');
if (findings.pageStats) {
  const ps = findings.pageStats;
  L.push(`## 页面状态（${ps.total} 页：推过 ${ps.pushed}，7 天内被百度抓过 ${ps.crawled7}，从没被抓 ${ps.neverCrawled}）`);
  L.push('| 页面 | 最近推送 | 最近被百度抓 | 必应展现 | 7 天访问 |', '| --- | --- | --- | --- | --- |');
  for (const p of findings.pages) L.push(`| ${p.url} | ${p.pushed || '-'} | ${p.crawled || '从没'} | ${p.bingImp ?? '-'} | ${p.visits7 ?? '-'} |`);
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
