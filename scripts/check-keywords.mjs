// 检查文章之间的关键词有没有撞车（keyword cannibalization）
// - 两篇文章用了同一个词（keyword 或 covers）：报错，构建中止
// - 两篇文章的词字面上很像：提示人工判断，是同一个意图就合并，不同意图就保留
// 用法：npm run check:keywords（npm run build 会先自动跑一遍）
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/articles';
const SIMILAR = 0.5; // 两个词的字符二元组 Jaccard 相似度，超过就提示

// 只解析需要的三个字段：intent、keyword、covers 列表
function parseFrontmatter(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const scalar = (key) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim();
  const list = fm.match(/^covers:\s*\n((?:\s+-\s+.+\n?)*)/m)?.[1] ?? '';
  const covers = list
    .split('\n')
    .map((l) => l.replace(/^\s+-\s+/, '').trim())
    .filter(Boolean);
  return { intent: scalar('intent'), keyword: scalar('keyword'), covers };
}

// 大小写、空格、标点不算区别
const normalize = (s) => s.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');

function bigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function similarity(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return a === b ? 1 : 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const articles = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ id: f.replace(/\.md$/, ''), ...parseFrontmatter(readFileSync(join(DIR, f), 'utf8')) }));

const errors = [];
const warnings = [];

for (const a of articles) {
  if (!a.intent) errors.push(`${a.id}: 缺少 intent（这篇文章服务的搜索意图）`);
  if (!a.keyword) errors.push(`${a.id}: 缺少 keyword（主关键词）`);
}

// 所有词摊平，带上来源文章
const terms = articles.flatMap((a) =>
  [a.keyword, ...a.covers].filter(Boolean).map((t) => ({ id: a.id, raw: t, norm: normalize(t) })),
);

for (let i = 0; i < terms.length; i++) {
  for (let j = i + 1; j < terms.length; j++) {
    const x = terms[i];
    const y = terms[j];
    if (x.id === y.id) continue;
    if (x.norm === y.norm) {
      errors.push(`「${x.raw}」同时出现在 ${x.id} 和 ${y.id}：只能归一篇，另一篇删掉这个词`);
      continue;
    }
    // 一个词整个包含另一个（如「备案被驳回怎么办」含「备案被驳回」）也算很像
    const contains = Math.min(x.norm.length, y.norm.length) >= 4 && (x.norm.includes(y.norm) || y.norm.includes(x.norm));
    const score = similarity(x.norm, y.norm);
    if (contains || score >= SIMILAR) {
      warnings.push(
        `${x.id}「${x.raw}」 ↔ ${y.id}「${y.raw}」 ${contains ? '互相包含' : `相似度 ${score.toFixed(2)}`}：` +
          '搜一下两个词，前 10 条结果重合多就并成一篇',
      );
    }
  }
}

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\n关键词检查失败：${errors.length} 个错误`);
  process.exit(1);
}
console.log(`关键词检查通过：${articles.length} 篇文章，${terms.length} 个词，${warnings.length} 条提示`);
