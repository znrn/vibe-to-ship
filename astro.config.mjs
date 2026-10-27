// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { ROADMAP, PLATFORMS, TOPICS } from './src/data/site.ts';

const SITE = 'https://donggua.dev';

// 还没有已发布文章的聚合页：页面上是 noindex，这里也不放进 sitemap
function emptyHubUrls() {
  const dir = './src/content/articles';
  const published = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parse(readFileSync(`${dir}/${f}`, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') ?? {})
    .filter((d) => !d.draft);
  return new Set([
    ...ROADMAP.filter((s) => !published.some((d) => d.stage === s.slug)).map((s) => `${SITE}/categories/${s.slug}/`),
    ...PLATFORMS.filter((p) => !published.some((d) => d.platforms?.includes(p.slug))).map((p) => `${SITE}/platforms/${p.slug}/`),
    ...TOPICS.filter((t) => !published.some((d) => d.topics?.includes(t.slug))).map((t) => `${SITE}/topics/${t.slug}/`),
  ]);
}

const emptyHubs = emptyHubUrls();

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [sitemap({ filter: (page) => !emptyHubs.has(page) })],
});
