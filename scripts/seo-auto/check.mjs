// 自动版站内检查：复用原版 runSeoCheck，结果只写 plan/seo/auto/。
// 用法：npm run seo:auto:check
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runSeoCheck } from '../seo-check.mjs';

const AUTO = 'plan/seo/auto';
mkdirSync(AUTO, { recursive: true });

const result = runSeoCheck({ print: true });
const now = new Date();
const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const out = {
  date: ymd,
  time: now.toTimeString().slice(0, 8),
  zone: 'Asia/Shanghai',
  pages: result.pages ?? 0,
  errors: result.errors,
  warns: result.warns,
};
writeFileSync(join(AUTO, 'last-check.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`\n已写入 ${AUTO}/last-check.json`);
process.exit(result.errors.length ? 1 : 0);
