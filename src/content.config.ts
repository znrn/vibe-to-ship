import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { STAGE_SLUGS, PLATFORM_SLUGS, TOPIC_SLUGS } from './data/site';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    // 标题就是读者会去搜的那个问题
    title: z.string(),
    description: z.string(),
    // 搜索意图：读者搜这类词时真正想解决的那件事。一篇文章只服务一个意图
    intent: z.string(),
    // 文章主词（这篇的主关键词）：一般就是标题里的那个说法
    keyword: z.string(),
    // 同一意图下的其他问法，写进小节标题或 FAQ；意图不同的问法应该另写一篇
    // npm run check:keywords 会检查两篇文章的词有没有撞车
    covers: z.array(z.string()).default([]),
    // 文末「常见问题」：接住 covers 里正文没展开的问法，每条一两句直接回答
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    // 阶段（主分类）：accounts 备账号 / build 做出来 / deploy 放上网 / payment 收到钱 / review 过审核
    stage: z.enum(STAGE_SLUGS),
    // 适用的产品形态，可多选：web 网站 / miniprogram 小程序 / app / desktop 桌面软件
    platforms: z.array(z.enum(PLATFORM_SLUGS)).min(1),
    // 跨阶段专题：tools / cost / roles / debug / works
    topics: z.array(z.enum(TOPIC_SLUGS)).default([]),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // 参考来源：平台规则、费用、流程这类会变的事实，附上官方文档链接
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
    // 最后一次对照来源核实内容的日期；不填页面上不显示「已核对」
    reviewed: z.coerce.date().optional(),
    // 首屏「结论 / 步骤」块：一句话结论 + 照做步骤
    answer: z.string(),
    steps: z.array(z.string()).default([]),
    // 文末「这一步解决了，但接下来通常会卡在 XX」，不填就按下一步路线自动生成
    stuckNext: z.string().optional(),
    // 下一篇推荐（填文章文件名，不带 .md）
    next: reference('articles').optional(),
    // 示例文章会打上「示例」标记
    sample: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// 聚合页导语：src/content/hubs/<stages|platforms|topics>/<slug>.md
// 正文显示在聚合页标题下方，说明这一步 / 这条流程整体怎么走；description 可覆盖默认的页面描述
const hubs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hubs' }),
  schema: z.object({
    description: z.string().optional(),
  }),
});

export const collections = { articles, hubs };
