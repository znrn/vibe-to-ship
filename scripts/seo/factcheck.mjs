// 发布前事实核查：另起一个只读的 Claude（claude -p），对照文章自己列的官方来源逐条核对。
// 文章无人审核直接上线，这是最后一道关；输出解析不了一律当不通过（fail closed）。
// 用法：node scripts/seo/factcheck.mjs <id>      打印结果 JSON
//       import { factCheck } from './factcheck.mjs'
import { existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { DATA } from './lib.mjs';

const DIR = 'src/content/articles';

const prompt = (file) => `你是 eryx.cn（冬瓜站）的发布前事实核查编辑。另一个 AI 刚写好 ${file}，它会**无人审核直接上线**，你是最后一道关。只读，不要修改任何文件。

先用 Read 读这篇文章（frontmatter 和正文都要看）。frontmatter 里的 sources 是作者声称核对过的官方页面。

## 判定为 high（必须拦下）
- 数字、费用、时限、规则、条件、流程步骤：用 WebFetch 打开 sources 里对应的官方页面核对，页面上找不到依据，或和页面矛盾。页面打不开的，这句话也算没有依据。只核对 sources 里的页面，不要自己去搜别的来源。
- 编造的数据或来源：没有出处的百分比、调查、用户数、收入数字、案例、媒体报道。
- 对某个产品、平台、公司的具体断言（功能、价格、限制、缺点），sources 里没有它的官方页面支撑。
- 教人绕开服务商地区限制、规避平台审核、借用他人资质或证件。
- 法律、税务、财务方面的承诺或确定性结论（如「一定能过」「不用交税」）。
- 正文链到 /articles/ 下不存在的文章（可以用 Glob 看 ${DIR}/ 下有哪些 .md，带 draft: true 的算不存在）。
- 还留着「待冬瓜确认」标记。

## 判定为 low（记录，不拦）
语句不通、错别字、通用经验类建议（如「先用最小版本上线」）没有出处。

## 输出
只输出一个 JSON 对象，不要输出其他文字，不要用代码块：
{"pass": true 或 false, "issues": [{"severity": "high" 或 "low", "quote": "原文片段（≤60字）", "problem": "问题说明"}]}
有任何 high 问题时 pass 为 false；没有问题时 issues 为空数组。`;

export function factCheck(id) {
  const file = `${DIR}/${id}.md`;
  if (!existsSync(file)) return { ok: false, issues: [{ severity: 'high', quote: '', problem: '文章文件不存在' }] };
  const r = spawnSync('claude', ['-p', '--output-format', 'text', '--allowedTools', 'Read', 'Glob', 'Grep', 'WebFetch'], {
    input: prompt(file), encoding: 'utf8', timeout: 20 * 60 * 1000, maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' },
  });
  const raw = ((r.stdout || '') + (r.stderr || '')).trim();
  writeFileSync(`${DATA}/factcheck-${id}.log`, raw + '\n');
  let data = null;
  try { data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? ''); } catch {}
  if (!data || typeof data !== 'object') return { ok: false, issues: [{ severity: 'high', quote: '', problem: `事实核查没有给出有效结果：${raw.split('\n').pop()?.slice(0, 120) ?? ''}` }], invalid: true };
  const issues = Array.isArray(data.issues) ? data.issues : [];
  return { ok: data.pass === true && !issues.some((i) => i.severity === 'high'), issues };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2];
  if (!id) { console.log('用法：node scripts/seo/factcheck.mjs <id>'); process.exit(1); }
  console.log(JSON.stringify(factCheck(id), null, 2));
}
