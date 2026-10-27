// 对照选题地图（plan/topic-map.yaml）检查文章和关键词
// 报错（构建中止）：
//   - 文章在地图里没有节点
//   - 两个节点、或节点和聚合页用了同一个词（keyword cannibalization）
//   - 缺 intent / keyword / stage / platforms，或 links 指向不存在的节点
// 提示：
//   - 两个词字面上很像：搜一下，前 10 条结果重合多就并成一篇；
//     确认意图不同的，在地图节点的 distinct 里登记，之后不再提示
//   - 地图里写的阶段 / 形态 / 文章主词和文章 frontmatter 不一致
//   - 两篇都已发布，但正文里没按 links 链过去
//   - 已发布的文章没有 sources（参考来源）
// 用法：npm run check:keywords（npm run build 会先自动跑一遍）
//       npm run check:keywords -- --report  额外打印覆盖矩阵、待写的 P1、未核对的文章、缺导语的聚合页
import { existsSync } from 'node:fs';
import { ROADMAP, PLATFORMS, TOPICS } from '../src/data/site.ts';
import { loadTopicMap } from './lib/topic-map.mjs';

const SIMILAR = 0.5; // 两个词的字符二元组 Jaccard 相似度，超过就提示

const { map, nodes, articles, merged, errors, warnings } = loadTopicMap();
const STAGES = ROADMAP.map((s) => s.slug);
const PLATFORM_SLUGS = PLATFORMS.map((p) => p.slug);


for (const n of merged) {
  if (!n.intent) errors.push(`${n.id}: 缺少 intent（这篇服务的搜索意图）`);
  if (!n.keyword) errors.push(`${n.id}: 缺少 keyword（文章主词）`);
  if (!STAGES.includes(n.stage)) errors.push(`${n.id}: stage「${n.stage}」不是 ${STAGES.join(' / ')} 之一`);
  if (!n.platforms.length || n.platforms.some((p) => !PLATFORM_SLUGS.includes(p))) {
    errors.push(`${n.id}: platforms 必须是 ${PLATFORM_SLUGS.join(' / ')} 中的一个或几个`);
  }
  if (n.status === 'published' && !(articles.get(n.id).data.sources ?? []).length) {
    warnings.push(`${n.id}: 还没有 sources，规则、费用、流程类的说法要附官方来源`);
  }
  for (const to of n.distinct) if (!nodes.has(to)) errors.push(`${n.id}: distinct 里的 ${to} 在地图里不存在`);
  for (const to of n.links) {
    if (!nodes.has(to)) errors.push(`${n.id}: links 里的 ${to} 在地图里不存在`);
    else if (n.status !== 'planned' && articles.has(to) && !articles.get(to).data.draft) {
      if (!articles.get(n.id).linkText.includes(`/articles/${to}/`)) warnings.push(`${n.id}: 正文里还没链到 /articles/${to}/`);
    }
  }
}

// ── 撞词检查：站点主词、聚合页类目词、各节点的文章主词和长尾 ──
const normalize = (s) => String(s).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');

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

const owners = [
  { id: '首页', words: [map.site?.keyword, ...(map.site?.covers ?? [])] },
  ...ROADMAP.map((s) => ({ id: `阶段页 ${s.slug}`, words: [s.keyword] })),
  ...PLATFORMS.map((p) => ({ id: `形态页 ${p.slug}`, words: [p.keyword] })),
  ...merged.map((n) => ({ id: n.id, words: [n.keyword, ...n.covers] })),
];
// distinct 登记过的配对，不再提示相似
const distinctPairs = new Set(merged.flatMap((n) => n.distinct.flatMap((to) => [`${n.id}|${to}`, `${to}|${n.id}`])));
const terms = owners.flatMap((o) => o.words.filter(Boolean).map((t) => ({ id: o.id, raw: t, norm: normalize(t) })));

for (let i = 0; i < terms.length; i++) {
  for (let j = i + 1; j < terms.length; j++) {
    const x = terms[i];
    const y = terms[j];
    if (x.id === y.id) continue;
    if (x.norm === y.norm) {
      errors.push(`「${x.raw}」同时出现在 ${x.id} 和 ${y.id}：只能归一处，另一处删掉这个词`);
      continue;
    }
    // 一个词整个包含另一个（如「备案被驳回怎么办」含「备案被驳回」）也算很像
    const contains = Math.min(x.norm.length, y.norm.length) >= 4 && (x.norm.includes(y.norm) || y.norm.includes(x.norm));
    const score = similarity(x.norm, y.norm);
    if ((contains || score >= SIMILAR) && !distinctPairs.has(`${x.id}|${y.id}`)) {
      warnings.push(
        `${x.id}「${x.raw}」 ↔ ${y.id}「${y.raw}」 ${contains ? '互相包含' : `相似度 ${score.toFixed(2)}`}：` +
          '搜一下两个词，前 10 条结果重合多就并成一篇',
      );
    }
  }
}

// ── 覆盖矩阵 ──
if (process.argv.includes('--report')) {
  const pad = (s, n) => s + ' '.repeat(Math.max(0, n - [...s].reduce((w, c) => w + (c.charCodeAt(0) > 255 ? 2 : 1), 0)));
  console.log('\n阶段 × 形态（已发布 / 计划总数）');
  console.log(pad('', 10) + PLATFORMS.map((p) => pad(p.name, 10)).join(''));
  for (const s of ROADMAP) {
    const row = PLATFORMS.map((p) => {
      const cell = merged.filter((n) => n.stage === s.slug && n.platforms.includes(p.slug));
      const done = cell.filter((n) => n.status === 'published').length;
      return pad(cell.length ? `${done} / ${cell.length}` : '—', 10);
    });
    console.log(pad(`${s.step} ${s.name}`, 10) + row.join(''));
  }
  const todo = merged.filter((n) => n.status !== 'published' && n.priority === 'P1');
  console.log(`\n待写的 P1（${todo.length} 篇）`);
  for (const n of todo) console.log(`  ${pad(n.id, 34)} ${n.keyword}`);

  const unreviewed = merged.filter((n) => n.status === 'published' && !articles.get(n.id).data.reviewed);
  console.log(`\n已发布但还没核对（没填 reviewed）（${unreviewed.length} 篇）`);
  for (const n of unreviewed) console.log(`  ${n.id}`);

  // 有文章的聚合页才需要导语；空页本来就 noindex
  const live = merged.filter((n) => n.status === 'published');
  const hubs = [
    ...ROADMAP.filter((s) => live.some((n) => n.stage === s.slug)).map((s) => `stages/${s.slug}`),
    ...PLATFORMS.filter((p) => live.some((n) => n.platforms.includes(p.slug))).map((p) => `platforms/${p.slug}`),
    ...TOPICS.filter((t) => live.some((n) => n.topics.includes(t.slug))).map((t) => `topics/${t.slug}`),
  ].filter((id) => !existsSync(`src/content/hubs/${id}.md`));
  console.log(`\n有文章但缺导语的聚合页（${hubs.length} 个）`);
  for (const id of hubs) console.log(`  src/content/hubs/${id}.md`);
  console.log('');
}

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\n关键词检查失败：${errors.length} 个错误`);
  process.exit(1);
}
const published = merged.filter((n) => n.status === 'published').length;
console.log(`关键词检查通过：地图 ${merged.length} 个节点（已发布 ${published}），${terms.length} 个词，${warnings.length} 条提示`);
