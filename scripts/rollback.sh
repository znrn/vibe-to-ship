#!/usr/bin/env bash
# 回退到部署前的快照（deploy.sh 每次部署前在服务器上打的 tar 包）。
# 用法：bash scripts/rollback.sh            回退到最近一份快照
#       bash scripts/rollback.sh --list     列出快照
#       bash scripts/rollback.sh snap-20261105-203000.tar.gz   回退到指定快照
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/deploy.env
HOST=${DEPLOY_HOST:?}; KEY=${DEPLOY_KEY:?}; ROOT=${DEPLOY_ROOT:-/www/wwwroot/eryx.cn}
if [ "${1:-}" = "--list" ]; then ssh -i ${KEY} ${HOST} "ls -lt ${ROOT}-backup/snap-*.tar.gz"; exit 0; fi
SNAP=${1:-$(ssh -i ${KEY} ${HOST} "ls -t ${ROOT}-backup/snap-*.tar.gz | head -1")}
case "$SNAP" in /*) ;; *) SNAP=${ROOT}-backup/$SNAP ;; esac
echo "回退到 ${SNAP}"
ssh -i ${KEY} ${HOST} "cd ${ROOT} && tar -xzf ${SNAP} && chown -R www:www ${ROOT}/_astro ${ROOT}/flow ${ROOT}/articles ${ROOT}/platforms ${ROOT}/topics 2>/dev/null || true && nginx -s reload"
node scripts/seo/collect-live.mjs || true
