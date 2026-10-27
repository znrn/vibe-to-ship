import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../data/site';
import { getArticles, articleUrl } from '../lib/articles';

export async function GET(context: APIContext) {
  const articles = await getArticles();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site!,
    items: articles.map((a) => ({
      title: a.data.title,
      description: `${a.data.answer}`,
      pubDate: a.data.date,
      link: articleUrl(a),
    })),
    customData: '<language>zh-cn</language>',
  });
}
