// 导入关键词工具导出的搜索量，按四层结构汇总，写到 plan/research/volume.json（地图页会显示）
//   站点主词、类目词（流程页 / 形态页）各自记一个数；文章按节点把文章主词 + 长尾加总
// 用法：node scripts/research/import-volume.mjs <导出的文件.csv> [--column 列名]
//
// 兼容百度营销关键词规划师、5118、站长工具等导出的 CSV / TSV：
//   - 编码自动识别：UTF-8、UTF-16（带 BOM）、GBK
//   - 关键词列：表头含「关键词 / 关键字 / keyword」的第一列
//   - 搜索量列：表头含「整体 / 总」的搜索量列优先；否则把所有「搜索量 / 指数 / volume」列（如 PC + 移动）相加
//   - 5118 低等级账号导出的指数 / 检索量列都是「VIP特权数据」（被屏蔽成 0），这时改读「长尾词数」，
//     记为另一种指标，节点取各词最大值而不是加总（长尾词数互相包含，加总没意义）
//   - 也可以用 --column 指定列名
//   - 数值里的逗号、「<5」、「100-1000」这类区间都会换算成数字
// Excel 文件请先另存为 CSV。
// 多次导入会合并：同一个词以最新导入的数值为准。工具额外推荐的词（地图里没有）记在 extra 里，可以挑来补长尾。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { ROADMAP, PLATFORMS } from '../../src/data/site.ts';
import { loadTopicMap } from '../lib/topic-map.mjs';

const OUT = 'plan/research/volume.json';
const file = process.argv[2];
const colArg = process.argv.includes('--column') ? process.argv[process.argv.indexOf('--column') + 1] : null;
if (!file || !existsSync(file)) {
  console.error('用法：node scripts/research/import-volume.mjs <导出的文件.csv> [--column 列名]');
  process.exit(1);
}

// ── 读文件，识别编码 ──
const buf = readFileSync(file);
let text;
if (buf[0] === 0xff && buf[1] === 0xfe) text = new TextDecoder('utf-16le').decode(buf);
else if (buf[0] === 0xfe && buf[1] === 0xff) text = new TextDecoder('utf-16be').decode(buf);
else {
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    text = new TextDecoder('gbk').decode(buf);
  }
}
text = text.replace(/^﻿/, '');

