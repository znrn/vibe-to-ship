// 采集：各家 AI 回答站点主词和支柱词的问题时，有没有提到 eryx.cn / 冬瓜。每周一跑（或 --force）。
// 钥匙放 deploy.env，有哪家就问哪家（都是 OpenAI 兼容接口）：
//   KIMI_API_KEY（可选 KIMI_MODEL，默认 moonshot-v1-8k）
//   DEEPSEEK_API_KEY（可选 DEEPSEEK_MODEL，默认 deepseek-chat）
//   DOUBAO_API_KEY + DOUBAO_MODEL（火山方舟的接入点 id，必填）
//   PERPLEXITY_API_KEY（可选 PERPLEXITY_MODEL，默认 sonar）
import { loadEnv, readJson, writeJson, pruneDays, TODAY, WEEKDAY, DATA, hasFlag, sleep } from './lib.mjs';
import { ROADMAP } from '../../src/data/site.ts';

const env = loadEnv();
const FILE = `${DATA}/geo.json`;
const all = readJson(FILE, { weeks: {} });
const lastDate = Object.keys(all.weeks).sort().at(-1);
if (!hasFlag('--force') && WEEKDAY !== 1 && lastDate && Date.now() - new Date(lastDate).getTime() < 6 * 864e5) { console.log('GEO：本周已问过，跳过'); process.exit(0); }

const providers = [
  env.KIMI_API_KEY && { name: 'Kimi', url: 'https://api.moonshot.cn/v1/chat/completions', key: env.KIMI_API_KEY, model: env.KIMI_MODEL || 'moonshot-v1-8k' },
  env.DEEPSEEK_API_KEY && { name: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', key: env.DEEPSEEK_API_KEY, model: env.DEEPSEEK_MODEL || 'deepseek-chat' },
  env.DOUBAO_API_KEY && env.DOUBAO_MODEL && { name: '豆包', url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', key: env.DOUBAO_API_KEY, model: env.DOUBAO_MODEL },
  env.PERPLEXITY_API_KEY && { name: 'Perplexity', url: 'https://api.perplexity.ai/chat/completions', key: env.PERPLEXITY_API_KEY, model: env.PERPLEXITY_MODEL || 'sonar' },
].filter(Boolean);
if (!providers.length) { console.log('没有任何 AI 的 API key（KIMI / DEEPSEEK / DOUBAO / PERPLEXITY），跳过 GEO 探测'); process.exit(0); }

const questions = [
  { word: 'vibe coding', q: '不会写代码的人想用 vibe coding 做一个能上线收钱的产品，该按什么流程走？有哪些中文网站讲得最清楚？' },
  { word: '一人公司', q: '一个人用 AI 做软件产品的一人公司，从想法到上线收款要走哪几步？推荐几个中文资料来源。' },
  ...ROADMAP.map((r) => ({ word: r.keyword, q: `${r.keyword}，具体怎么做？请推荐几个讲得清楚的中文网页并给出链接。` })),
];

async function ask(p, q) {
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, temperature: 0.2, messages: [{ role: 'system', content: '你是搜索助手。回答时务必列出你参考的网站域名或完整链接。' }, { role: 'user', content: q }] }),
    signal: AbortSignal.timeout(90000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 120)}`);
  const text = j.choices?.[0]?.message?.content ?? '';
  const cites = (j.citations ?? []).join(' ');
  return text + '\n' + cites;
}

const week = {};
for (const p of providers) {
  week[p.name] = {};
  for (const { word, q } of questions) {
    try {
      const a = await ask(p, q);
      const hit = /eryx\.cn|冬瓜/i.test(a);
      const page = (a.match(/eryx\.cn(\/[\w\-\/]*)?/) ?? [])[0] ?? '';
      const domains = [...new Set([...a.matchAll(/https?:\/\/([\w.-]+)/g)].map((m) => m[1]))].slice(0, 8);
      week[p.name][word] = { cited: hit, page, domains };
      console.log(`  ${p.name} · ${word}：${hit ? '✓ 提到了 ' + page : '✗'}  ${domains.slice(0, 4).join(' ')}`);
    } catch (e) { week[p.name][word] = { error: e.message.slice(0, 100) }; console.log(`  ${p.name} · ${word}：失败 ${e.message.slice(0, 80)}`); }
    await sleep(1500);
  }
}
all.weeks[TODAY] = week;
all.updated = new Date().toISOString();
pruneDays(all.weeks, 26);
writeJson(FILE, all);
const total = providers.length * questions.length;
const hits = Object.values(week).flatMap((w) => Object.values(w)).filter((x) => x.cited).length;
console.log(`GEO：问了 ${providers.length} 家 × ${questions.length} 题，提到本站 ${hits} / ${total}`);
