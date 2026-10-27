// 导出关键词查询表（CSV），拿去百度营销关键词规划师 / 5118 批量查搜索量
// 用法：node scripts/research/export-keywords.mjs           只导 P1，写到 plan/research/keywords-p1.csv
//       node scripts/research/export-keywords.mjs --all     导出全部节点，写到 plan/research/keywords-all.csv
// 第一列就是关键词，批量查询时整列复制粘贴即可；其余列给自己对照用。
// 文件带 UTF-8 BOM，Excel / WPS 直接打开不乱码。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const all = process.argv.includes('--all');
const out = `plan/research/keywords-${all ? 'all' : 'p1'}.csv`;
const { merged } = loadTopicMap();
const demand = existsSync('plan/research/demand.json') ? JSON.parse(readFileSync('plan/research/demand.json', 'utf8')).demand : {};

const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const rows = [['关键词', '类型', '节点', '优先级', '状态', '需求分（联想词）']];
const seen = new Set();
for (const n of merged.filter((n) => all || n.priority === 'P1')) {
  for (const [i, kw] of [n.keyword, ...n.covers].entries()) {
    const key = kw.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([kw, i === 0 ? '主词' : '长尾', n.id, n.priority, n.status, i === 0 ? (demand[n.id]?.score ?? '') : '']);
  }
}

writeFileSync(out, '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n');
console.log(`已导出 ${rows.length - 1} 个关键词 → ${out}`);
