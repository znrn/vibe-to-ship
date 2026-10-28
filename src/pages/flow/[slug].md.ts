// 流程页的纯文本版：/flow/<步骤>.md，给 AI 读。这一步还没有流程页文章时不生成。
import type { APIRoute } from 'astro';
import { getArticles, flowArticleOf, type Article } from '../../lib/articles';
import { articleToMarkdown } from '../../lib/markdown';
import { ROADMAP } from '../../data/site';

export async function getStaticPaths() {
  const articles = await getArticles();
  return ROADMAP.flatMap((s) => {
    const article = flowArticleOf(articles, s.slug);
    return article ? [{ params: { slug: s.slug }, props: { article } }] : [];
  });
}

export const GET: APIRoute = ({ props }) =>
  new Response(articleToMarkdown((props as { article: Article }).article), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
