// 文章的纯文本（Markdown）版本：给 Claude / Codex 这类 AI 读，去掉页面样式和导航。
// 问题页在 /articles/<id>.md，流程页在 /flow/<步骤>.md；全站索引在 /llms.txt。
import { SITE } from '../data/site';
import { platformOf } from '../data/site';
import { articleUrl, formatDate, stageOfArticle, type Article } from './articles';

const WHO = { me: '你来做', ai: '交给 AI', check: '你来验收' } as const;

export const markdownUrl = (a: Article) => articleUrl(a).replace(/\/$/, '.md');

// 正文里的 <mark class="todo">待定</mark>、<span class="role-tag me">🧑 你来做</span> 这类 HTML 换成纯文字
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');

export function articleToMarkdown(a: Article): string {
  const d = a.data;
  const step = stageOfArticle(a);
  const out: string[] = [];
  const url = new URL(articleUrl(a), SITE.url).href;

  out.push(`# ${d.title}`, '');
  out.push(`> 上线流程第 ${step.step} 步「${step.name}」· ${d.kind === 'flow' ? '流程页' : '问题页'} · 适用：${d.platforms.map((p) => platformOf(p).name).join('、')}`);
  out.push(`> 网页版：${url} · 作者：${SITE.author.name} · 发布 ${formatDate(d.date)}${d.reviewed ? ` · 内容核对 ${formatDate(d.reviewed)}` : ''}`, '');

  out.push('## 结论', '', d.answer, '');
  if (d.steps.length) {
    out.push('## 步骤', '');
    d.steps.forEach((s, i) => out.push(typeof s === 'string' ? `${i + 1}. ${s}` : `${i + 1}. 【${WHO[s.who]}】${s.text}`));
    out.push('');
  }

  const body = stripHtml(a.body ?? '').trim();
  if (body) out.push(body, '');

  if (d.handoff && (d.handoff.prepare.length || d.handoff.prompts.length)) {
    out.push('## 交给 AI', '');
    if (d.handoff.prepare.length) {
      out.push('交接前准备好：', '');
      d.handoff.prepare.forEach((p) => out.push(`- ${p}`));
      out.push('');
    }
    d.handoff.prompts.forEach((p, i) => {
      out.push(`### 提示词 ${i + 1}：${p.title}`, '', '```', p.text, '```', '');
      if (p.note) out.push(p.note, '');
    });
  }
  if (d.humanOnly.length) {
    out.push('## 只有你能做的（AI 做不了，执行到这里要停下来交给本人）', '');
    d.humanOnly.forEach((h) => out.push(`- [ ] ${h.text}${h.note ? `（${h.note}）` : ''}`));
    out.push('');
  }
  if (d.verify.length) {
    out.push('## 验收', '');
    d.verify.forEach((v) => out.push(`- [ ] ${v}`));
    out.push('');
  }
  if (d.troubleshoot.length) {
    out.push('## 卡住了怎么办', '', '| 现象 | 通常是 | 怎么跟 AI 说 |', '| --- | --- | --- |');
    d.troubleshoot.forEach((t) => out.push(`| ${t.symptom} | ${t.cause} | ${t.say} |`));
    out.push('');
  }
  if (d.boundaries.length) {
    out.push('## 别让 AI 做的事', '');
    d.boundaries.forEach((b) => out.push(`- ${b}`));
    out.push('');
  }
  if (d.faq.length) {
    out.push('## 常见问题', '');
    d.faq.forEach((f) => out.push(`### ${f.q}`, '', f.a, ''));
  }
  if (d.sources.length) {
    out.push('## 参考来源', '');
    d.sources.forEach((s) => out.push(`- [${s.title}](${s.url})`));
    out.push('');
  }
  // 站内链接换成完整网址，AI 拿到就能直接打开
  return stripHtml(out.join('\n'))
    .replace(/\]\(\/(?!\/)/g, `](${SITE.url}/`)
    .replace(/\n{3,}/g, '\n\n');
}
