// 确定性预检只抓明确偏题；模糊边界交独立编辑按 docs/content-scope.md 审查。
import {parse} from 'yaml';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const SCOPE_VERSION = createHash('sha256').update(readFileSync(new URL('../../docs/content-scope.md', import.meta.url))).digest('hex');
export function scopeErrors(node = {}) {
 const text = [node.title,node.keyword,node.intent].filter(Boolean).join(' ');
 const errors = [];
 if (!text.trim()) errors.push('缺少可判断受众的选题信息');
 if (node.stage && !['idea','base','accounts','build','deploy','domain','payment','review','grow'].includes(node.stage)) errors.push('不属于产品上线流程');
 if (/源码剖析|源码解析|内核开发|编译器原理|算法刷题|leetcode|kubernetes\s*集群|数据库连接池调优|明星八卦|股票荐股|AI会不会取代程序员/i.test(text)) errors.push('专业技术深水区或泛话题，不属于新手产品上线卡点');
 if (/关闭.{0,8}(?:SmartScreen|安全防护|杀毒)|(?:SmartScreen|安全防护|杀毒).{0,8}怎么关闭/i.test(node.keyword || node.title || '')) errors.push('不能以关闭安全防护为选题');
 return errors;
}
export function articleScope(text) {
 const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
 if (!match) return ['缺少文章元数据'];
 try { return scopeErrors(parse(match[1])); } catch { return ['文章元数据无法解析']; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const files=readdirSync('src/content/articles').filter(f=>f.endsWith('.md'));
 const errors=files.flatMap(f=>articleScope(readFileSync('src/content/articles/'+f,'utf8')).map(e=>f+': '+e));
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('内容定位预检通过：'+files.length+' 个文章文件；全文定位另由独立核查把关');
}
