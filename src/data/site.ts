// 全站共用的配置和文案。带「待填」「占位」的地方，定稿前替换成真实信息。

export const SITE = {
  name: '冬瓜 AI 独立开发实战站',
  shortName: '冬瓜',
  tagline: 'AI 独立开发',
  url: 'https://donggua.dev',
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

export type CategorySlug =
  | 'mvp'
  | 'accounts'
  | 'deploy'
  | 'tools'
  | 'cost'
  | 'roles'
  | 'debug'
  | 'works';

export const CATEGORIES: { slug: CategorySlug; name: string; icon: string; desc: string }[] = [
  { slug: 'mvp', name: '最小可上线', icon: '🚀', desc: '不要登录、不要支付，当天先上线一个单页' },
  { slug: 'accounts', name: '账号与资质', icon: '🔑', desc: '工具订阅、Apple ID、开发者账号、执照与商户号' },
  { slug: 'deploy', name: '上线链路', icon: '🌐', desc: '域名解析、云服务器、SSL、ICP 备案' },
  { slug: 'tools', name: '工具怎么选', icon: '🧰', desc: '主力工具怎么搭，国产 AI 能帮到哪' },
  { slug: 'cost', name: '成本与时间账', icon: '🧮', desc: '外包报价 vs 自己做；下班每周 5 小时怎么排' },
  { slug: 'roles', name: '按岗位对号', icon: '🧭', desc: '运营、产品、老板第一周各容易卡在哪' },
  { slug: 'debug', name: '翻车与排错', icon: '🧯', desc: '满屏英文报错怎么问 AI；审核驳回怎么改' },
  { slug: 'works', name: '作品证明', icon: '🏆', desc: '真实上线的产品和完整复盘' },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function categoryOf(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)!;
}

// 五步路线 = 五层窗户纸
export const ROADMAP = [
  { step: 1, name: '备账号', desc: 'AI 工具订阅、开发者账号、执照与商户号', stuck: '账号、执照、商户号这些资质' },
  { step: 2, name: '做出来', desc: '用大白话描述需求，让 AI 写出能跑的页面', stuck: '把需求说清楚、让 AI 做出能跑的东西' },
  { step: 3, name: '放上网', desc: '域名、服务器、HTTPS、备案', stuck: '域名、服务器、HTTPS 和备案' },
  { step: 4, name: '收到钱', desc: '微信支付或现成收款工具，先跑通一笔', stuck: '收款：第一笔钱怎么进账' },
  { step: 5, name: '过审核', desc: '小程序、App Store 提审与驳回处理', stuck: '小程序或 App Store 的提审和驳回' },
] as const;

export const CN_NUM = ['零', '一', '二', '三', '四', '五'];
