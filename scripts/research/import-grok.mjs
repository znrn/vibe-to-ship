// 导入 grokbot 的采集结果，转成本项目的问法格式，写到 plan/research/grok.json
// 用法：node scripts/research/import-grok.mjs [采集目录] [关键词库页面]
//   默认读 ~/launchpad/keyword-harvest-2026-10-27/all-queries.json 和 ~/launchpad/pages/aidev-keyword-bank.html
//
// 来源分三类：
//   真实问法（各平台联想词、相关搜索、知乎问题等）→ 直接当证据，source 换成本项目的命名
//   grok 自己写的说法（种子问法、关键词库的词）  → source 记为 grok_seed / grok_bank，要先用 verify-terms.mjs 核实
//   竞品文章标题和 FAQ                          → source 记为 competitor，只作写文章的参考，不当搜索证据
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const harvestDir = process.argv[2] ?? `${homedir()}/launchpad/keyword-harvest-2026-10-27`;
const bankPage = process.argv[3] ?? `${homedir()}/launchpad/pages/aidev-keyword-bank.html`;

const SOURCE = {
  baidu_suggest: 'baidu',
  baidu_related: 'baidu_related',
  baidu_index_related: 'baidu_index',
  google_suggest: 'google',
  google_related_search: 'google_related',
  paa: 'google_paa',
  trends_related: 'google_trends',
  zhihu: 'zhihu',
  douyin_suggest: 'douyin',
  xhs_suggest: 'xhs',
  competitor_heading: 'competitor',
  competitor_faq: 'competitor',
  seed: 'grok_seed',
};

const rows = [];
const harvest = JSON.parse(readFileSync(`${harvestDir}/all-queries.json`, 'utf8'));
for (const r of harvest) {
  const source = SOURCE[r.source];
  if (!source || !r.query) continue;
  rows.push({ q: r.query.trim(), source, seed: r.seed ?? '', origin: 'grok', ...(r.url ? { url: r.url } : {}) });
}

// 关键词库：页面里的 KEYWORD_DATA，term 和 related 都是 grok 写的说法
if (existsSync(bankPage)) {
  const m = readFileSync(bankPage, 'utf8').match(/<script id="KEYWORD_DATA" type="application\/json">([\s\S]*?)<\/script>/);
  const bank = m ? JSON.parse(m[1]) : { layers: [] };
  for (const layer of bank.layers) {
    for (const cat of layer.categories) {
      for (const it of cat.items) {
        for (const q of [it.term, ...(it.related ?? [])]) {
          rows.push({ q, source: 'grok_bank', seed: it.term, origin: 'grok', layer: layer.id, category: cat.name, intent: it.intent ?? '' });
        }
      }
    }
  }
}

writeFileSync('plan/research/grok.json', JSON.stringify({ imported: new Date().toISOString(), from: [harvestDir, bankPage], rows }, null, 1));
const count = {};
for (const r of rows) count[r.source] = (count[r.source] ?? 0) + 1;
console.log(`导入 ${rows.length} 条 → plan/research/grok.json`);
console.log(Object.entries(count).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join('，'));
