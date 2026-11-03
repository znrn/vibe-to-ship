// 流程页的纯文本版：/flow/<步骤>.md，给 AI 读。
// 有静态支柱页（同目录的 <slug>.astro）的步骤，从那个页面的源码生成纯文本；没有的步骤沿用流程页文章。
import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getArticles, flowArticleOf, type Article } from '../../lib/articles';
import { articleToMarkdown } from '../../lib/markdown';
import { ROADMAP, SITE } from '../../data/site';
import type { FlowStep } from '../../data/flow';

function pillarSource(slug: string) {
  // 构建时这个文件会被打包到别处，所以按项目根目录找源码，而不是相对本文件
  const file = resolve(process.cwd(), 'src/pages/flow', `${slug}.astro`);
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

// 把支柱页的 HTML 正文转成 Markdown：标题、段落、列表、提示词框、FAQ，其余标签去掉
function pillarToMarkdown(src: string, step: FlowStep) {
  const attr = (name: string) => src.match(new RegExp(`\\n  ${name}="([^"]*)"`))?.[1] ?? '';
  let body = src.slice(src.indexOf('>', src.indexOf('<PillarLayout')) + 1, src.lastIndexOf('</PillarLayout>'));
  const text = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, ' ').trim();
  const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  const out: string[] = [`# ${attr('title')}`, '', `> 上线流程第 ${step.step} 步「${step.name}」· 流程页 · ${SITE.url}/flow/${step.slug}/`, '', attr('description'), ''];
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  // 结论卡
  const takeaway = body.match(/<p class="hci-text">([\s\S]*?)<\/p>/);
  if (takeaway) out.push('## 先说结论', '', text(takeaway[1]), '');
  for (const m of body.matchAll(/<span class="meta-tag-label">([^<]*)<\/span>\s*<span>([\s\S]*?)<\/span>/g)) out.push(`- ${text(m[1])} ${text(m[2])}`);
  out.push('');
  // 正文卡：按出现顺序处理块级元素
  const article = body.slice(body.indexOf('<article class="main-article-card">'));
  const blocks = article.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>|<h3[^>]*>([\s\S]*?)<\/h3>|<p[^>]*>([\s\S]*?)<\/p>|<li>([\s\S]*?)<\/li>|<div class="ptb-code">([\s\S]*?)<\/div>|<div class="quote-callout">([\s\S]*?)<\/div>|<summary>([\s\S]*?)<\/summary>|<div class="faq-accordion-body">([\s\S]*?)<\/div>|<tr[^>]*>([\s\S]*?)<\/tr>/g);
  for (const m of blocks) {
    if (m[1]) out.push('', `## ${text(m[1])}`, '');
    else if (m[2]) out.push('', `### ${text(m[2])}`, '');
    else if (m[3]) { const t = text(m[3]); if (t) out.push(t, ''); }
    else if (m[4]) out.push(`- ${text(m[4])}`);
    else if (m[5]) out.push('', '```text', decode(m[5]).replace(/<[^>]+>/g, '').trim(), '```', '');
    else if (m[6]) out.push('', `> ${text(m[6].replace(/<br\s*\/?>/g, ' '))}`, '');
    else if (m[7]) out.push('', `**问：${text(m[7])}**`, '');
    else if (m[8]) out.push(`答：${text(m[8])}`, '');
    else if (m[9]) out.push('| ' + [...m[9].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1])).join(' | ') + ' |');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export async function getStaticPaths() {
  const articles = await getArticles();
  return ROADMAP.flatMap((s) => {
    const src = pillarSource(s.slug);
    if (src) return [{ params: { slug: s.slug }, props: { markdown: pillarToMarkdown(src, s) } }];
    const article = flowArticleOf(articles, s.slug);
    return article ? [{ params: { slug: s.slug }, props: { markdown: articleToMarkdown(article) } }] : [];
  });
}

export const GET: APIRoute = ({ props }) =>
  new Response((props as { markdown: string }).markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
