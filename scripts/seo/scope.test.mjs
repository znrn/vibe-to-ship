import assert from 'node:assert/strict';
import {scopeErrors,articleScope} from './scope.mjs';
for(const keyword of ['数据库连接池调优','框架源码剖析','Kubernetes 集群教程','Windows SmartScreen怎么关闭']) {
 assert(scopeErrors({keyword}).length,keyword);
}
for(const keyword of ['域名解析怎么设置','ssh密钥配置','CORS 跨域错误怎么解决','自己开发的 Windows 软件被 SmartScreen 拦截怎么办','个人开发者开通微信支付']) assert.equal(scopeErrors({keyword,stage:'deploy'}).length,0,keyword);
assert(articleScope('没有 frontmatter').length);
assert(articleScope('---\ntitle: 框架源码剖析\n---\n正文').length);
console.log('定位规则回归通过');
