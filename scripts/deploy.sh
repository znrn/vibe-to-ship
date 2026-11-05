#!/usr/bin/env bash
# 把构建好的 dist/ 同步到服务器（eryx.cn 用的是阿里云 + 宝塔面板），并装上 nginx 补充配置。
# 用法：npm run build && bash scripts/deploy.sh
# 服务器根目录里还有别的东西（hermes、niuma、mp、数字目录等），所以不加 --delete，只覆盖本站文件。
set -euo pipefail
cd "$(dirname "$0")/.."
# 服务器地址和密钥不进仓库：复制 scripts/deploy.env.example 为 scripts/deploy.env 填好
[ -f scripts/deploy.env ] || { echo "缺少 scripts/deploy.env（参考 scripts/deploy.env.example）"; exit 1; }
# shellcheck source=/dev/null
source scripts/deploy.env
HOST=${DEPLOY_HOST:?deploy.env 里要有 DEPLOY_HOST，如 root@1.2.3.4}
KEY=${DEPLOY_KEY:?deploy.env 里要有 DEPLOY_KEY，如 ~/.ssh/xxx}
ROOT=${DEPLOY_ROOT:-/www/wwwroot/eryx.cn}
EXT=${DEPLOY_NGINX_EXT:-/www/server/panel/vhost/nginx/extension/eryx.cn/vibe-to-ship.conf}
[ -f dist/index.html ] || { echo "先 npm run build"; exit 1; }

# 本站在服务器上占用的路径（根目录里还有别的应用，只快照和回退这些）
SITE_PATHS="index.html 404.html _astro flow articles platforms topics categories images ai-indie-dev camp llms.txt robots.txt rss.xml sitemap-index.xml sitemap-0.xml redirects.nginx.conf"
SNAP=${ROOT}-backup/snap-$(date +%Y%m%d-%H%M%S).tar.gz
echo "1/4 快照服务器上的本站文件 → ${SNAP}（只留最近 10 份）"
ssh -i ${KEY} ${HOST} "mkdir -p ${ROOT}-backup && cd ${ROOT} && tar -czf ${SNAP} \$(ls -d ${SITE_PATHS} *.txt 2>/dev/null | sort -u) 2>/dev/null; ls -t ${ROOT}-backup/snap-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f"

echo "2/4 同步 dist/ 到 ${ROOT}（不删除根目录里的其他内容）"
rsync -az --no-perms --no-owner --no-group -e "ssh -i ${KEY}" dist/ ${HOST}:${ROOT}/
ssh -i ${KEY} ${HOST} "chown -R www:www ${ROOT}/_astro ${ROOT}/flow ${ROOT}/articles ${ROOT}/platforms ${ROOT}/topics ${ROOT}/images 2>/dev/null || true"

echo "3/4 nginx 补充配置（.md 纯文本、llms.txt、旧网址 301）"
ssh -i ${KEY} ${HOST} "cat > ${EXT}" <<'NGINX'
# vibe-to-ship 静态站补充配置，由仓库 scripts/deploy.sh 写入，勿手改
include /www/wwwroot/eryx.cn/redirects.nginx.conf;
# nginx 的 mime.types 已把 .md 识别为 text/markdown，但它不在默认 charset_types 里，要单独声明才会带 charset=utf-8
location ~ \.md$ { charset utf-8; charset_types text/markdown; try_files $uri =404; }
location = /llms.txt { default_type text/plain; charset utf-8; }
location = /sitemap.xml { return 301 /sitemap-index.xml; }
NGINX
ssh -i ${KEY} ${HOST} "nginx -t && nginx -s reload"

# 有百度推送 token 时，把新站点地图里的网址推给百度；IndexNow 通知必应（改过的页才提交）
node scripts/seo-push.mjs || true
node scripts/seo/indexnow.mjs || true

echo "4/4 线上巡检（站点地图里每一页的状态、canonical、title）"
if ! node scripts/seo/collect-live.mjs; then
  echo "线上巡检有页面打不开。回退到这次部署前的快照："
  echo "  bash scripts/rollback.sh"
  exit 1
fi
for u in /step2/ /v3/ /not-exist/ /sitemap.xml; do
  printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://eryx.cn$u)"
done
