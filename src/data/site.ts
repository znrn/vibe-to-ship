import { FLOW_STEPS, FLOW_SLUGS, flowOf } from './flow.ts';
// 全站共用的配置和文案。带「待填」「占位」的地方，定稿前替换成真实信息。

export const SITE = {
  name: '冬瓜 AI 独立开发实战站',
  shortName: '冬瓜',
  tagline: 'AI 独立开发',
  url: 'https://eryx.cn',
  description:
    'Vibe coding 一人公司：不会写代码，也能靠 AI 一个人把网站、小程序、App 做到上线并收到钱。按 9 步讲清楚每一步你来决定什么、交给 AI 做什么、哪些事只能你亲自做。',
  // 首页标题：站点主词 vibe coding、一人公司（2026-10-28 按百度指数定）
  homeTitle: 'Vibe Coding 一人公司：不会写代码，也能靠 AI 把产品做到上线并收到钱',
  // 定位的一句话定义，来自 plan/METHOD.md，首页和入口页都用这一句
  definition: 'AI 独立开发者，是不会写代码、但能靠 AI 一个人把产品做到上线并收到钱的人。',
  author: {
    name: '冬瓜',
    description: '不写代码的独立开发者，产品代码都由 AI 写。',
  },
  // 公开仓库地址（2026-11-03 开源）。留空时导航和首页的 GitHub 按钮会自动隐藏。
  github: 'https://github.com/znrn/vibe-to-ship' as string,
  icp: '浙ICP备19008373号-1',
};

// 「AI 独立开发者是什么」入口页：承接定义类问法，和首页的站点主词分开，参与撞词检查
export const WHAT_IS = {
  path: '/ai-indie-dev/',
  keyword: '独立开发者是什么意思',
  covers: ['什么是独立开发者', 'ai独立开发者是什么意思', '独立开发者是干嘛的', '独立开发者适合新手吗'],
};

// 读者和不适合的人，来自 plan/METHOD.md
export const AUDIENCE = [
  {
    who: '产品经理',
    icon: '🧩',
    pain: '想法只能画原型、写文档，研发说「做不了」「排期满了」，沟通一来一回全是失真',
    want: '自己做出一个别人能点开、能用的版本，拿真东西去说服人',
  },
  {
    who: '创业者 / 个体老板',
    icon: '🚀',
    pain: '外包报价动辄几万、要等一两个月，还不确定有没有人买；想试的点子太多，试不起',
    want: '几天、几百块做出能收钱的第一版，先验证有没有人付钱再决定投入',
  },
  {
    who: '不会写代码的互联网从业者',
    icon: '📣',
    pain: '运营、市场、设计，业务想法多，提需求总被排在后面；想做个小工具或副业，卡在「不会代码」',
    want: '自己把小工具、活动页、副业产品做出来并上线，不再等别人',
  },
];
export const NOT_FOR = [
  { who: '已经有全栈开发能力的人', why: '缺的不是这套方法，可能是流量和运营' },
  { who: '想着「学了就能一夜暴富」的人', why: '这里教的是把产品做出来、上线、收到第一笔钱，赚不赚钱取决于产品有没有人要' },
];

// 免费的中间台阶：加微信 / 领清单。目前都是占位。
export const FREE_STEP = {
  wechat: { label: '加冬瓜微信', value: 'Eryx999', qr: '/images/wechat-qr.png', note: '备注「上线」，拉你进交流群（群待建）' },
  // 清单准备好后填 href（文件或页面地址），为空时文章末尾不显示这一块
  checklist: { label: '领《完整上线清单》', note: '从备账号到过审核的完整勾选清单', href: '' },
};

// 48 小时实战营。只承诺保底档：公网上线 + 收款链路跑通。
export const CAMP = {
  name: '48 小时实战营',
  format: '线下 · 小班 6~10 人',
  price: '¥ 9800',
  // 划线原价
  originalPrice: '¥ 13800',
  priceNote: '首期种子价 · 含两天午餐、助教、课后 30 天答疑',
  promises: [
    '结业时产品在公网可访问，带 HTTPS',
    '收款流程跑通：现成收款工具真实收到一笔，或支付沙盒演示成功',
    '课前 3 周开始按清单备资质，有执照和商户号的，现场接自己的微信支付',
  ],
  href: '/camp/',
};

// ── 内容骨架：上线流程 × 形态 ──────────────────────────────
// 主骨架是「9 步上线流程 × 四种产品形态」：每篇文章挂在一步流程上（决定面包屑和流程页），
// 适用于一种或几种形态（形态页按流程串成该形态的完整上线路线）。
// 工具、成本、岗位、排错这类跨流程的视角，作为「专题」标签挂在文章上。
// 流程的定义和以后怎么增删改，见 src/data/flow.ts。

// 兼容旧代码：ROADMAP 就是按顺序排好、带 step 的流程
export const ROADMAP = FLOW_STEPS;

export const STAGE_SLUGS = FLOW_SLUGS;
export const stageOf = flowOf;

// 四种产品形态，各有一个「完整上线流程」聚合页
export const PLATFORMS = [
  // keyword 是百度指数里有量的类目词（2026-10-28 冬瓜查过：做网站、小程序开发、app开发），headline 是页面标题
  { slug: 'web', name: '网站', icon: '🖥️', keyword: '做网站', headline: '做网站：不会写代码，自己用 AI 从零做到上线', desc: '从一个单页到能收款的网站：域名、服务器、备案、HTTPS' },
  { slug: 'miniprogram', name: '小程序', icon: '🟢', keyword: '小程序开发', headline: '小程序开发：不找外包，自己用 AI 做到上线', desc: '注册主体、选类目、备案、提审，个人和个体户能做到哪一步' },
  { slug: 'app', name: 'App', icon: '📱', keyword: 'app开发', headline: 'app开发：不找外包，自己用 AI 做到上架', desc: 'App Store 和国内安卓市场：开发者账号、软著、备案、审核' },
  { slug: 'desktop', name: '桌面软件', icon: '💻', keyword: '个人桌面软件发布流程', headline: '桌面软件：自己用 AI 做到打包发布', desc: 'Windows / Mac 软件打包、签名、公证和分发' },
] as const;

export type PlatformSlug = (typeof PLATFORMS)[number]['slug'];
export const PLATFORM_SLUGS = PLATFORMS.map((p) => p.slug) as [PlatformSlug, ...PlatformSlug[]];
export const platformOf = (slug: string) => PLATFORMS.find((p) => p.slug === slug)!;

// 跨阶段的专题标签
export const TOPICS = [
  { slug: 'tools', name: '工具怎么选', icon: '🧰', desc: '主力工具怎么搭，国产 AI 能帮到哪' },
  { slug: 'cost', name: '成本与时间账', icon: '🧮', desc: '外包报价 vs 自己做；一共要花多少钱和时间' },
  { slug: 'roles', name: '按岗位对号', icon: '🧭', desc: '运营、产品、老板第一周各容易卡在哪' },
  { slug: 'debug', name: '翻车与排错', icon: '🧯', desc: '报错怎么问 AI；备案、审核被驳回怎么改' },
  { slug: 'works', name: '作品证明', icon: '🏆', desc: '真实上线的产品和完整复盘' },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];
export const TOPIC_SLUGS = TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]];
export const topicOf = (slug: string) => TOPICS.find((t) => t.slug === slug)!;

export const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
