// 每天早上由 launchd（cn.eryx.seo-daily）跑的总入口：采集 → 分析 → 日报 → 原版 seo-today（构建、站内检查、百度推送、工作台页面、待办）。
// 用法：npm run seo:daily                 全套
//       npm run seo:daily -- --quick      跳过慢的（排名、GEO）
//       npm run seo:daily -- --skip=rank,geo,tongji
//       npm run seo:daily -- --skip=fix    不自动改站、不自动部署
//       npm run seo:daily -- --deploy      即使没有改动也部署一次
//       npm run seo:daily -- --write       今天就选题写稿（默认每周一）；--skip=write 这周不写
//       npm run seo:daily -- --distribute  今天就生成分发稿（默认每周五）；--outreach 今天就扫外链（默认每月 1 号）
// 每步独立，一步失败不影响后面；每步的结果记在 plan/seo/data/last-run.json，日报里有「脚本执行」一栏。
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import { writeJson, TODAY, WEEKDAY, DATA, hasFlag, argValue, notify } from './lib.mjs';

// 任务锁：上一次还没跑完（或 Mac 睡醒后 launchd 补跑撞上）就不重复跑；锁超过 3 小时视为残留
const LOCK = `${DATA}/daily.lock`;
if (existsSync(LOCK)) {
  const age = Date.now() - Number(readFileSync(LOCK, 'utf8') || 0);
  if (age < 3 * 3600e3) { console.log(`上一次 seo:daily 还在跑（${Math.round(age / 60000)} 分钟前开始），这次跳过`); process.exit(0); }
}
writeFileSync(LOCK, String(Date.now()));
process.on('exit', () => { try { unlinkSync(LOCK); } catch {} });
// 断网就不采集（避免一堆超时和误判），只出日报提醒
const online = await fetch('https://eryx.cn/robots.txt', { signal: AbortSignal.timeout(10000) }).then((r) => r.ok).catch(() => false);

const skip = new Set((argValue('skip') ?? '').split(',').filter(Boolean));
if (hasFlag('--quick')) { skip.add('rank'); skip.add('geo'); }
const t0 = Date.now();
const steps = [];
const rec = (label, ok, seconds, summary, skipped = false) => { steps.push({ label, ok, seconds, summary, skipped }); writeJson(`${DATA}/last-run.json`, { date: TODAY, started: new Date(t0).toISOString(), steps }); };

