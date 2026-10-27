import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './data/site';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    // 标题就是读者会去搜的那个问题
    title: z.string(),
    description: z.string(),
    // 搜索意图：读者搜这类词时真正想解决的那件事。一篇文章只服务一个意图
    intent: z.string(),
    // 主关键词：一般就是标题里的那个说法
    keyword: z.string(),
    // 同一意图下的其他问法，写进小节标题或 FAQ；意图不同的问法应该另写一篇
    // npm run check:keywords 会检查两篇文章的词有没有撞车
    covers: z.array(z.string()).default([]),
    // 文末「常见问题」：接住 covers 里正文没展开的问法，每条一两句直接回答
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    category: z.enum(CATEGORY_SLUGS),
    // 五步路线：1 备账号 / 2 做出来 / 3 放上网 / 4 收到钱 / 5 过审核
    roadmapStep: z.number().int().min(1).max(5),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
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

export const collections = { articles };
