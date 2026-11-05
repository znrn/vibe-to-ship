// 自动改站（二期）：只做有确定规则的事，改动写进 plan/seo/data/changes.json，日报里有「脚本改了什么」。
//   1. 弱内链：站内链接少于 2 条的文章，给同步骤的其他文章补 related（文末「相关问题」），不动正文
//   2. description 超过 120 字或不是完整句子：截到 120 字内最后一个句号 / 问号 / 感叹号
//   3. title 超过 42 字、description 不足 60 字、reviewed 超过 90 天：不自动改，进「待人工」
// 用法：node scripts/seo/fix.mjs           实际改
//       node scripts/seo/fix.mjs --dry     只报告
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { readJson, writeJson, TODAY, DATA, hasFlag } from './lib.mjs';

const DIR = 'src/content/articles';
const dry = hasFlag('--dry');
const CHANGES = `${DATA}/changes.json`;
const log = readJson(CHANGES, []);
const changes = [];
const manual = [];

// 文章：frontmatter 原文 + 解析
const articles = readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = readFileSync(join(DIR, f), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return { id: f.replace(/\.md$/, ''), file: join(DIR, f), raw, fm: m ? parse(m[1]) : {}, fmText: m?.[1] ?? '', body: m?.[2] ?? '' };
}).filter((a) => !a.fm.draft);
const byId = Object.fromEntries(articles.map((a) => [a.id, a]));

// 改 frontmatter 里的一个顶层标量字段（只动那一行，其他原样）
function setScalar(a, key, value) {
  const re = new RegExp(`^${key}:.*$`, 'm');
  const line = `${key}: ${JSON.stringify(value)}`;
  a.fmText = re.test(a.fmText) ? a.fmText.replace(re, line) : a.fmText + '\n' + line;
}
// 追加 related 列表（没有就新建）
function setRelated(a, ids) {
  const block = `related:\n${ids.map((i) => `  - ${i}`).join('\n')}`;
  a.fmText = /^related:/m.test(a.fmText) ? a.fmText.replace(/^related:\n(?:  - .*\n?)*/m, block + '\n') : a.fmText + '\n' + block;
}
const save = (a) => { if (!dry) writeFileSync(a.file, `---\n${a.fmText.replace(/\n+$/, '')}\n---\n${a.body}`); };

// ── 1. 弱内链 → related ──
function walk(dir, out = []) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (f.endsWith('.html')) out.push(p); } return out; }
if (existsSync('dist/index.html')) {
  const inbound = {};
  for (const f of walk('dist')) {
    const html = readFileSync(f, 'utf8');
    if (!/<head[\s>]/i.test(html)) continue;
    const from = '/' + f.slice(5).replace(/index\.html$/, '');
    for (const m of html.matchAll(/<a [^>]*href="(\/articles\/[^"#?/]+\/)"/g)) if (m[1] !== from) (inbound[m[1]] ??= new Set()).add(from);
  }
  for (const a of articles) {
    if (a.fm.kind === 'flow') continue;
    const url = `/articles/${a.id}/`;
    const from = inbound[url] ?? new Set();
    if (from.size >= 2) continue;
    // 让同步骤的其他文章在 related 里带上它（每篇最多 3 条 related）
    const donors = articles.filter((b) => b.id !== a.id && b.fm.kind !== 'flow' && b.fm.stage === a.fm.stage && !from.has(`/articles/${b.id}/`) && (b.fm.related ?? []).length < 3 && !(b.fm.related ?? []).includes(a.id)).slice(0, 2);
    for (const b of donors) {
      const ids = [...(b.fm.related ?? []), a.id];
      setRelated(b, ids); b.fm.related = ids; save(b);
      changes.push({ date: TODAY, type: '内链', file: b.file, what: `related 加 ${a.id}（${url} 只有 ${from.size} 条站内链接）` });
    }
    if (!donors.length) manual.push({ file: a.file, what: `${url} 站内链接只有 ${from.size} 条，同步骤没有可借的文章，手动从支柱页或首页加链接` });
  }
}

// ── 2. description 规则 ──
for (const a of articles) {
  const d = String(a.fm.description ?? '');
  if (d.length > 120 || (d.length >= 60 && !/[。！？)）]$/.test(d))) {
    const cut = d.slice(0, 120);
    const end = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'));
    if (end >= 59) {
      const nd = cut.slice(0, end + 1);
      setScalar(a, 'description', nd); a.fm.description = nd; save(a);
      changes.push({ date: TODAY, type: 'TDK', file: a.file, what: `description ${d.length} 字 → ${nd.length} 字（截到完整句子）` });
    } else manual.push({ file: a.file, what: `description ${d.length} 字，120 字内没有句号可截，手动改` });
  }
  if (d.length && d.length < 60) manual.push({ file: a.file, what: `description 只有 ${d.length} 字，补到 60～120 字` });
  const t = String(a.fm.title ?? '');
  if (t.length + 5 > 42) manual.push({ file: a.file, what: `title ${t.length} 字（加后缀超 42），手动缩短，关键词放前面` });
  // reviewed 超 90 天：不自动刷新（机器只能查链接活没活，核对内容是人的事）
  const rv = a.fm.reviewed ? new Date(a.fm.reviewed) : null;
  if (rv && (Date.now() - rv.getTime()) / 864e5 > 90) manual.push({ file: a.file, what: `reviewed ${a.fm.reviewed} 已超 90 天，对照来源重新核一遍再改日期` });
}

if (changes.length && !dry) writeJson(CHANGES, [...log, ...changes].slice(-500));
writeJson(`${DATA}/fix-manual.json`, { date: TODAY, items: manual });
console.log(`自动改站${dry ? '（只报告）' : ''}：改了 ${changes.length} 处${changes.length ? '：' + changes.map((c) => `${c.file.replace(DIR + '/', '')} ${c.what}`).join('；') : ''}；待人工 ${manual.length} 处`);
process.exit(0);
