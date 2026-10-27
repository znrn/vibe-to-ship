import { getCollection, type CollectionEntry } from 'astro:content';
import { stageOf } from '../data/site';

export type Article = CollectionEntry<'articles'>;

// 已发布文章，按日期从新到旧
export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('articles', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// 流程页文章挂在 /flow/<步骤>/，其余是问题页 /articles/<id>/
export const articleUrl = (a: Article) => (a.data.kind === 'flow' ? `/flow/${a.data.stage}/` : `/articles/${a.id}/`);

// 某一步的流程页文章（没有就是 undefined）
export const flowArticleOf = (articles: Article[], stage: string) =>
  articles.find((a) => a.data.kind === 'flow' && a.data.stage === stage);

export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 文章所在的流程步骤（第几步、叫什么）
export const stageOfArticle = (a: Article) => stageOf(a.data.stage);

// 聚合页导语（src/content/hubs/<kind>/<slug>.md），没写就是 undefined。
// 用 getCollection 查找，避免对不存在的条目调用 getEntry 时报警告
export async function hubOf(id: string) {
  return (await getCollection('hubs')).find((h) => h.id === id);
}
