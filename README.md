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
category: deploy        # 八大分类之一，见下表
roadmapStep: 3          # 1 备账号 / 2 做出来 / 3 放上网 / 4 收到钱 / 5 过审核
date: 2026-10-22
answer: 一句话结论，显示在标题下方的「结论」块里
steps:                  # 可选，照做步骤
  - 第一步
  - 第二步
stuckNext: 接下来通常会卡在的地方   # 可选，不填就按下一步路线自动生成
next: first-payment-without-license  # 可选，下一篇推荐（填文件名，不带 .md）
sample: true            # 示例文章会显示「示例」标记
draft: false            # 草稿不会发布
---
```

八大分类的 `category` 取值：

| 取值 | 分类 |
| --- | --- |
| `mvp` | 最小可上线 |
| `accounts` | 账号与资质 |
| `deploy` | 上线链路 |
| `tools` | 工具怎么选 |
| `cost` | 成本与时间账 |
| `roles` | 按岗位对号 |
| `debug` | 翻车与排错 |
| `works` | 作品证明 |

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
  content.config.ts   文章 frontmatter 的格式定义
  data/site.ts        站点信息、八大分类、五步路线、实战营和占位文案
  layouts/            全站布局
  components/         首页各区块、文章页的路线图定位和文末出口
  pages/              首页、文章页、文章列表、分类页、RSS
```

## 许可

- 文章（`src/content/`）：[CC BY-NC-SA 4.0](./LICENSE-CONTENT)，转载请署名「冬瓜」并附原文链接，不可商用。
- 网站代码：[MIT](./LICENSE)。
