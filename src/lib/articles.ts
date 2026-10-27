import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

// 已发布文章，按日期从新到旧
export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('articles', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const articleUrl = (a: Article) => `/articles/${a.id}/`;

export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
