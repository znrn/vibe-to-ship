#!/usr/bin/env bash
# 把构建好的 dist/ 同步到阿里云服务器（eryx.cn，宝塔面板站点），并装上 nginx 补充配置。
# 用法：npm run build && bash scripts/deploy.sh
# 服务器根目录里还有别的东西（hermes、niuma、mp、数字目录等），所以不加 --delete，只覆盖本站文件。
set -euo pipefail
HOST=root@你的服务器IP
KEY=~/.ssh/你的私钥文件
ROOT=/www/wwwroot/eryx.cn
EXT=/www/server/panel/vhost/nginx/extension/eryx.cn/vibe-to-ship.conf
cd "$(dirname "$0")/.."
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
location ~ \.md$ { default_type text/markdown; charset utf-8; try_files $uri =404; }
location = /llms.txt { default_type text/plain; charset utf-8; }
NGINX
ssh -i $KEY $HOST "nginx -t && nginx -s reload"

echo "自查"
for u in / /flow/deploy/ /articles/ /step2/ /v3/ /not-exist/ /flow/deploy.md /llms.txt /sitemap-index.xml; do
  printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://eryx.cn$u)"
done
