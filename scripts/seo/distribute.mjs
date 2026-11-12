import { runAI } from './ai.mjs';
// 分发稿：给最近发布的文章生成知乎回答、小红书文案、V2EX 帖、公众号推文（Claude 无头），存 plan/seo/data/distribution.json。
// 发布由人点（分发页一键复制 / 预填），公众号可以直接推进草稿箱。
// 用法：node scripts/seo/distribute.mjs            近 7 天发布、还没生成过的文章
//       node scripts/seo/distribute.mjs <id>       指定文章（已有就重新生成）
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import { readJson, writeJson, TODAY, DATA, SITE, daysAgo, argValue } from './lib.mjs';

const FILE = `${DATA}/distribution.json`;
const DIR = 'src/content/articles';
const dist = readJson(FILE, { articles: {} });
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
const days = Number(argValue('days') ?? 7);
const articles = readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = readFileSync(`${DIR}/${f}`, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return { id: f.replace(/\.md$/, ''), fm: m ? parse(m[1]) : {}, body: m?.[2] ?? '', raw };
}).filter((a) => !a.fm.draft && a.fm.kind !== 'flow');
const targets = only ? articles.filter((a) => a.id === only) : articles.filter((a) => !dist.articles[a.id] && String(a.fm.date).slice(0, 10) >= daysAgo(days));
if (!targets.length) { console.log('分发稿：没有要生成的文章（近 ' + days + ' 天没有新发布，或都生成过了）'); process.exit(0); }

const RULES = `## 冬瓜的内容规矩（必须遵守）
- 读者是运营、产品、创业者、老板，不是想当程序员的人。大白话，短句。
- 滑梯写法：每句留一个信息缺口，下一句补上，再留下一个，让人一路滑到底。
- 标题全部是读者心里的问句，不是「教你……」「保姆级」。
- 不吹不卖：不写「轻松」「秒懂」「干货」「必看」；不承诺结果。
- 结尾不写硬广（不喊报名、不报课名）。收在「系统缺口」上：这一步做完后面还有哪几层、哪层最容易卡，再加一句互动（评论区问 / 想看下一篇扣 1）。想学的人会自己去主页。
- 每条都带原文链接，用这个格式：${SITE}/articles/<id>/?from=<平台代号>（平台代号：zhihu / xhs / v2ex / wechat）。小红书正文不能放外链，链接写进「评论区文案」。
- 事实只用原文里有的，不要新增任何数字或规则；原文里的「待冬瓜确认」内容不要写进分发稿。`;

function prompt(a) {
  return `把下面这篇 eryx.cn 的文章改写成四个平台的分发稿。只输出一个 JSON（放在 \`\`\`json 代码块里），不要别的话。

${RULES}

## 各平台要求
- zhihu：以「回答一个问题」的形式。question 是知乎上读者会搜的问句（≤ 30 字）；body 600～1000 字，先给结论再给关键步骤和坑，末尾一句「完整步骤和官方来源我整理在：<原文链接>」+ 系统缺口 + 互动。纯文本，段落之间空一行。
- xiaohongshu：title ≤ 20 字的问句（可带一个 emoji）；body 300～500 字，每行一句，短；结尾互动；tags 5～8 个（不带 #）；comment 是发在评论区的一句话，带原文链接。
- v2ex：V2EX 讨厌营销。title 平实（像「个人买域名，这几个坑我踩过」）；body 500～800 字的经验分享，Markdown，只在最后一行放原文链接「详细版：<链接>」；node 从 share / programmer / create / qna 里选一个最合适的。
- wechat：title ≤ 30 字；digest ≤ 120 字；html 是公众号正文 HTML（只用 <p><h2><ul><li><strong><blockquote>），1200～1800 字，保留原文的步骤和表格要点（表格改成列表），末尾一段：原文链接 + 「有想法想做成产品、或者想自己用 AI 做出来的，微信 Eryx999」（这是开发线，可以直接说找我做）。

## JSON 结构
{"zhihu":{"question":"","body":""},"xiaohongshu":{"title":"","body":"","tags":[],"comment":""},"v2ex":{"title":"","body":"","node":""},"wechat":{"title":"","digest":"","html":""}}

## 原文（${SITE}/articles/${a.id}/）
${a.raw}
`;
}

for (const a of targets) {
  console.log(`分发稿：${a.fm.title}…`);
  const r = runAI(prompt(a), {readOnly:true,timeout:15 * 60 * 1000});
  if(r.status!==0||r.error){console.error('Codex分发稿失败',r.stderr);process.exitCode=1;continue;}
  const out = (r.stdout || '').trim();
  const json = out.match(/```json\s*([\s\S]*?)```/)?.[1] ?? out.match(/\{[\s\S]*\}/)?.[0];
  let pkg;
  try { pkg = JSON.parse(json); } catch { process.exitCode=1; console.log('  解析失败：' + out.slice(-200)); continue; }
  for (const [k, code] of [['zhihu', 'zhihu'], ['xiaohongshu', 'xhs'], ['v2ex', 'v2ex'], ['wechat', 'wechat']]) if (pkg[k]) pkg[k].link = `${SITE}/articles/${a.id}/?from=${code}`;
  dist.articles[a.id] = { title: a.fm.title, url: `${SITE}/articles/${a.id}/`, date: String(a.fm.date).slice(0, 10), generatedAt: TODAY, platforms: pkg, posted: dist.articles[a.id]?.posted ?? {} };
  writeJson(FILE, dist);
  console.log(`  好了：知乎「${pkg.zhihu?.question}」· 小红书「${pkg.xiaohongshu?.title}」· V2EX「${pkg.v2ex?.title}」（${pkg.v2ex?.node}）· 公众号「${pkg.wechat?.title}」`);
}
try { spawnSync('node', ['scripts/seo/distribute-page.mjs'], { stdio: 'ignore' }); } catch {}
