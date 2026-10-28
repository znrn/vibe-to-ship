---
title: 不会写代码怎么做网页：新建项目、说想法，让 AI 找模板改或从零写
description: 不会写代码也能做网页：打开 Claude Code 或 Codex，新建一个空文件夹，用大白话说想法，让 AI 先找现成的开源模板来改，没有合适的再从零写。在自己电脑上看效果、继续改，做好后拖到 Netlify Drop 或 Cloudflare Pages 就有一个别人能打开的网址。
intent: 完全不会写代码，想用 AI 自己把一个网站 / 网页从零做出来
keyword: 不会写代码怎么做网页
covers:
  - 不会写代码怎么自己做网站
  - 不会写代码怎么用ai做网站
  - 零基础做网站用什么软件
  - 自己做网站怎么做
  - 不会编程做网站怎么做
  - 做网站需要写代码吗
stage: build
platforms: [web]
date: 2026-10-27
updated: 2026-10-27
answer: 不会写代码也能做网页：代码交给 AI，你只负责说清楚要什么、看效果、提修改。打开 Claude Code 或 Codex，新建一个空文件夹，用大白话说想法，让它先找有没有现成的开源模板可以改，没有合适的再从零写。它会在你电脑上把网页做出来、打开给你看。满意后把做好的文件夹拖到 Netlify Drop 或 Cloudflare Pages，几分钟就有一个别人能打开的网址，不用买服务器。
steps:
  - who: me
    text: 用一句话写清楚：这个网页给谁看、解决什么问题、希望看的人做什么
  - who: ai
    text: 在 Claude Code 或 Codex 里新建空项目，让它先找现成的开源模板，没有再从零写
  - who: check
    text: 让 AI 在你电脑上打开预览，像访客一样点一遍，哪里不对用大白话让它改
  - who: me
    text: 把做好的文件夹拖到 Netlify Drop 或 Cloudflare Pages，拿到公网网址
handoff:
  prepare:
    - 一句话需求：给谁看、解决什么问题、希望看的人做什么
    - 页面上要有的内容：标题、几个卖点、联系方式或按钮
    - 一个新建的空文件夹，比如 my-site
  prompts:
    - title: 先找模板，没有再从零写
      text: |-
        我想做一个网页：给 [谁] 看，介绍 [什么]，看完希望他 [做什么]。
        页面要有：[标题、三个卖点、一个联系方式或按钮]。
        先别急着写代码：帮我找找有没有现成的开源网页模板适合改，告诉我候选和你的推荐；没有合适的就从零写。
        要求：手机和电脑上都好看；不要登录、不要数据库、不要后台；做好后在我电脑上打开给我看。
    - title: 改到满意
      text: 「[哪个位置]」现在是 [现在的样子]，我想要 [想要的样子]。先只改这一处，改完打开给我看。
      note: 一次只提一处修改，说清位置和想要的样子。改出满意的版本后，让 AI 存一个版本，改坏了能退回来。
    - title: 准备上线
      text: 网页已经满意了。告诉我要把哪个文件夹拖到 Netlify Drop 或 Cloudflare Pages 上线，需要的话先帮我把它整理成可以直接上传的样子。
humanOnly:
  - text: 决定网页上写什么：给谁看、卖点、联系方式
  - text: 把文件夹拖到 Netlify Drop 或 Cloudflare Pages（Cloudflare 需要注册账号）
verify:
  - 电脑和手机上都打开看一遍，排版不乱
  - 每个按钮、链接都点一下
  - 上线后把网址发到手机上，用流量打开
troubleshoot:
  - symptom: AI 改一处、坏一处
    cause: 一次提了好几个修改，或者没存版本
    say: 帮我回到上一个能用的版本。之后每次只改一处，改完先打开给我看。
  - symptom: 页面上中文是乱码
    cause: 文件编码不对
    say: 页面上的中文显示成乱码，帮我检查文件编码，统一改成 UTF-8。
boundaries:
  - 用开源模板时，让 AI 告诉你它的开源协议，确认允许你这样用
  - 第一版不要让 AI 加登录、支付、后台
sources:
  - title: Cloudflare Pages：Direct Upload（直接上传）
    url: https://developers.cloudflare.com/pages/get-started/direct-upload/
  - title: Netlify：创建部署（含 Netlify Drop 拖拽部署）
    url: https://docs.netlify.com/deploy/create-deploys/
  - title: MDN：HTML 基础
    url: https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Getting_started/Your_first_website/Creating_the_content
