# SEO 自动工作台（副本）

这是原版 SEO 工作台的**独立副本**，用来演进「脚本做 + 人审核」而不动原版。

## 和原版的区别

| | 原版 | 自动版（本目录） |
| --- | --- | --- |
| 脚本 | `scripts/seo-today.mjs` 等 | `scripts/seo-auto/*.mjs` |
| npm | `seo:today` / `seo:push` / `seo:check` | `seo:auto` / `seo:auto:today` / `seo:auto:check` / `seo:auto:push` |
| 工作台页面 | `~/launchpad/pages/aidev-seo-console.html` | `~/launchpad/pages/aidev-seo-auto.html` |
| 数据目录 | `plan/seo/`（history、baidu-pushed…） | `plan/seo/auto/`（history、last-run、daily…） |
| LaunchAgent | `cn.eryx.seo-today` 08:00 | `cn.eryx.seo-auto` 08:15 |
| 百度推送 | 每天自动推 | **默认关**；加 `--push` 才推，且原版当天已推则跳过 |
| 待办 | 默认写入 launchpad todos | 默认不写；加 `--todo` 才写 |

共享只读：`plan/seo/keywords.csv`、`banned-words.txt`、`topic-map`、以及读 `baidu-pushed.json` 判断当天是否已推。

**禁止**改原版路径里的文件和 `cn.eryx.seo-today`。

## 常用命令

```bash
cd /Volumes/sn850/code/vibe-to-ship
npm run seo:auto            # 每日编排（检查 → 刷新页面，不推送）
npm run seo:auto:today      # 只刷新自动工作台
npm run seo:auto:check      # 只跑检查，写 plan/seo/auto/last-check.json
npm run seo:auto:push       # 提示，不推
npm run seo:auto -- --push  # 确认配额安全后再推
```

## LaunchAgent

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/cn.eryx.seo-auto.plist
# 或旧式：launchctl load ~/Library/LaunchAgents/cn.eryx.seo-auto.plist
tail -f ~/Library/Logs/eryx-seo-auto.log
```

排在原版 08:00 之后的 **08:15**，让原版先用百度配额；自动版默认只刷新看板。

## P0 / P1

- P0（已做）：副本页面 + 并行脚本 + 独立数据目录 + 独立 LaunchAgent + 默认不抢配额
- P1（未做）：机会词 → 待写 / 待优化队列写进本页「待审核队列」
