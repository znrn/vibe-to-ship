// 采集真实问法：搜索引擎联想词 + 技术社区帖子标题，写到 plan/research/raw.json
// 用法：node scripts/research/collect.mjs
// 每个来源串行请求、间隔 150ms；遇到连续失败就跳过该来源，不做任何绕过
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadTopicMap } from '../lib/topic-map.mjs';

const OUT = 'plan/research/raw.json';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 联想词种子：选题涉及的核心名词，加上常见的提问后缀
const CORE = [
  '个人开发者', '独立开发', 'AI编程', '不会编程做app', '不会编程做小程序', '不会编程做网站',
  '个人营业执照', '个体户营业执照', '微信支付商户号', '小程序注册', '个人小程序', '小程序类目',
  '苹果开发者账号', '安卓应用市场上架', '软著', '软件著作权', '代码签名证书', '微信开发者工具',
  '没有mac开发ios', 'flutter', 'uniapp', 'electron打包', '外包开发小程序', '网站不备案',
  '域名注册', '域名实名', '域名解析', '云服务器', '轻量应用服务器', 'ssl证书', 'ICP备案', '备案驳回',
  '个人备案', '经营性备案', '公安备案', '小程序备案', '小程序合法域名', 'app备案', '个人收款码',
  '网站接入微信支付', '网站接入支付宝', '个人小程序微信支付', '小程序虚拟支付', '苹果内购',
  '安卓app接入微信支付', '软件激活码', '产品定价', '小程序审核', '小程序隐私保护指引',
  'app store审核被拒', 'testflight', '华为应用市场审核', '隐私政策', '微信打不开网页',
  'mac已损坏', 'windows已保护你的电脑', 'vercel部署', 'app上架', '小程序上线',
];
const SUFFIX = ['', ' 怎么', ' 多久', ' 多少钱', ' 个人', ' 流程', ' 被驳回', ' 需要'];

const gbk = new TextDecoder('gbk');
const ENGINES = {
  baidu: async (q) => {
    const j = await (await fetch(`https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json();
    return (j.g ?? []).map((x) => x.q);
  },
  bing: async (q) => {
    const j = await (await fetch(`https://api.bing.com/osjson.aspx?mkt=zh-CN&query=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json();
    return j[1] ?? [];
  },
  so360: async (q) => {
    const j = await (await fetch(`https://sug.so.360.cn/suggest?encodein=utf-8&encodeout=utf-8&format=json&word=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json();
    return (j.result ?? []).map((x) => x.word);
  },
  sogou: async (q) => {
    const buf = await (await fetch(`https://sor.html5.qq.com/api/getsug?type=sogou&key=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).arrayBuffer();
    const m = gbk.decode(buf).match(/sug\((\[[\s\S]*\])\)/);
    return m ? JSON.parse(m[1])[1] ?? [] : [];
  },
};

const COMMUNITIES = {
  csdn: async (q) => {
    const j = await (await fetch(`https://so.csdn.net/api/v3/search?t=all&p=1&q=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json();
    return (j.result_vos ?? []).map((x) => ({ title: x.title?.replace(/<[^>]+>/g, ''), url: x.url }));
  },
  juejin: async (q) => {
    const j = await (await fetch('https://api.juejin.cn/search_api/v1/search', {
      method: 'POST',
      headers: { 'user-agent': UA, 'content-type': 'application/json' },
      body: JSON.stringify({ key_word: q, id_type: 0, cursor: '0', limit: 10, search_type: 0 }),
    })).json();
    return (j.data ?? []).map((x) => x.result_model?.article_info).filter(Boolean).map((a) => ({ title: a.title, url: `https://juejin.cn/post/${a.article_id}` }));
  },
  v2ex: async (q) => {
    const j = await (await fetch(`https://www.sov2ex.com/api/search?size=10&q=${encodeURIComponent(q)}`, { headers: { 'user-agent': UA } })).json();
    return (j.hits ?? []).map((h) => ({ title: h._source?.title, url: `https://www.v2ex.com/t/${h._id}` }));
  },
};

async function runSource(name, fn, queries, toRows) {
  const rows = [];
  let fails = 0;
  for (const q of queries) {
    try {
      rows.push(...toRows(q, await fn(q)));
      fails = 0;
    } catch (e) {
      if (++fails >= 5) {
        console.warn(`${name}: 连续失败 5 次，跳过剩余请求（${e.message}）`);
        break;
      }
    }
    await sleep(150);
  }
  console.log(`${name}: ${rows.length} 条`);
  return rows;
}

const { merged } = loadTopicMap();
const suggestQueries = CORE.flatMap((c) => SUFFIX.map((s) => (c + s).trim()));
const communityQueries = merged.map((n) => n.keyword);

const results = await Promise.all([
  ...Object.entries(ENGINES).map(([name, fn]) =>
    runSource(name, fn, suggestQueries, (seed, list) => list.map((q) => ({ q, source: name, seed }))),
  ),
  ...Object.entries(COMMUNITIES).map(([name, fn]) =>
    runSource(name, fn, communityQueries, (seed, list) => list.filter((x) => x.title).map((x) => ({ q: x.title, url: x.url, source: name, seed }))),
  ),
]);

const rows = results.flat();
mkdirSync('plan/research', { recursive: true });
writeFileSync(OUT, JSON.stringify({ collected: new Date().toISOString(), rows }, null, 1));
console.log(`共 ${rows.length} 条，写入 ${OUT}`);
