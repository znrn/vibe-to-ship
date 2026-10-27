// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { SITE as SITE_DATA, ROADMAP, PLATFORMS, TOPICS } from './src/data/site.ts';
import { allRedirects } from './src/data/flow.ts';

// 主域名只在 src/data/site.ts 里改
const SITE = SITE_DATA.url;

// 旧网址 → 新网址（改版、删除或合并流程步骤时产生），定义在 src/data/flow.ts
const REDIRECTS = allRedirects();

// 还没有已发布文章的聚合页：页面上是 noindex，这里也不放进 sitemap
function emptyHubUrls() {
  const dir = './src/content/articles';
  const published = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parse(readFileSync(`${dir}/${f}`, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') ?? {})
    .filter((d) => !d.draft);
  return new Set([
    ...ROADMAP.filter((s) => !published.some((d) => d.stage === s.slug)).map((s) => `${SITE}/flow/${s.slug}/`),
    ...PLATFORMS.filter((p) => !published.some((d) => d.platforms?.includes(p.slug))).map((p) => `${SITE}/platforms/${p.slug}/`),
    ...TOPICS.filter((t) => !published.some((d) => d.topics?.includes(t.slug))).map((t) => `${SITE}/topics/${t.slug}/`),
  ]);
}

const emptyHubs = emptyHubUrls();
const redirectUrls = new Set(Object.keys(REDIRECTS).map((p) => `${SITE}${p}`));

// 构建完成后生成 Nginx 的 301 规则：在 server 配置里 include dist/redirects.nginx.conf
// （Astro 自己的 redirects 只能生成「页面内跳转」，搜索引擎更认服务器返回的 301）
const nginxRedirects = {
  name: 'nginx-redirects',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const lines = Object.entries(REDIRECTS).flatMap(([from, to]) => {
        const bare = from.replace(/\/$/, '');
        return [`location = ${from} { return 301 ${to}; }`, ...(bare && bare !== from ? [`location = ${bare} { return 301 ${to}; }`] : [])];
      });
      const file = fileURLToPath(new URL('redirects.nginx.conf', dir));
      writeFileSync(file, `# 自动生成，勿手改：来自 src/data/flow.ts 的跳转表\n${lines.join('\n')}\n`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: SITE,
  redirects: REDIRECTS,
  integrations: [sitemap({ filter: (page) => !emptyHubs.has(page) && !redirectUrls.has(page) }), nginxRedirects],
});
