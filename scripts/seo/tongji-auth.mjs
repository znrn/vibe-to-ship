// 百度统计 Tongji API 一次性授权。
// 1. 登录百度统计 → 管理 → 数据导出服务（https://tongji.baidu.com/sc-web/home/dataapi）开通，拿到 API Key 和 Secret Key，
//    填进 scripts/deploy.env 的 BAIDU_TONGJI_API_KEY= 和 BAIDU_TONGJI_SECRET=
// 2. 运行 node scripts/seo/tongji-auth.mjs，打开它打印的网址，登录同意后页面显示一个 CODE
// 3. 运行 node scripts/seo/tongji-auth.mjs <CODE>，token 存到 plan/seo/data/tongji-token.json（不入库），以后自动刷新
import { loadEnv, readJson, writeJson, DATA } from './lib.mjs';

const env = loadEnv();
const TOKEN = `${DATA}/tongji-token.json`;
if (!env.BAIDU_TONGJI_API_KEY || !env.BAIDU_TONGJI_SECRET) { console.log('先把 BAIDU_TONGJI_API_KEY 和 BAIDU_TONGJI_SECRET 填进 scripts/deploy.env'); process.exit(1); }
const code = process.argv[2];
if (!code) {
  console.log('在浏览器打开这个网址，登录同意后把页面显示的 CODE 传给我：\n');
  console.log(`https://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=${env.BAIDU_TONGJI_API_KEY}&redirect_uri=oob&scope=basic&display=popup\n`);
  console.log('然后：node scripts/seo/tongji-auth.mjs <CODE>');
  process.exit(0);
}
const r = await fetch(`https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=${code}&client_id=${env.BAIDU_TONGJI_API_KEY}&client_secret=${env.BAIDU_TONGJI_SECRET}&redirect_uri=oob`).then((x) => x.json());
if (!r.access_token) { console.log('换 token 失败：' + JSON.stringify(r)); process.exit(1); }
const tok = { ...(readJson(TOKEN) ?? {}), access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + (r.expires_in ?? 2592000) * 1000, site_id: undefined };
writeJson(TOKEN, tok);
console.log('授权成功，token 已存到 ' + TOKEN + '。现在可以 node scripts/seo/collect-tongji.mjs 试一下。');
