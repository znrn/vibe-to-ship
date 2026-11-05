// 自动版每日编排：check →（可选 push）→ 刷新 auto console → 写日报。
// 用法：npm run seo:auto
//       npm run seo:auto -- --push   才推百度（默认关；且原版今天已推则仍跳过）
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const AUTO = 'plan/seo/auto';
mkdirSync(join(AUTO, 'daily'), { recursive: true });

const wantPush = process.argv.includes('--push');
const now = new Date();
const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const steps = [];

function run(label, cmd) {
  console.log(`\n== ${label} ==`);
  console.log(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    process.stdout.write(out);
    steps.push({ label, ok: true });
    return out;
  } catch (e) {
    const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '') + (e.message || '');
    process.stdout.write(out);
    // check 有必须改会 exit 1，编排继续
    steps.push({ label, ok: false, message: (e.message || '').slice(0, 200) });
    return out;
  }
}

run('站内检查', 'node scripts/seo-auto/check.mjs');

if (wantPush) {
  run('百度推送（opt-in）', 'node scripts/seo-auto/push.mjs --push');
} else {
  console.log('\n== 百度推送 ==\n跳过（默认关；需要时：npm run seo:auto -- --push）');
  steps.push({ label: '百度推送', ok: true, skipped: true });
}

run('刷新自动工作台', `node scripts/seo-auto/today.mjs${wantPush ? ' --push' : ''}`);

const lastRunPath = join(AUTO, 'last-run.json');
const lastRun = existsSync(lastRunPath) ? JSON.parse(readFileSync(lastRunPath, 'utf8')) : {};
lastRun.orchestrator = { date: ymd, time: now.toTimeString().slice(0, 8), zone: 'Asia/Shanghai', steps, push: wantPush };
writeFileSync(lastRunPath, JSON.stringify(lastRun, null, 2) + '\n');

console.log(`\n完成。自动工作台：http://localhost:8088/pages/aidev-seo-auto.html`);
console.log(`记录：${lastRunPath}`);
