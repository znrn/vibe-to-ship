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

echo "1/3 备份服务器上的旧首页和 404"
ssh -i $KEY $HOST "mkdir -p $ROOT-backup && cp -a $ROOT/index.html $ROOT/404.html $ROOT-backup/ 2>/dev/null || true"

echo "2/3 同步 dist/ 到 $ROOT（不删除根目录里的其他内容）"
rsync -az --no-perms --no-owner --no-group -e "ssh -i $KEY" dist/ $HOST:$ROOT/
ssh -i $KEY $HOST "chown -R www:www $ROOT/_astro $ROOT/flow $ROOT/articles $ROOT/platforms $ROOT/topics $ROOT/images 2>/dev/null || true"

echo "3/3 nginx 补充配置（.md 纯文本、llms.txt、旧网址 301）"
ssh -i $KEY $HOST "cat > $EXT" <<'NGINX'
# vibe-to-ship 静态站补充配置，由仓库 scripts/deploy.sh 写入，勿手改
include /www/wwwroot/eryx.cn/redirects.nginx.conf;
# nginx 的 mime.types 已把 .md 识别为 text/markdown，但它不在默认 charset_types 里，要单独声明才会带 charset=utf-8
location ~ \.md$ { charset utf-8; charset_types text/markdown; try_files $uri =404; }
location = /llms.txt { default_type text/plain; charset utf-8; }
location = /sitemap.xml { return 301 /sitemap-index.xml; }
NGINX
ssh -i $KEY $HOST "nginx -t && nginx -s reload"

# 有百度推送 token 时，把新站点地图里的网址推给百度；IndexNow 通知必应（改过的页才提交）
node scripts/seo-push.mjs || true
node scripts/seo/indexnow.mjs || true

echo "自查"
for u in / /flow/deploy/ /articles/ /step2/ /v3/ /not-exist/ /flow/deploy.md /llms.txt /sitemap-index.xml; do
  printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://eryx.cn$u)"
done
