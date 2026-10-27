// 导出关键词查询表（CSV），拿去百度营销关键词规划师 / 5118 批量查搜索量
// 用法：node scripts/research/export-keywords.mjs           站点主词 + 类目词 + P1 文章的词，写到 plan/research/keywords-p1.csv
//       node scripts/research/export-keywords.mjs --all     站点主词 + 类目词 + 全部文章的词，写到 plan/research/keywords-all.csv
// 第一列就是关键词，批量查询时整列复制粘贴即可；其余列给自己对照用。
// 「类型」列对应四层结构：站点主词（首页）/ 类目词（流程页、形态页）/ 文章主词 / 长尾。
// 文件带 UTF-8 BOM，Excel / WPS 直接打开不乱码。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ROADMAP, PLATFORMS } from '../../src/data/site.ts';
import { loadTopicMap } from '../lib/topic-map.mjs';

const all = process.argv.includes('--all');
const out = `plan/research/keywords-${all ? 'all' : 'p1'}.csv`;
const { map, merged } = loadTopicMap();
const demand = existsSync('plan/research/demand.json') ? JSON.parse(readFileSync('plan/research/demand.json', 'utf8')).demand : {};

const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const rows = [['关键词', '类型', '归属', '优先级', '状态', '需求分（联想词）']];
const seen = new Set();
const push = (kw, ...rest) => {
  const key = kw.toLowerCase().replace(/\s+/g, '');
  if (seen.has(key)) return;
  seen.add(key);
  rows.push([kw, ...rest]);
};

// 第 1 层：站点主词（首页），covers 也一起查
for (const kw of [map.site?.keyword, ...(map.site?.covers ?? [])].filter(Boolean)) push(kw, '站点主词', 'site', '', '', '');
// 第 2 层：类目词（流程页 / 形态页）
for (const s of ROADMAP) push(s.keyword, '类目词', `hub:flow/${s.slug}`, '', '', '');
for (const p of PLATFORMS) push(p.keyword, '类目词', `hub:platforms/${p.slug}`, '', '', '');
// 第 3、4 层：文章主词 + 长尾
for (const n of merged.filter((n) => all || n.priority === 'P1')) {
  for (const [i, kw] of [n.keyword, ...n.covers].entries()) {
    push(kw, i === 0 ? '文章主词' : '长尾', n.id, n.priority, n.status, i === 0 ? (demand[n.id]?.score ?? '') : '');
  }
}

writeFileSync(out, '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n');
const count = (t) => rows.filter((r) => r[1] === t).length;
console.log(`已导出 ${rows.length - 1} 个关键词 → ${out}`);
console.log(`  站点主词 ${count('站点主词')}，类目词 ${count('类目词')}，文章主词 ${count('文章主词')}，长尾 ${count('长尾')}`);
