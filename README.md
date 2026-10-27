# vibe-to-ship · 冬瓜 AI 独立开发实战站

> 写给非程序员的 AI 独立开发手册：从备账号到过审核，把每一个卡点写成能直接照做的答案。

这个仓库有两个身份：

1. **网站源码**：donggua.dev 的全部代码，用 [Astro](https://astro.build) 生成静态网站。
2. **开源手册**：`src/content/articles/` 里的每一篇 Markdown 就是手册的一章，不用打开网站，直接在 GitHub 上也能读。

> 当前是第一版，文章都是**示例**，用来跑通模板；价格、联系方式、作品介绍等带「待填」「占位」的地方还没有定稿。

## 五步路线（五层窗户纸）

| 步骤 | 名称 | 解决什么 |
| --- | --- | --- |
| 1 | 备账号 | AI 工具订阅、开发者账号、执照与商户号 |
| 2 | 做出来 | 用大白话描述需求，让 AI 写出能跑的页面 |
| 3 | 放上网 | 域名、服务器、HTTPS、备案 |
| 4 | 收到钱 | 微信支付或现成收款工具，先跑通一笔 |
| 5 | 过审核 | 小程序、App Store 提审与驳回处理 |

## 文章怎么写

每篇文章是 `src/content/articles/` 下的一个 `.md` 文件，文件名就是网址（例如 `icp-filing-rejected.md` → `/articles/icp-filing-rejected/`）。开头的 frontmatter：

```yaml
---
title: ICP 备案被驳回，最常见的 3 个原因和改法   # 读者会搜的那个问题
description: 一两句话摘要，用于搜索结果和分享卡片
intent: 个人 ICP 备案提交后被驳回，想知道错在哪、怎么改   # 这篇服务的搜索意图，一篇只服务一个
keyword: ICP 备案被驳回  # 主关键词，一般就是标题里的说法
covers:                 # 同一意图下的其他问法，写进小节标题或常见问题
  - 备案审核不通过
  - 备案驳回后多久能重新提交
stage: deploy           # 阶段，见下表
platforms: [web]        # 适用形态，可多选，见下表
topics: [debug]         # 可选，跨阶段专题，见下表
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

内容骨架是「五步路线 × 四种产品形态」，取值定义在 `src/data/site.ts`：

| `stage` | 阶段 | 聚合页 |
| --- | --- | --- |
| `accounts` | 1 备账号 | `/categories/accounts/` |
| `build` | 2 做出来 | `/categories/build/` |
| `deploy` | 3 放上网 | `/categories/deploy/` |
| `payment` | 4 收到钱 | `/categories/payment/` |
| `review` | 5 过审核 | `/categories/review/` |

| `platforms` | 形态 | 聚合页（按五步串成完整流程） |
| --- | --- | --- |
| `web` | 网站 | `/platforms/web/` |
| `miniprogram` | 小程序 | `/platforms/miniprogram/` |
| `app` | App | `/platforms/app/` |
| `desktop` | 桌面软件 | `/platforms/desktop/` |

每个聚合页可以写一段导语，放在 `src/content/hubs/<stages|platforms|topics>/<取值>.md`，正文显示在页面标题下方，frontmatter 里的 `description` 可以覆盖默认的页面描述。还没有已发布文章的聚合页会自动加 `noindex`，也不进 sitemap。

专题 `topics`：`tools` 工具怎么选、`cost` 成本与时间账、`roles` 按岗位对号、`debug` 翻车与排错、`works` 作品证明，聚合页在 `/topics/<取值>/`。

## 选题地图

`plan/topic-map.yaml` 是整站内容的施工图：每个节点是一个搜索意图，也就是一篇文章（已写的和计划写的都在里面），写明阶段、形态、主关键词、覆盖的长尾问法、优先级，以及正文该链到哪几篇。先改地图，再写文章。

```bash
npm run check:keywords              # build 前会自动运行
npm run check:keywords -- --report  # 额外打印覆盖矩阵、待写的 P1、未核对的文章、缺导语的聚合页
npm run plan:page                   # 生成选题地图浏览页（默认写到 ~/launchpad/pages/aidev-topic-map.html）
```

检查内容：文章必须在地图里有节点；不同节点不能用同一个词，词很像时会提示（确认意图不同的写进节点的 `distinct`）；两篇都发布后，正文要按 `links` 链过去。

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
  content/hubs/       阶段 / 形态 / 专题聚合页的导语
  content.config.ts   文章 frontmatter 的格式定义
  data/site.ts        站点信息、五步路线、产品形态、专题、实战营和占位文案
  layouts/            全站布局
  components/         首页各区块、文章页的路线图定位和文末出口
  pages/              首页、文章页、文章列表、阶段 / 形态 / 专题聚合页、RSS
plan/topic-map.yaml   选题地图（不发布）
scripts/              关键词与选题地图检查
```

## 许可

- 文章（`src/content/`）：[CC BY-NC-SA 4.0](./LICENSE-CONTENT)，转载请署名「冬瓜」并附原文链接，不可商用。
- 网站代码：[MIT](./LICENSE)。