function run(key, label, file, timeoutSec) {
  if (skip.has(key)) { console.log(`\n== ${label}：跳过`); rec(label, true, 0, '跳过', true); return; }
  console.log(`\n== ${label}`);
  const s = Date.now();
  const r = spawnSync('node', [`scripts/seo/${file}`], { encoding: 'utf8', timeout: timeoutSec * 1000, maxBuffer: 64 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  if (out) console.log(out.split('\n').map((l) => '  ' + l).join('\n'));
  const seconds = Math.round((Date.now() - s) / 1000);
  const ok = r.status === 0 && !r.error;
  const summary = r.error ? (r.error.code === 'ETIMEDOUT' ? `超时（${timeoutSec}s）` : r.error.message) : out.split('\n').filter(Boolean).pop()?.slice(0, 160) ?? '';
  rec(label, ok, seconds, summary);
}

console.log(`${TODAY} 冬瓜站 SEO 自动流水线${online ? '' : '（离线：跳过采集和推送）'}`);
if (!online) { for (const k of ['crawl', 'tongji', 'bing', 'console', 'sources', 'geo', 'rank']) skip.add(k); notify('冬瓜站 SEO', '网络不通，今天的采集跳过，联网后 npm run seo:daily 补跑'); }
// 0. 构建产物旧了就先构建（分析弱内链和推送都要 dist/）
const stale = !existsSync('dist/index.html') || execSync('find src public -type f -newer dist/index.html | head -1').toString().trim() !== '';
if (stale) {
  console.log('\n== 构建');
  const s = Date.now();
  const r = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', timeout: 300000 });
  rec('构建', r.status === 0, Math.round((Date.now() - s) / 1000), r.status === 0 ? '完成' : (r.stderr || r.stdout || '').trim().split('\n').pop()?.slice(0, 160));
}
run('crawl', '蜘蛛日志', 'collect-crawl.mjs', 180);
run('tongji', '百度统计', 'collect-tongji.mjs', 180);
run('bing', 'Bing', 'collect-bing.mjs', 120);
run('console', '百度站长', 'collect-baidu-console.mjs', 150);
run('sources', '来源检查', 'collect-sources.mjs', 300);
run('geo', 'GEO 探测', 'collect-geo.mjs', 900);
run('rank', '排名', 'collect-rank.mjs', 1500);
run('live', '线上巡检', 'collect-live.mjs', 300);
run('analyze', '分析', 'analyze.mjs', 60);

// ── 二期：自动改站 → 有改动就构建、部署、推送 ──
if (!skip.has('fix') && online) {
  run('fix', '自动改站', 'fix.mjs', 120);
  // 只看已跟踪文件的改动：草稿（draft: true，还没提交的新文件）不算，免得把待审稿提交进去
  const dirty = execSync('git status --porcelain -- src public').toString().split('\n').filter((l) => l && !l.startsWith('??')).join('\n').trim();
  const needDeploy = dirty || hasFlag('--deploy');
  if (needDeploy) {
    console.log('\n== 构建并部署（有改动）');
    const s = Date.now();
    let ok = false, msg = '';
    try {
      execSync('npm run build', { stdio: 'pipe', timeout: 300000 });
      const r = spawnSync('bash', ['scripts/deploy.sh'], { encoding: 'utf8', timeout: 600000 });
      process.stdout.write((r.stdout || '').split('\n').map((l) => '  ' + l).join('\n') + '\n');
      ok = r.status === 0;
      msg = ok ? '已部署并通过线上巡检' : '部署或巡检失败：' + ((r.stdout || '') + (r.stderr || '')).trim().split('\n').pop()?.slice(0, 120);
      if (ok && dirty) execSync(`git add -A src public && git commit -q -m "自动改站 ${TODAY}：$(node -e "const c=require('./plan/seo/data/changes.json').filter(x=>x.date==='${TODAY}');console.log(c.map(x=>x.type+' '+x.what).join('；').slice(0,180))")" --author="SEO 流水线 <seo@eryx.cn>"`, { stdio: 'ignore' });
    } catch (e) { msg = '构建失败：' + (e.stderr?.toString() || e.message).trim().split('\n').pop()?.slice(0, 120); }
    rec('构建部署', ok, Math.round((Date.now() - s) / 1000), msg);
    if (!ok) notify('冬瓜站 SEO', '自动部署失败，看日报；回退：bash scripts/rollback.sh');
  }
}

// ── 三期：每周一自动选题、写稿到「待审」（或 --write）；审核页每天刷新 ──
if ((WEEKDAY === 1 || hasFlag('--write')) && online && !skip.has('write')) {
  run('pick', '选题', 'pick-topic.mjs', 60);
  run('write', '写稿（Claude 无头）', 'write.mjs', 60 * 60);
}
run('review', '审核页', 'review-page.mjs', 60);

// ── 四期：每周五给本周发布的文章生成分发稿；每月 1 号扫外链；分发页每天刷新 ──
if ((WEEKDAY === 5 || hasFlag('--distribute')) && online && !skip.has('distribute')) run('distribute', '分发稿（Claude 无头）', 'distribute.mjs', 30 * 60);
if ((new Date().getDate() === 1 || hasFlag('--outreach')) && online && !skip.has('outreach')) run('outreach', '外链扫描', 'outreach.mjs', 20 * 60);
run('distpage', '分发页', 'distribute-page.mjs', 60);

run('report', '日报', 'report.mjs', 60);

// 原版工作台：构建 + 站内检查 + 百度推送 + 页面 + 待办（它会把 latest.json 渲染到页面顶部）
console.log('\n== 工作台（seo-today）');
const r = spawnSync('node', ['scripts/seo-today.mjs'], { stdio: 'inherit', timeout: 600000 });
rec('工作台', r.status === 0, 0, r.status === 0 ? '完成' : '失败');
console.log(`\n全部完成，用时 ${Math.round((Date.now() - t0) / 60000)} 分钟。失败的步骤：${steps.filter((s) => !s.ok).map((s) => s.label).join('、') || '无'}`);
