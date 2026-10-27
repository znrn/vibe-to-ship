// 把一轮问法整理的最终建议应用到选题地图（保留注释和格式）
// 用法：node scripts/research/apply-proposals.mjs plan/research/proposals-r2.yaml
//
// 支持的建议字段（格式见 plan/research/CURATION.md）：
//   changes      改主词 / 升级 / 降级（node 以 hub: 开头的是聚合页类目词，只打印出来，需手动改 src/data/site.ts）
//   add_covers   补长尾；已发布文章的长尾写进文章 frontmatter
//   new_nodes    新增节点，插到同阶段最后一个节点后面；可带 links / topics
//   moves        [{ term, from, to }] 把长尾从一个节点挪到另一个（拆分时用）
//   links        { 节点 id: [要补链到的节点 id] }
// 同一个词不会重复加；和节点自身文章主词相同的长尾会跳过。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parse, parseDocument, YAMLSeq } from 'yaml';

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error('用法：node scripts/research/apply-proposals.mjs <建议文件.yaml>');
  process.exit(1);
}
const MAP = 'plan/topic-map.yaml';
const ARTICLES = 'src/content/articles';
const STAGES = ['accounts', 'build', 'deploy', 'payment', 'review'];
const norm = (s) => String(s).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const val = (x) => x?.value ?? x;

const p = parse(readFileSync(file, 'utf8'));
const doc = parseDocument(readFileSync(MAP, 'utf8'));
const seq = doc.get('nodes');
const find = (id) => seq.items.find((it) => it.get('id') === id);
const log = [];

// ── 已发布文章：长尾和文章主词在 frontmatter 里 ──
const articlePath = (id) => `${ARTICLES}/${id}.md`;
const isPublished = (id) => existsSync(articlePath(id));
function editArticle(id, fn) {
  const text = readFileSync(articlePath(id), 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = parseDocument(m[1]);
  fn(fm);
  writeFileSync(articlePath(id), `---\n${fm.toString({ lineWidth: 0, flowCollectionPadding: false }).trimEnd()}\n---${text.slice(m[0].length)}`);
}
// 节点或文章的 covers 序列 + 文章主词
function withCovers(id, fn) {
  if (isPublished(id)) return editArticle(id, (fm) => fn(fm));
  return fn(find(id));
}
function covers(holder) {
  let c = holder.get('covers');
  if (!c) {
    holder.set('covers', new YAMLSeq());
    c = holder.get('covers');
  }
  return c;
}
function addTerms(id, terms) {
  if (!find(id)) return log.push(`✗ 补长尾：节点 ${id} 不存在`);
  withCovers(id, (h) => {
    const c = covers(h);
    const have = new Set([...c.items.map((x) => norm(val(x))), norm(h.get('keyword') ?? find(id).get('keyword'))]);
    for (const t of terms) if (!have.has(norm(t))) { c.add(t); have.add(norm(t)); }
  });
}
function removeTerm(id, term) {
  withCovers(id, (h) => {
    const c = covers(h);
    const before = c.items.length;
    c.items = c.items.filter((x) => norm(val(x)) !== norm(term));
    if (c.items.length === before) log.push(`⚠ 挪长尾：${id} 里没有「${term}」`);
  });
}

// 1 调整
for (const c of p.changes ?? []) {
  if (c.node.startsWith('hub:')) { log.push(`→ 聚合页类目词需手动改 src/data/site.ts：${c.node} → ${c.to}`); continue; }
  const node = find(c.node);
  if (!node) { log.push(`✗ 调整：节点 ${c.node} 不存在`); continue; }
  if (c.action === '改主词') {
    if (isPublished(c.node)) editArticle(c.node, (fm) => fm.set('keyword', c.to));
    else node.set('keyword', c.to);
  } else if (c.action === '升级' || c.action === '降级') node.set('priority', c.to);
  else log.push(`→ 「${c.action}」需手动处理：${c.node} → ${c.to}`);
}
// 2 新节点（先插入，后面的长尾和链接才能指向它们）
const stageOf = (it) => it.get('stage') ?? (isPublished(it.get('id')) ? parse(readFileSync(articlePath(it.get('id')), 'utf8').match(/^---\n([\s\S]*?)\n---/)[1]).stage : null);
for (const n of p.new_nodes ?? []) {
  if (find(n.id)) { log.push(`✗ 新节点 ${n.id} 已存在，跳过`); continue; }
  const node = doc.createNode({
    id: n.id, stage: n.stage, platforms: n.platforms, ...(n.topics?.length ? { topics: n.topics } : {}),
    priority: n.priority, intent: n.intent, keyword: n.keyword, covers: n.covers ?? [], links: n.links ?? [],
  });
  for (const k of ['platforms', 'topics', 'links']) if (node.get(k)) node.get(k).flow = true;
  let idx = -1;
  seq.items.forEach((it, i) => { if (STAGES.indexOf(stageOf(it)) <= STAGES.indexOf(n.stage)) idx = i; });
  seq.items.splice(idx + 1, 0, node);
}
// 3 挪长尾、补长尾
for (const m of p.moves ?? []) { removeTerm(m.from, m.term); addTerms(m.to, [m.term]); }
for (const a of p.add_covers ?? []) addTerms(a.node, a.terms);
// 4 补链接
for (const [id, to] of Object.entries(p.links ?? {})) {
  const node = find(id);
  if (!node) { log.push(`✗ 补链接：节点 ${id} 不存在`); continue; }
  let links = node.get('links');
  if (!links) { node.set('links', doc.createNode([])); links = node.get('links'); links.flow = true; }
  for (const t of to) if (!links.items.some((x) => val(x) === t)) links.add(t);
}

writeFileSync(MAP, doc.toString({ lineWidth: 0, flowCollectionPadding: false }));
console.log(`已应用 ${file}：地图现有 ${seq.items.length} 个节点`);
for (const l of log) console.log(l);
