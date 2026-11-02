// ── 上线流程：全站唯一定义的地方 ──────────────────────────
//
// 每一步有一个流程页 /flow/<slug>/。首页路线图、导航、面包屑、文章侧栏的「你在第几步」、
// 选题地图和检查脚本都从这里读。文章和选题节点的 stage 字段填这里的 slug。
//
// 以后怎么改：
//   改名         只改 name / short，网址不变
//   调整顺序     只改 order，「第几步」自动重排，网址不变
//   增加一步     加一条（slug 用英文，定下就别改），再把相关文章的 stage 改过来
//   删除 / 合并  删掉这一条，在 FLOW_MOVED 里写「旧 slug: 并入的 slug」，旧网址自动 301 跳转；
//                还在用旧 slug 的文章和选题节点，构建和 npm run check:keywords 会报错
//   改 slug      尽量别改；非改不可时同样在 FLOW_MOVED 里写「旧: 新」
//
// keyword 是这个流程页要承接的类目词。某一步有流程页文章（kind: flow）时，
// 以那篇文章的文章主词为准，这里的 keyword 只在还没写流程页文章时用。
// 还没写流程页的几步，keyword 是暂定的，写的时候用 scripts/research/verify-terms.mjs 的前缀法核实再定。

export const FLOW = [
  {
    slug: 'idea', order: 1, name: '想清楚做什么', short: '想清楚', icon: '💡',
    keyword: '产品想法怎么落地',
    desc: '第一版做到哪、砍掉哪些功能、值不值得做',
    stuck: '想做的太多，第一版迟迟定不下来',
  },
  {
    slug: 'base', order: 2, name: '选底子：开源二开还是从零写', short: '选底子', icon: '🧱',
    keyword: '开源项目二次开发',
    desc: '找一个现成的开源项目改，还是让 AI 从零写',
    stuck: '找不到合适的现成项目，或者拿来跑不起来',
  },
  {
    slug: 'accounts', order: 3, name: '工具和账号', short: '工具账号', icon: '🔑',
    keyword: 'AI 编程工具和开发者账号',
    desc: 'AI 编程工具、开发者账号、小程序账号',
    stuck: '工具和账号：注册、验证、付款',
  },
  {
    slug: 'build', order: 4, name: '开发和报错', short: '开发', icon: '🛠️',
    keyword: '不会编程怎么用 AI 做产品',
    desc: '说想法、让 AI 写和改、看懂报错、存好版本',
    stuck: '让 AI 做出能跑的东西、处理满屏报错',
  },
  {
    slug: 'deploy', order: 5, name: '服务器和部署', short: '部署', icon: '🖥️',
    keyword: '轻量应用服务器怎么搭建网站',
    desc: '要不要服务器、怎么选、怎么把项目放上去',
    stuck: '本地能跑，别人打不开：服务器和部署',
  },
  {
    slug: 'domain', order: 6, name: '域名、备案和 HTTPS', short: '域名备案', icon: '🌐',
    keyword: '域名备案和 HTTPS',
    desc: '买域名、做解析、ICP 备案、配上小锁',
    stuck: '域名解析、ICP 备案和 HTTPS',
  },
  {
    slug: 'payment', order: 7, name: '收款和资质', short: '收款', icon: '💰',
    keyword: '个人开发者怎么收款',
    desc: '没执照怎么收、执照和商户号、接入支付',
    stuck: '收款：第一笔钱怎么进账',
  },
  {
    slug: 'review', order: 8, name: '上架审核', short: '审核', icon: '✅',
    keyword: '上架审核被驳回',
    desc: '小程序、App Store、应用市场提审与驳回',
    stuck: '小程序或 App Store 的提审和驳回',
  },
  {
    slug: 'grow', order: 9, name: '上线后：运维、更新、获客', short: '上线后', icon: '📈',
    keyword: '网站上线后怎么维护',
    desc: '网站挂了、续费、更新版本、让人找到你',
    stuck: '上线后的运维、续费和获客',
  },
] as const;

// 删掉或合并掉的步骤：旧 slug → 现在的 slug。旧的 /flow/<旧>/ 自动 301 到新地址
export const FLOW_MOVED: Record<string, string> = {};

// 改版前的网址 → 现在的网址（构建时生成 301 跳转）
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/categories/': '/flow/',
  '/categories/accounts/': '/flow/accounts/',
  '/categories/build/': '/flow/build/',
  '/categories/deploy/': '/flow/deploy/',
  '/categories/payment/': '/flow/payment/',
  '/categories/review/': '/flow/review/',
  // 服务器部署这篇改成了「服务器和部署」的流程页
  '/articles/deploy-site-to-server/': '/flow/deploy/',
  // 2026-11 改版期间首页提案的草稿地址
  '/v3/': '/',
  // 2026-11 改版期间支柱页的草稿地址 /step1/ ~ /step9/，正式地址是 /flow/<slug>/
  ...Object.fromEntries(['idea', 'base', 'accounts', 'build', 'deploy', 'domain', 'payment', 'review', 'grow'].map((slug, i) => [`/step${i + 1}/`, `/flow/${slug}/`])),
};

export type FlowSlug = (typeof FLOW)[number]['slug'];
export type FlowStep = (typeof FLOW)[number] & { step: number };

// 按 order 排好、带上「第几步」的流程
export const FLOW_STEPS: FlowStep[] = [...FLOW].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, step: i + 1 }));
export const FLOW_SLUGS = FLOW_STEPS.map((s) => s.slug) as [FlowSlug, ...FlowSlug[]];
export const flowOf = (slug: string) => FLOW_STEPS.find((s) => s.slug === slug)!;
export const flowUrl = (slug: string) => `/flow/${slug}/`;

// 所有要生成的 301 跳转：改版前的网址 + 删掉 / 合并掉的步骤
export function allRedirects(): Record<string, string> {
  const out: Record<string, string> = { ...LEGACY_REDIRECTS };
  for (const [from, to] of Object.entries(FLOW_MOVED)) out[flowUrl(from)] = flowUrl(to);
  return out;
}