// ── 解析 CSV / TSV（支持引号） ──
function parseLine(line, sep) {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { cells.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  cells.push(cur.trim());
  return cells;
}
const lines = text.split(/\r?\n/).filter((l) => l.trim());
const KW = /关键词|关键字|keyword/i;
// 5118 第一行是「批量查询关键词流量参数_xxx」标题，没有分隔符，跳过
const headerIdx = lines.findIndex((l) => KW.test(l) && /[,\t]/.test(l));
if (headerIdx < 0) {
  console.error('没找到含「关键词」的表头行，请确认文件是关键词工具导出的列表');
  process.exit(1);
}
const sep = (lines[headerIdx].match(/\t/g) ?? []).length > (lines[headerIdx].match(/,/g) ?? []).length ? '\t' : ',';
const header = parseLine(lines[headerIdx], sep);
const kwCol = header.findIndex((h) => KW.test(h));

let volCols;
const masked5118 = header.some((h) => /VIP特权数据/.test(h)) && header.includes('长尾词数');
if (colArg) {
  volCols = [header.indexOf(colArg)];
  if (volCols[0] < 0) {
    console.error(`没有名为「${colArg}」的列。可用的列：${header.join(' | ')}`);
    process.exit(1);
  }
} else if (masked5118) {
  volCols = [header.indexOf('长尾词数')];
} else {
  const VOL = /搜索量|指数|volume|searches/i;
  const candidates = header.map((h, i) => [h, i]).filter(([h, i]) => i !== kwCol && VOL.test(h) && !/竞争|出价|价格|变化|趋势|同比|环比/.test(h));
  const total = candidates.filter(([h]) => /整体|总/.test(h));
  volCols = (total.length ? total.slice(0, 1) : candidates).map(([, i]) => i);
}
if (!volCols.length) {
  console.error(`没识别出搜索量列，请用 --column 指定。可用的列：${header.join(' | ')}`);
  process.exit(1);
}

// 「1,234」「<5」「100-1000」「—」都换算成数字
function toNumber(v) {
  const s = String(v ?? '').replace(/[,，\s]/g, '');
  if (!s || /^[-—–]$/.test(s)) return 0;
  const lt = s.match(/^[<＜](\d+(?:\.\d+)?)/);
  if (lt) return Number(lt[1]) / 2;
  const range = s.match(/^(\d+(?:\.\d+)?)(?:[-~～至到])(\d+(?:\.\d+)?)/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// ── 关键词 → 站点主词 / 类目词 / 文章节点 ──
const norm = (s) => String(s).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const { map, merged } = loadTopicMap();
const HUBS = [
  ...ROADMAP.map((s) => ({ id: `flow/${s.slug}`, name: `流程页 · ${s.name}`, keyword: s.keyword })),
  ...PLATFORMS.map((p) => ({ id: `platforms/${p.slug}`, name: `形态页 · ${p.name}`, keyword: p.keyword })),
];
const siteTerms = [map.site?.keyword, ...(map.site?.covers ?? [])].filter(Boolean);
const owner = new Map();
for (const t of siteTerms) owner.set(norm(t), { term: t });
for (const h of HUBS) owner.set(norm(h.keyword), { term: h.keyword });
for (const n of merged) for (const t of [n.keyword, ...n.covers]) owner.set(norm(t), { id: n.id, term: t });

const metric = volCols.length === 1 && header[volCols[0]] === '长尾词数' ? '长尾词数' : '搜索量';
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { terms: {}, extra: {}, imports: [] };
prev.metric ??= metric;
if (prev.metric !== metric) {
  console.error(`${OUT} 里已经是「${prev.metric}」，这次读到的是「${metric}」，两种数不能混在一起。要换指标请先删掉 ${OUT}`);
  process.exit(1);
}
const combine = metric === '长尾词数' ? (vals) => Math.max(...vals) : (vals) => vals.reduce((s, v) => s + v, 0);
let hit = 0;
let extra = 0;
for (const line of lines.slice(headerIdx + 1)) {
  const cells = parseLine(line, sep);
  const kw = cells[kwCol];
  if (!kw) continue;
  const vol = volCols.reduce((sum, i) => sum + toNumber(cells[i]), 0);
  const o = owner.get(norm(kw));
  if (o) { prev.terms[o.term] = vol; hit++; }
  else { prev.extra[kw] = vol; extra++; }
}

// ── 汇总：站点主词、类目词各记一个数，文章按节点把文章主词 + 长尾加总 ──
prev.site = Object.fromEntries(siteTerms.filter((t) => t in prev.terms).map((t) => [t, prev.terms[t]]));
prev.hubs = Object.fromEntries(HUBS.filter((h) => h.keyword in prev.terms).map((h) => [h.id, { name: h.name, keyword: h.keyword, volume: prev.terms[h.keyword] }]));
const nodes = {};
for (const n of merged) {
  const terms = [n.keyword, ...n.covers].filter((t) => t in prev.terms);
  if (!terms.length) continue;
  nodes[n.id] = {
    volume: combine(terms.map((t) => prev.terms[t])),
    keyword: prev.terms[n.keyword] ?? null,
    queried: terms.length,
    total: 1 + n.covers.length,
  };
}
prev.nodes = nodes;
prev.imports.push({ file: basename(file), at: new Date().toISOString(), columns: volCols.map((i) => header[i]), matched: hit, extra });
writeFileSync(OUT, JSON.stringify(prev, null, 1));

console.log(`读取 ${basename(file)}：${metric === '长尾词数' ? '5118 指数列被屏蔽，改读' : '搜索量列'} ${volCols.map((i) => `「${header[i]}」`).join(' + ')}`);
console.log(`对上地图的词 ${hit} 个，地图里没有的词 ${extra} 个（记在 extra，可挑来补长尾）`);
console.log(`站点主词：${Object.entries(prev.site).map(([t, v]) => `${t} ${v}`).join('，') || '无数据'}`);
console.log(`类目词：${Object.values(prev.hubs).map((h) => `${h.keyword} ${h.volume}`).join('，') || '无数据'}`);
console.log(`已有${metric}的文章节点 ${Object.keys(nodes).length} 个 → ${OUT}`);
const top = Object.entries(nodes).sort((a, b) => b[1].volume - a[1].volume).slice(0, 10);
for (const [id, v] of top) console.log(`  ${String(v.volume).padStart(8)}  ${id}（${v.queried}/${v.total} 个词有数据）`);
