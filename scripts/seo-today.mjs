// 每天的 SEO / GEO 清单：按日期组合「每天 + 周几 + 每月 1 号 + 每季度」的事，先跑一遍站内检查。
// 用法：npm run seo:today            打印清单；要你亲自做的事写进 ~/launchpad/todos.json（同一天不重复）
//       npm run seo:today -- --no-todo  只打印，不写待办
// 规则和登录入口见 plan/seo-playbook.md
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { runSeoCheck } from './seo-check.mjs';

const today = new Date();
const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const weekday = today.getDay(); // 0 周日
const dom = today.getDate();
const month = today.getMonth() + 1;
const W = ['日', '一', '二', '三', '四', '五', '六'];
const PROJECT = 'AI 开发培训 · 冬瓜站 SEO';
const TODOS = join(homedir(), 'launchpad', 'todos.json');
const noTodo = process.argv.includes('--no-todo');

// ── 任务表：human = 要你亲自做，写进待办；auto = 脚本已经做或马上做 ──
const daily = [
  { human: true, title: '百度站长「流量与关键词」：昨天有展现没点击的词，记到 plan/seo/keywords.csv 的待写区', link: 'https://ziyuan.baidu.com/' },
  { human: true, title: '统计后台：昨天哪一页被看、从哪来', link: 'https://tongji.baidu.com/' },
  { human: true, title: '回复读者的问题，真实问题记进 plan/topic-map.yaml 当选题' },
];
const weekly = {
  1: [{ human: true, title: '定本周要写的一篇问题页：优先「有展现没点击」的词和读者问过的问题' }],
  3: [{ human: true, title: '内链：本周新文章链到所属支柱页，支柱页反链回来；看下面检查里的孤立页' }],
  5: [{ human: true, title: '分发：知乎 / V2EX / 即刻 / 小红书各发一条，带原文链接，记下哪个渠道来人' }],
  0: [
    { human: true, title: '收录：site:eryx.cn 和站长平台索引量，没收录的页手动提交', link: 'https://ziyuan.baidu.com/' },
    { human: true, title: '在 plan/seo/log.md 写两行：这周做了什么、看到什么' },
  ],
};
const monthly = [
  { human: true, title: 'plan/seo/keywords.csv 填当月排名；进前 20 的词加内链、更新内容' },
  { human: true, title: '流量最高的 3 页精修：补 FAQ、补来源、更新日期' },
  { human: true, title: '外链：找 2～3 个相关站点、公众号互推或投稿' },
  { human: true, title: 'GEO 核对：豆包 / Kimi / Perplexity / ChatGPT 各问一遍站点主词和 3 个支柱词，记录是否引用、引用哪页' },
  { auto: 'npm run check:links', title: '外链死链检查（要联网，约 1 分钟）' },
];
const quarterly = [
  { human: true, title: '关键词研究再做一轮（scripts/research），更新选题地图' },
  { human: true, title: 'PageSpeed Insights 跑首页和一个支柱页', link: 'https://pagespeed.web.dev/' },
  { human: true, title: '砍掉三个月零流量的方向，把精力集中到有搜索的词上' },
];

const sections = [['每天', daily], [`周${W[weekday]}`, weekly[weekday] ?? []]];
if (dom === 1) sections.push(['每月 1 号', monthly]);
if (dom === 1 && [1, 4, 7, 10].includes(month)) sections.push(['每季度', quarterly]);

console.log(`\n${ymd} 周${W[weekday]} · 冬瓜站 SEO / GEO 清单（规则见 plan/seo-playbook.md）\n`);
let n = 0;
const humanTasks = [];
for (const [name, tasks] of sections) {
  if (!tasks.length) continue;
  console.log(`【${name}】`);
  for (const t of tasks) {
    n++;
    console.log(`  ${n}. ${t.title}${t.link ? `  ${t.link}` : ''}${t.auto ? `  （脚本：${t.auto}）` : ''}`);
    if (t.human) humanTasks.push(t);
  }
}

// ── 站内检查：dist 比 src 旧就先构建 ──
console.log('\n【脚本检查】');
const distTime = existsSync('dist/index.html') ? Number(execSync('stat -f %m dist/index.html').toString()) : 0;
const srcTime = Number(execSync("find src public -type f -newer dist/index.html 2>/dev/null | head -1 | wc -l").toString().trim()) > 0 || !distTime;
if (srcTime) {
  console.log('  dist/ 过期，先构建…');
  execSync('npm run build', { stdio: 'ignore' });
}
const { errors, warns } = runSeoCheck({ print: false });
for (const e of errors) console.log('  ✗ ' + e);
for (const w of warns.slice(0, 15)) console.log('  ⚠ ' + w);
if (warns.length > 15) console.log(`  … 还有 ${warns.length - 15} 条建议，npm run seo:check 看全部`);
if (!errors.length && !warns.length) console.log('  站内检查全绿');

// ── 待办：写进 launchpad，同一天同一条不重复 ──
if (!noTodo && existsSync(TODOS)) {
  const todos = JSON.parse(readFileSync(TODOS, 'utf8'));
  let added = 0;
  for (const t of humanTasks) {
    const key = `${t.title}|${ymd}`;
    if (todos.some((x) => x.project === PROJECT && x.title === t.title && x.created === ymd)) continue;
    todos.push({ id: `t${Date.now()}${added}`, title: t.title, project: PROJECT, detail: `SEO 日常 · ${ymd}`, link: t.link ?? '', done: false, created: ymd });
    added++;
  }
  if (added) writeFileSync(TODOS, JSON.stringify(todos, null, 2) + '\n');
  console.log(`\n待办：${added ? `写入 ${added} 条到` : '今天的已在'} ${TODOS}（http://localhost:8088）`);
}
console.log('');