reviewed: 2026-10-27
faq:
  - q: 做网站一定要会写代码吗？
    a: 不用。代码交给 AI 写，你要会的是把需求说清楚、检查效果、用大白话提修改。
  - q: 零基础做网站用什么软件？
    a: 冬瓜的做法是直接用 Claude Code 或 Codex 这类 AI 编程智能体，它们能自己新建文件、写代码、打开预览。选法和价格见「不会编程用什么 AI」。
  - q: 为什么要先找开源模板？
    a: 现成的模板已经有人做好、改好，拿来改比从零写更快、问题更少。让 AI 去找，你只需要从它给的候选里挑一个。找不到合适的再从零写。
  - q: 做好的网页手机上能看吗？
    a: 能。让 AI 做的时候就说明「手机上也要好看」，上线后把网址发到手机上打开检查一遍。
  - q: 要花钱吗？
    a: 放上网可以不花钱：Netlify 和 Cloudflare Pages 都有免费档。AI 编程工具一般要按月订阅。想用自己的域名、或者放到国内服务器上，才需要买域名和服务器。
stuckNext: 网址有了，但想换成自己的域名、让国内用户打开更稳
next: icp-filing-process
---

> 本文适合做产品介绍页、作品集、活动页这类**一个页面**的网站。要做登录、付款、后台的完整产品，也是同样的开头，后面的步骤见 [开发和报错](/flow/build/)。

## <span class="role-tag me">🧑 你来做</span> 先用一句话说清楚要做什么

动手前写下这句话，后面所有修改都以它为准：

> 这个网页给 **谁** 看，帮他 **解决什么问题**，看完希望他 **做什么**。

例如：「给想学 AI 做产品的上班族看，介绍我的周末实战营，看完希望他加我微信报名。」

## <span class="role-tag ai">🤖 交给 AI</span> 新建项目，说想法，先找模板

冬瓜的做法是用 Claude Code 或 Codex（选法见 [不会编程用什么 AI](/articles/ai-coding-tools-choice/)）：

1. 新建一个空文件夹，比如 `my-site`，在 Claude Code 或 Codex 里打开它。
2. 把上面那句话和页面要有的内容告诉它，让它**先找有没有现成的开源模板**可以改；没有合适的，再从零写。
3. 它会在你电脑上把网页做出来，并打开给你看。

先找模板，是因为现成的东西别人已经做好、调好，改起来比从零写更快、问题更少。怎么判断一个开源项目能不能用，见 [选底子：开源二开还是从零写](/flow/base/)。

## <span class="role-tag check">✅ 你来验收</span> 在自己电脑上看效果、继续改

像访客一样把页面点一遍，哪里不满意就说**哪里、现在什么样、想要什么样**：

- 「标题太小了，手机上看不清，放大一些，颜色改成深绿色。」
- 「三个卖点在手机上挤成一排了，改成上下排列。」

一次只改一处。改出满意的版本后，让 AI 存一个版本，后面改坏了还能退回来。

## <span class="role-tag me">🧑 你来做</span> 放上网，拿到一个网址

把做好的文件夹上传到下面任意一个平台，就能得到一个公网网址：

| | Netlify Drop | Cloudflare Pages |
| --- | --- | --- |
| 怎么传 | 打开 `app.netlify.com/drop`，把文件夹拖进去 | 控制台里选 Workers & Pages → Create application → 拖拽上传文件夹或 zip |
| 要不要账号 | 不登录也能发布，建议注册，方便以后更新 | 需要 Cloudflare 账号 |
| 得到的网址 | 系统分配的网址 | `项目名.pages.dev` |
| 限制 | 单页网站基本碰不到 | 拖拽上传最多 1000 个文件，单个文件不超过 25 MiB |

这两个都是**海外服务**，国内用户打开的速度和稳定性没有保证，适合先给自己、朋友和第一批用户看。打算长期面向国内用户，就要换成国内服务器并做 ICP 备案，见 [服务器和部署](/flow/deploy/) 和 [ICP 备案流程](/articles/icp-filing-process/)。

## 第一版别急着做这些

登录注册、在线支付、管理后台，每一样都能卡你好几天，又都回答不了最重要的问题：**有没有人想要**。先用一个页面把想法讲清楚、收集到第一批意向，再决定要不要往下做。为什么这样做，见 [第一个产品先别做登录和支付](/articles/single-page-first/)。
