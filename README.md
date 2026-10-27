# vibe-to-ship · 冬瓜 AI 独立开发实战站

> 写给非程序员的 AI 独立开发手册：从备账号到过审核，把每一个卡点写成能直接照做的答案。

这个仓库有两个身份：

1. **网站源码**：eryx.cn 的全部代码，用 [Astro](https://astro.build) 生成静态网站。
2. **开源手册**：`src/content/articles/` 里的每一篇 Markdown 就是手册的一章，不用打开网站，直接在 GitHub 上也能读。

> 当前是第一版，文章都是**示例**，用来跑通模板；价格、联系方式、作品介绍等带「待填」「占位」的地方还没有定稿。

## 上线流程（9 步）

| 顺序 | `stage` | 流程页 | 解决什么 |
| --- | --- | --- | --- |
| 1 | `idea` | 想清楚做什么 | 第一版做到哪、砍掉哪些功能 |
| 2 | `base` | 选底子：开源二开还是从零写 | 找现成开源项目改，还是让 AI 从零写 |
| 3 | `accounts` | 工具和账号 | AI 编程工具、开发者账号、小程序账号 |
| 4 | `build` | 开发和报错 | 说想法、让 AI 写和改、看懂报错、存好版本 |
| 5 | `deploy` | 服务器和部署 | 要不要服务器、怎么选、怎么把项目放上去 |
| 6 | `domain` | 域名、备案和 HTTPS | 买域名、做解析、ICP 备案、配上小锁 |
| 7 | `payment` | 收款和资质 | 没执照怎么收、执照和商户号、接入支付 |
| 8 | `review` | 上架审核 | 小程序、App Store、应用市场提审与驳回 |
| 9 | `grow` | 上线后：运维、更新、获客 | 网站挂了、续费、更新版本、让人找到你 |

每一步有一个流程页 `/flow/<stage>/`，总览在 `/flow/`。

## 文章怎么写

每篇文章是 `src/content/articles/` 下的一个 `.md` 文件，文件名就是网址（例如 `icp-filing-rejected.md` → `/articles/icp-filing-rejected/`）。开头的 frontmatter：

```yaml
---
title: ICP 备案被驳回，最常见的 3 个原因和改法   # 读者会搜的那个问题
description: 一两句话摘要，用于搜索结果和分享卡片
intent: 个人 ICP 备案提交后被驳回，想知道错在哪、怎么改   # 这篇服务的搜索意图，一篇只服务一个
keyword: ICP 备案被驳回  # 文章主词（这篇的主关键词），一般就是标题里的说法
covers:                 # 同一意图下的其他问法，写进小节标题或常见问题
  - 备案审核不通过
  - 备案驳回后多久能重新提交
stage: domain           # 挂在流程的哪一步，见上表
kind: question          # question 问题页（默认）/ flow 这一步的流程页，每步最多一篇
platforms: [web]        # 适用形态，可多选，见下表
topics: [debug]         # 可选，跨流程的专题，见下表
date: 2026-10-22
answer: 一句话结论，显示在标题下方的「结论」块里
steps:                  # 可选，照做步骤
  - 第一步
  - 第二步
stuckNext: 接下来通常会卡在的地方   # 可选，不填就按下一步路线自动生成
next: first-payment-without-license  # 可选，下一篇推荐（填文件名，不带 .md）
sources:                # 参考来源，规则、费用、流程类的说法都要附官方链接
  - title: 阿里云 ICP 备案帮助文档
    url: https://help.aliyun.com/zh/icp-filing/
reviewed: 2026-10-27    # 最后一次对照来源核实的日期，填了页面上才显示「内容最后核对」
faq:                    # 可选，文末「常见问题」，同时输出 FAQPage 结构化数据
  - q: 备案驳回后多久能重新提交？
    a: 改完就可以重新提交……
sample: true            # 示例文章会显示「示例」标记
draft: false            # 草稿不会发布
---
```

内容骨架是「9 步上线流程 × 四种产品形态」。流程定义在 `src/data/flow.ts`（全站唯一的地方），形态和专题在 `src/data/site.ts`。

**页面分三种**：
- **流程页** `/flow/<stage>/`：一步的完整主路径，讲「你来决定什么、交给 AI 做什么、只有你能做的事」，承接类目词。由这一步的 `kind: flow` 文章生成；还没写时显示这一步的问题页列表（没有内容时 noindex）。
- **问题页** `/articles/<id>/`：一个具体卡点，讲透原因和改法，承接长尾词，挂回所属流程页。
- **形态页、专题页**：按网站 / 小程序 / App / 桌面软件、按专题串起来的导航页。

**以后增删改流程**：都只改 `src/data/flow.ts`。改名改 `name`，调顺序改 `order`，网址都不变；删除或合并一步时在 `FLOW_MOVED` 写「旧 slug: 新 slug」，旧网址自动 301。构建会生成 `dist/redirects.nginx.conf`，在 Nginx 的 server 配置里 `include` 它，跳转才是真正的 301。还在用旧 slug 的文章和选题节点，构建和 `npm run check:keywords` 会报错。

| `platforms` | 形态 | 聚合页（按流程串成完整路线） |
| --- | --- | --- |
| `web` | 网站 | `/platforms/web/` |
| `miniprogram` | 小程序 | `/platforms/miniprogram/` |
| `app` | App | `/platforms/app/` |
| `desktop` | 桌面软件 | `/platforms/desktop/` |

每个聚合页可以写一段导语，放在 `src/content/hubs/<flow|platforms|topics>/<取值>.md`，正文显示在页面标题下方，frontmatter 里的 `description` 可以覆盖默认的页面描述。还没有已发布文章的聚合页会自动加 `noindex`，也不进 sitemap。

专题 `topics`：`tools` 工具怎么选、`cost` 成本与时间账、`roles` 按岗位对号、`debug` 翻车与排错、`works` 作品证明，聚合页在 `/topics/<取值>/`。

## 建站进度

`plan/site-plan.yaml` 是建站总账：页面、内容、SEO、上线、研究各项做到哪了、谁负责（claude / 冬瓜）、哪些在等冬瓜。

```bash
npm run status   # 终端打印进度，并更新本机导航的「冬瓜站建站进度」页
```

不用手写、由脚本自动算的：9 个流程页各自的状态、每步的问题页数、示例和没核对的文章、全站还空着的地方（「待填」「待定」「待冬瓜确认」「待办理」「（占位）」，带文件和行号）。清单里写了 `auto` 的项，以自动检查结果为准。

## 选题地图

`plan/topic-map.yaml` 是整站内容的施工图：每个节点是一个搜索意图，也就是一篇文章（已写的和计划写的都在里面），写明流程步骤、形态、文章主词、覆盖的长尾问法、优先级，以及正文该链到哪几篇。先改地图，再写文章。

```bash
npm run check:keywords              # build 前会自动运行
npm run check:keywords -- --report  # 额外打印覆盖矩阵、待写的 P1、未核对的文章、缺导语的聚合页
npm run plan:page                   # 生成选题地图浏览页（默认写到 ~/launchpad/pages/aidev-topic-map.html）
```

检查内容：文章必须在地图里有节点；不同节点不能用同一个词，词很像时会提示（确认意图不同的写进节点的 `distinct`）；两篇都发布后，正文要按 `links` 链过去。

### 问法研究和搜索量

```bash
node scripts/research/collect.mjs           # 采集搜索联想词和社区帖子标题 → plan/research/raw.json
node scripts/research/import-grok.mjs       # 导入 grokbot 的采集（~/launchpad/keyword-harvest-*/）→ plan/research/grok.json
node scripts/research/verify-terms.mjs      # 核实 AI 写的说法和文章主词：只输入前半截，看能否被联想出来 → verify.json
node scripts/research/match.mjs             # 匹配到地图节点，并算出需求分 → plan/research/demand.json
node scripts/research/report-page.mjs       # 生成问法对照页（本机导航）
node scripts/research/apply-proposals.mjs <建议.yaml>   # 把一轮整理的最终建议应用到选题地图
node scripts/research/export-keywords.mjs   # 导出 P1 关键词查询表 → plan/research/keywords-p1.csv（--all 导出全部）
node scripts/research/import-volume.mjs <文件.csv>   # 导入关键词工具查到的搜索量 → plan/research/volume.json
```

关键词分四层，查询表的「类型」列和地图页都用这套叫法：**站点主词**（首页，`topic-map.yaml` 的 `site`）、**类目词**（流程页、形态页，写在 `src/data/flow.ts` 和 `src/data/site.ts`）、**文章主词**（每个节点的 `keyword`）、**长尾**（节点的 `covers`）。

查搜索量：把 `keywords-p1.csv` 第一列粘到百度营销关键词规划师或 5118 批量查询，导出结果（Excel 先另存为 CSV），再用 `import-volume.mjs` 导入。之后 `npm run plan:page` 重新生成地图页，卡片上会显示每个节点的需求分和搜索量，可以按两者排序。

需求分只是联想词的命中次数，用来比较节点之间的相对需求；搜索量为 0 或「未收录」的长尾也不一定没人搜，两者结合看。人工整理建议的规则（含收录范围）见 `plan/research/CURATION.md`，每轮最终建议在 `plan/research/proposals*.yaml`。AI 生成的说法（包括 grokbot 自己写的）必须先通过 `verify-terms.mjs` 核实才能当证据：联想接口拿到整句时常会原样补全，所以只用前缀判断。

内容铁律：**对号入座 → 当场给用 → 点出系统缺口**。标题就是读者的问题，开头 150 字给答案，结尾点出下一步还会卡在哪。

## 本地运行

需要 Node.js 22 或更新版本。

```bash
npm install
npm run dev      # 本地预览，默认 http://localhost:4321
npm run build    # 生成静态网站到 dist/
```

## 目录

```
src/
  content/articles/   文章（开源手册正文）
  content/hubs/       流程 / 形态 / 专题聚合页的导语
  content.config.ts   文章 frontmatter 的格式定义
  data/flow.ts        上线流程 9 步的定义和旧网址跳转表
  data/site.ts        站点信息、产品形态、专题、实战营和占位文案
  layouts/            全站布局
  components/         首页各区块、文章页的路线图定位和文末出口
  pages/              首页、问题页、流程页、文章列表、形态 / 专题聚合页、RSS
plan/topic-map.yaml   选题地图（不发布）
scripts/              关键词与选题地图检查
```

## 许可

- 文章（`src/content/`）：[CC BY-NC-SA 4.0](./LICENSE-CONTENT)，转载请署名「冬瓜」并附原文链接，不可商用。
- 网站代码：[MIT](./LICENSE)。
