// 公众号：把分发稿里的公众号版推进草稿箱（官方「新增草稿」接口），你在手机上预览、群发。
// deploy.env：WECHAT_APPID、WECHAT_SECRET（公众号后台 → 设置与开发 → 基本配置；IP 白名单要加本机出口 IP）
// 封面：默认用 public/images/avatar.jpg 上传成永久素材，media_id 记在 plan/seo/data/wechat.json；想换封面填 WECHAT_COVER=public/images/xxx.jpg
// 用法：node scripts/seo/wechat-draft.mjs <文章 id>
import { readFileSync, existsSync } from 'node:fs';
import { loadEnv, readJson, writeJson, DATA, TODAY } from './lib.mjs';

const env = loadEnv();
const id = process.argv[2];
if (!env.WECHAT_APPID || !env.WECHAT_SECRET) { console.log('没有 WECHAT_APPID / WECHAT_SECRET，填进 scripts/deploy.env'); process.exit(1); }
const dist = readJson(`${DATA}/distribution.json`, { articles: {} });
const a = dist.articles[id];
if (!a?.platforms?.wechat) { console.log('这篇还没有公众号版分发稿，先 node scripts/seo/distribute.mjs ' + id); process.exit(1); }
const state = readJson(`${DATA}/wechat.json`, {});
const api = async (path, body, raw = false) => {
  const r = await fetch(`https://api.weixin.qq.com/cgi-bin/${path}`, { method: body ? 'POST' : 'GET', body: raw ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  const j = await r.json();
  if (j.errcode && j.errcode !== 0) throw new Error(`${path}: ${j.errcode} ${j.errmsg}`);
  return j;
};
try {
  const { access_token } = await api(`token?grant_type=client_credential&appid=${env.WECHAT_APPID}&secret=${env.WECHAT_SECRET}`);
  const cover = env.WECHAT_COVER || 'public/images/avatar.jpg';
  if (!state.coverMediaId || state.coverFile !== cover) {
    if (!existsSync(cover)) throw new Error('封面文件不存在：' + cover);
    const fd = new FormData();
    fd.append('media', new Blob([readFileSync(cover)], { type: 'image/jpeg' }), cover.split('/').pop());
    const up = await api(`material/add_material?access_token=${access_token}&type=image`, fd, true);
    state.coverMediaId = up.media_id; state.coverFile = cover; writeJson(`${DATA}/wechat.json`, state);
  }
  const w = a.platforms.wechat;
  const res = await api(`draft/add?access_token=${access_token}`, { articles: [{ title: w.title.slice(0, 64), author: '冬瓜', digest: (w.digest ?? '').slice(0, 120), content: w.html, content_source_url: w.link ?? a.url, thumb_media_id: state.coverMediaId, need_open_comment: 1, only_fans_can_comment: 0 }] });
  a.wechatDraft = { mediaId: res.media_id, at: TODAY };
  writeJson(`${DATA}/distribution.json`, dist);
  console.log(`公众号草稿已进草稿箱（media_id ${res.media_id}），去公众号后台或手机预览、群发`);
} catch (e) { console.log('公众号草稿失败：' + e.message + (/40164|ip/i.test(e.message) ? '（本机出口 IP 不在公众号 IP 白名单里，去基本配置里加）' : '')); process.exit(1); }
