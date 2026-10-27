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
