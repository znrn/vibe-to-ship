import { FLOW_STEPS, FLOW_SLUGS, flowOf } from './flow.ts';
// 全站共用的配置和文案。带「待填」「占位」的地方，定稿前替换成真实信息。

export const SITE = {
  name: '冬瓜 AI 独立开发实战站',
  shortName: '冬瓜',
  tagline: 'AI 独立开发',
  url: 'https://eryx.cn',
  description:
    '写给非程序员的 AI 独立开发手册：域名、服务器、备案、收款、审核，每一个卡点都写成能直接照做的答案。',
  author: {
    name: '冬瓜',
    description: '不写代码的独立开发者，产品代码都由 AI 写。',
  },
  // 仓库还没公开，先留空。公开后填上地址，页面上的占位文字会自动换成链接。
  github: '' as string,
  icp: '待办理（国内域名）',
};

// 免费的中间台阶：加微信 / 领清单。目前都是占位。
export const FREE_STEP = {
  wechat: { label: '加冬瓜微信', value: '微信号待填', note: '备注「上线」，拉你进交流群（群待建）' },
  checklist: { label: '领《完整上线清单》', note: '从备账号到过审核的完整勾选清单，整理中，先占位' },
};

// 48 小时实战营。只承诺保底档：公网上线 + 收款链路跑通。
export const CAMP = {
  name: '48 小时实战营',
  format: '线下 · 小班 6~10 人',
  price: '¥ 待定',
  priceNote: '首期种子价 · 含两天午餐、助教、课后 30 天答疑',
  promises: [
    '结业时产品在公网可访问，带 HTTPS',
    '收款流程跑通：现成收款工具真实收到一笔，或支付沙盒演示成功',
    '课前 3 周开始按清单备资质，有执照和商户号的，现场接自己的微信支付',
  ],
  href: '/#camp',
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
  { slug: 'web', name: '网站', icon: '🖥️', keyword: '个人网站上线流程', desc: '从一个单页到能收款的网站：域名、服务器、备案、HTTPS' },
  { slug: 'miniprogram', name: '小程序', icon: '🟢', keyword: '小程序上线流程', desc: '注册主体、选类目、备案、提审，个人和个体户能做到哪一步' },
  { slug: 'app', name: 'App', icon: '📱', keyword: 'App 上架流程', desc: 'App Store 和国内安卓市场：开发者账号、软著、备案、审核' },
  { slug: 'desktop', name: '桌面软件', icon: '💻', keyword: '个人桌面软件发布流程', desc: 'Windows / Mac 软件打包、签名、公证和分发' },
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
