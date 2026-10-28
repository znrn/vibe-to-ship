// 问题页的纯文本版：/articles/<id>.md，给 AI 读
import type { APIRoute } from 'astro';
import { getArticles, type Article } from '../../lib/articles';
import { articleToMarkdown } from '../../lib/markdown';

export async function getStaticPaths() {
  const articles = await getArticles();
  return articles.filter((a) => a.data.kind !== 'flow').map((article) => ({ params: { id: article.id }, props: { article } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(articleToMarkdown((props as { article: Article }).article), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
