// 读取选题地图（plan/topic-map.yaml）和文章，合并成节点列表
// 文章写出来以后以文章 frontmatter 为准，地图只提供 priority / links / distinct
// check-keywords.mjs 和 topic-map-page.mjs 共用
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export const DIR = 'src/content/articles';
export const MAP = 'plan/topic-map.yaml';

export function loadTopicMap() {
  const errors = [];
  const warnings = [];

  // ── 读文章 ──
  const articles = new Map();
  for (const f of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(DIR, f), 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const data = m ? parse(m[1]) : {};
    const id = f.replace(/\.md$/, '');
    // 正文 + 常见问题 + next 都算「链出去」
    const linkText = [m?.[2] ?? '', JSON.stringify(data.faq ?? []), data.next ? `/articles/${data.next}/` : ''].join('\n');
    articles.set(id, { data, linkText });
  }

  // ── 读地图，用文章覆盖 ──
  const map = existsSync(MAP) ? parse(readFileSync(MAP, 'utf8')) : { nodes: [] };
  const nodes = new Map();
  for (const n of map.nodes ?? []) {
    if (nodes.has(n.id)) errors.push(`地图里 ${n.id} 出现了两次`);
    nodes.set(n.id, n);
  }

  const merged = [];
  for (const [id, n] of nodes) {
    const a = articles.get(id);
    const status = a ? (a.data.draft ? 'draft' : 'published') : 'planned';
    if (a) {
      for (const key of ['stage', 'keyword']) {
        if (n[key] && n[key] !== a.data[key]) warnings.push(`${id}: 地图 ${key}「${n[key]}」和文章「${a.data[key]}」不一致，以文章为准`);
      }
      if (n.platforms && [...n.platforms].sort().join() !== [...(a.data.platforms ?? [])].sort().join()) {
        warnings.push(`${id}: 地图 platforms 和文章不一致，以文章为准`);
      }
    }
    const d = a ? a.data : n;
    merged.push({
      id,
      status,
      title: a?.data.title,
      priority: n.priority ?? 'P3',
      stage: d.stage,
      platforms: d.platforms ?? [],
      topics: d.topics ?? [],
      intent: d.intent,
      keyword: d.keyword,
      covers: d.covers ?? [],
      links: n.links ?? [],
      distinct: n.distinct ?? [],
    });
  }

  for (const id of articles.keys()) {
    if (!nodes.has(id)) errors.push(`${id}: 文章在 ${MAP} 里没有节点，先在地图里登记（至少写 id 和 priority）`);
  }

  return { map, nodes, articles, merged, errors, warnings };
}
