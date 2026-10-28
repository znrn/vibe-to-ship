// /llms.txt：给 AI 读的全站索引（llmstxt.org 的格式）。
// 每个流程页和问题页都有纯文本版（.md），AI 照着做时优先读纯文本版。
import type { APIRoute } from 'astro';
import { SITE, ROADMAP, WHAT_IS } from '../data/site';
import { flowUrl } from '../data/flow';
import { getArticles, flowArticleOf, articleUrl } from '../lib/articles';
import { markdownUrl } from '../lib/markdown';

export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const abs = (p: string) => new URL(p, SITE.url).href;
  const lines: string[] = [];

  lines.push(`# ${SITE.name}`, '', `> ${SITE.description}`, '');
  lines.push(
    '这个站按 9 步讲清楚不会写代码的人怎么把产品做到上线并收到钱。每一篇都分成三种角色：你来做（本人决定或本人操作）、交给 AI（Claude Code / Codex 执行）、你来验收。',
    'AI 照着文章执行时：遇到「只有你能做的」步骤（实名、付款、短信核验、控制台操作、提交审核等）要停下来交给本人；涉及删除、付款、修改账号或密码的操作先征得本人同意。',
    '',
  );
  lines.push('## 入门', '', `- [独立开发者是什么意思](${abs(WHAT_IS.path)})：${SITE.definition}`, `- [上线流程总览](${abs('/flow/')})：9 步从想法到收到钱`, '');

  lines.push('## 上线流程（每步一个流程页）', '');
  for (const s of ROADMAP) {
    const flow = flowArticleOf(articles, s.slug);
    lines.push(flow ? `- [第 ${s.step} 步 ${s.name}](${abs(markdownUrl(flow))})：${s.desc}` : `- [第 ${s.step} 步 ${s.name}](${abs(flowUrl(s.slug))})：${s.desc}（流程页整理中）`);
  }
  lines.push('');

  lines.push('## 问题页', '');
  for (const s of ROADMAP) {
    const qs = articles.filter((a) => a.data.stage === s.slug && a.data.kind !== 'flow');
    if (!qs.length) continue;
    lines.push(`### 第 ${s.step} 步 ${s.name}`, '');
    for (const a of qs) lines.push(`- [${a.data.title}](${abs(markdownUrl(a))})：${a.data.description}`);
    lines.push('');
  }

  lines.push('## Optional', '', `- [全部文章（网页）](${abs('/articles/')})`, `- [sitemap](${abs('/sitemap-index.xml')})`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
