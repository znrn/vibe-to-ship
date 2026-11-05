// 自动版百度推送包装：默认关闭，避免和原版 seo:push / seo:today 抢每天配额。
// 用法：
//   npm run seo:auto:push              → 只提示，不推
//   npm run seo:auto:push -- --push    → 若原版今天已推过则跳过，否则调用原版 scripts/seo-push.mjs
// 会把本次决定写到 plan/seo/auto/last-push.json；仍读写共享的 plan/seo/baidu-pushed.json（与原版一致）。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const AUTO = 'plan/seo/auto';
const LOG = 'plan/seo/baidu-pushed.json';
mkdirSync(AUTO, { recursive: true });

const wantPush = process.argv.includes('--push');
const now = new Date();
const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

function note(status, message, extra = {}) {
  const rec = { date: ymd, time: now.toTimeString().slice(0, 8), zone: 'Asia/Shanghai', status, message, ...extra };
  writeFileSync(join(AUTO, 'last-push.json'), JSON.stringify(rec, null, 2) + '\n');
  console.log(message);
  return rec;
}

if (!wantPush) {
  note('skipped', '百度推送：自动版默认关闭。确认不和原版抢配额后再加 --push');
  process.exit(0);
}

const pushedLog = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : {};
const already = Object.values(pushedLog).includes(ymd);
if (already) {
  note('skipped-original-done', '百度推送：原版今天已有推送记录，自动版跳过');
  process.exit(0);
}

try {
  const out = execSync('node scripts/seo-push.mjs', { encoding: 'utf8' }).trim();
  const line = out.split('\n')[0] || '百度推送完成';
  note('ok', line, { detail: out });
} catch (e) {
  const msg = (e.stdout?.toString() || e.message || '百度推送失败').trim();
  note('error', msg);
  process.exit(1);
}
