---
# 2026-11-03：这一步已改用静态支柱页 src/pages/flow/<slug>.astro，这篇旧流程页设为草稿保留
draft: true
title: 开发者账号注册：动手前要准备的 AI 工具和账号，哪些花钱、哪些必须本人实名
description: 开始做产品前，先备好两类东西：一个能直接在电脑上干活的 AI 编程工具（Claude Code 或 Codex），和你要上架的平台的开发者账号。网站暂时不用开发者账号；小程序要注册微信小程序账号，上架前还要备案；iOS App 要加入 Apple Developer Program，年费 99 美元。实名、付款、人脸核验这些只能你本人做。
intent: 准备用 AI 做产品，想知道动手前要注册哪些工具和开发者账号、要不要钱、要不要本人实名
keyword: 开发者账号注册
covers:
  - 开发者账号注册流程
  - 开发者账号注册多少钱
  - 开发者账号注册必须实名吗
  - 开发者账号是什么意思
  - 个人开发者账号怎么申请
stage: accounts
kind: flow
platforms: [web, miniprogram, app, desktop]
topics: [tools]
date: 2026-10-27
answer: 动手前备好两类东西。一是 AI 编程工具：用 Claude Code 或 Codex 都可以，它们能直接在你电脑上建文件、改代码、跑命令，用之前确认服务在你所在地区可用、遵守服务条款。二是开发者账号，按你要做的东西准备：只做网站，暂时不用开发者账号；做微信小程序，注册小程序账号，个人主体要 18 岁以上、微信已实名，上架前必须完成备案；做 iOS App，加入 Apple Developer Program，官网标的年费是 99 美元，以注册时显示的当地价格为准。注册、付款、人脸核验、短信核验都要你本人做，AI 只能帮你列清单、查规则。
steps:
  - who: me
    text: 先定产品形态（网站、小程序、App），据此决定要注册哪些账号
  - who: me
    text: 选一个 AI 编程工具（Claude Code 或 Codex），确认所在地区可用后订阅
  - who: ai
    text: 让 AI 按你的产品形态列一份账号清单：要注册什么、要准备什么材料、哪些要本人做
  - who: me
    text: 用本人身份注册开发者账号，完成实名、付款、人脸和短信核验
  - who: ai
    text: 让 AI 在项目里建一份「账号清单.md」，只记账号用途和登录入口，不记密码
  - who: check
    text: 逐个登录一遍：AI 工具能在项目文件夹里回答你，开发者后台能正常进入
handoff:
  prepare:
    - 你要做的东西：网站、微信小程序、iOS App、安卓 App 还是桌面软件
    - 用什么身份做：个人，还是个体户、公司（决定能不能收款、能选哪些类目）
    - 一个专门用来注册开发平台的邮箱（微信小程序要求这个邮箱没注册过公众平台、开放平台等）
  prompts:
    - title: 列一份账号清单
      text: |-
        我要做一个 [网站 / 微信小程序 / iOS App / 安卓 App]，用 [个人 / 个体户 / 公司] 身份。
        帮我列一份上线前要注册的账号清单，每个账号写清楚：干什么用、在哪个官网注册、要准备什么材料、要不要钱、哪些步骤必须我本人做。
        费用和规则请以官方页面为准，并附上官方链接；查不到的就写「没查到」，不要猜。
      note: AI 查到的规则会过时。涉及钱和资格的，点开它给的官方链接自己看一眼。
    - title: 检查 AI 工具装好没
      text: |-
        我刚装好你，项目文件夹是 [项目文件夹路径]。
        请先只看、不要改：告诉我你现在能不能读写这个文件夹、能不能运行命令，这台电脑上已经装了哪些开发要用的软件、还缺什么。
      note: 这一步在 Claude Code 或 Codex 里说。还装不上它们的时候，把安装时的报错全文复制给任意一个 AI 对话工具问。
    - title: 记一份账号清单
      text: |-
        在项目里建一个「账号清单.md」，记下这个项目用到的每个账号：平台名、用途、登录网址、用哪个邮箱或手机号注册、到期或续费时间。
        不要记任何密码、密钥、验证码。
humanOnly:
  - text: 订阅 AI 编程工具并付款
    note: Claude Code 的大多数用法需要 Claude 付费订阅或 Anthropic Console 账号。Anthropic 的支持地区名单里没有中国内地、香港、澳门。用之前确认服务在你所在地区可用，遵守服务条款。
  - text: 注册微信小程序账号，选主体类型、填主体和管理员信息
    note: 在微信公众平台注册时选「小程序」，用一个没注册过公众平台、开放平台、企业号、没绑定个人微信号的邮箱。个人主体要求 18 岁以上、有国内身份信息的微信实名用户。主体信息提交后不能改，个人和企业选错了只能重新注册。
  - text: 小程序上架前做备案：本人证件、人脸核验、工信部短信核验
    note: 微信官方备案问答写明「小程序上架需先完成备案」。个人主体要用本人有效身份证件，负责人在平台现场拍照核验；工信部会用 12381 发核验短信，要在 24 小时内完成，否则备案被自动退回。
  - text: 加入 Apple Developer Program 并付年费
    note: 需要一个开了双重认证的 Apple 账户，Apple 账户里的名字必须是法定姓名，不能用昵称或公司名，这个名字会作为开发者名称显示在 App Store。个人用信用卡付款要用本人的卡，否则会延迟，还可能被要求提供带照片的身份证件。
  - text: 以公司身份注册苹果开发者账号的，申请邓白氏编码（D-U-N-S）
    note: 组织注册要求是法人实体，还要有 D-U-N-S 编号、带公司域名的工作邮箱、能公开访问的公司网站。个人先用个人身份注册就行。
verify:
  - 在项目文件夹里打开 Claude Code 或 Codex，问它「这个文件夹里有什么」，它能回答
  - 小程序后台能登录，主体类型是你想要的（个人还是企业）
  - 苹果开发者账号付款后，收到会员资格确认邮件
  - 项目里有一份「账号清单.md」，里面没有任何密码
troubleshoot:
  - symptom: 注册小程序时提示邮箱已被占用
    cause: 这个邮箱注册过公众号、开放平台、企业号，或者绑定过个人微信号
    say: 微信小程序注册提示邮箱不能用。帮我查一下官方对注册邮箱的要求，告诉我该换什么样的邮箱。
  - symptom: 个人小程序选不到想要的类目，或者开不了微信支付
    cause: 个人主体有开放类目限制；微信官方说明里个人类型账号暂不支持微信认证，而微信支付要已认证的小程序才能申请
    say: 我用个人身份注册了小程序，想做 [你的功能]，帮我查官方规则：个人主体能不能做、能选哪个类目、要收款需要什么主体。只列官方写了的。
  - symptom: 苹果开发者账号付了钱，迟迟没开通
    cause: 姓名不是法定姓名、用的不是本人信用卡，都会导致审批延误
    say: 我在 [日期] 付了 Apple Developer Program 的费用，到现在没收到确认。帮我对照苹果官方注册要求，列出可能卡住的地方和联系开发者支持时要提供的信息（比如注册 ID）。
  - symptom: Claude Code 或 Codex 装不上、登录不了
    cause: 安装命令和你的系统不匹配，或者服务在你所在地区不可用
    say: 我在 [Windows / Mac] 上安装 [工具名] 出现下面的报错：[报错全文]。先告诉我是什么原因，再告诉我怎么改。
boundaries:
  - 不要把任何平台的登录密码、验证码交给 AI，注册和登录由你自己完成
  - 不要用别人的身份证、别人的信用卡注册，也不要买现成的开发者账号：苹果要求本人姓名、本人信用卡，小程序备案负责人要求是本人
  - 用户协议、开发者协议由你自己读、自己点同意，不让 AI 替你点
  - 不要让 AI 把账号密码、API 密钥写进代码或会公开的文件里
aiRun: true
sources:
  - title: Apple Developer：注册 Apple Developer Program
    url: https://developer.apple.com/cn/programs/enroll/
  - title: Apple Developer：购买和激活支持
    url: https://developer.apple.com/cn/support/purchase-activation/
  - title: Apple Developer：注册支持
    url: https://developer.apple.com/cn/support/enrollment/
  - title: 微信开放文档：小程序接入指南（注册与主体类型）
    url: https://developers.weixin.qq.com/miniprogram/introduction/
  - title: 微信开放文档：小程序备案操作指引
    url: https://developers.weixin.qq.com/miniprogram/product/record/record_guidelines.html
  - title: 微信开放文档：小程序备案常见问答
    url: https://developers.weixin.qq.com/miniprogram/product/record/record_faq.html
  - title: 微信开放文档：微信认证指引
    url: https://developers.weixin.qq.com/miniprogram/product/renzheng.html
  - title: Claude Code：Overview
    url: https://code.claude.com/docs/en/overview
  - title: Anthropic：Supported Countries and Regions
    url: https://www.anthropic.com/supported-countries
reviewed: 2026-10-27
faq:
  - q: 开发者账号是什么意思？
    a: 就是你在某个平台发布产品用的身份。微信小程序要有小程序账号，App Store 要加入 Apple Developer Program。账号的主体（个人还是公司）决定了你能做哪些类目、能不能收款。
  - q: 开发者账号注册多少钱？
    a: 苹果官网标的年费是 99 美元，注册时按当地货币显示，以注册页为准。微信小程序注册本身官方没写要收费；企业做微信认证要付审核服务费，金额以公众平台后台显示为准。
  - q: 开发者账号注册必须实名吗？
    a: 必须。苹果要求 Apple 账户里是法定姓名；微信小程序的个人主体要求是微信实名用户，上架前备案还要本人证件、人脸核验和工信部短信核验。
  - q: 个人开发者账号怎么申请？
    a: 小程序：在微信公众平台选「小程序」注册，主体类型选「个人」。苹果：用开了双重认证的 Apple 账户，在 Apple Developer 官网或 Apple Developer App 里以个人身份注册并付年费。
  - q: 个人小程序可以备案几个？
    a: 微信官方备案问答写的是个人主体最多备案 5 个小程序，而且不能选经营性质或需要主管部门审批的服务内容。
stuckNext: 工具和账号备齐了，接下来卡在让 AI 做出能跑的东西、处理满屏报错
---

> 本文的费用和规则以 Apple Developer、微信公众平台官方页面为准，核对日期见文末。用 Claude Code 或 Codex 前，先确认服务在你所在地区可用，遵守服务条款。

## <span class="role-tag me">🧑 你来做</span> 先判断：你要做的东西需要哪些账号

开发者账号跟着产品形态走，先定做什么，再去注册：

| 你要做的 | 要准备的账号 | 必须本人做的 |
| --- | --- | --- |
| 网站 | 暂时不用开发者账号；放上网时再买服务器、域名，见 [服务器和部署](/flow/deploy/) | 云厂商实名、付款 |
| 微信小程序 | 微信小程序账号 | 实名注册、上架前备案（人脸核验、短信核验） |
| iOS App | Apple Developer Program 会员 | 法定姓名注册、本人信用卡付年费 |
| 安卓 App、桌面软件 | 各应用市场的开发者账号，有的还要软件著作权 | 各平台规则不同，等确定要上再查 |

还没定做什么，就先只备 AI 编程工具，账号等第一版做出来再注册。

**个人还是公司身份**也要先想好。微信小程序的主体信息提交后不能改；个人主体能选的类目有限，也开不了微信支付。只是想先验证有没有人用，个人身份就够；收款的事见 [收款和资质](/flow/payment/)。

## <span class="role-tag me">🧑 你来做</span> AI 编程工具：Claude Code 或 Codex

用 Claude Code 或 Codex 都可以。它们和网页上的对话工具不一样：能直接在你电脑上建文件夹、写代码、跑命令、看报错，你只负责说要什么、看结果。后面每一步都靠它干活。

<mark class="todo">待定</mark>：对外是否点名推荐具体工具，以及推荐哪一个，还没定。

不建议走「装一个 AI 编辑器再加插件」那条路，新手直接用 Claude Code 或 Codex，少学一层界面。

两件事先确认：

- **地区和条款**：确认服务在你所在地区可用，遵守服务条款。Anthropic 公布的支持地区名单里没有中国内地、香港、澳门。
- **费用**：Claude Code 的大多数用法需要 Claude 付费订阅或 Anthropic Console 账号。各家价格对比见 [不会编程用什么 AI](/articles/ai-coding-tools-choice/)（那篇是工具综述，价格以各家官网为准）。先按月订阅，用顺手了再考虑别的档位。

## <span class="role-tag me">🧑 你来做</span> 哪些账号要提前注册

- **苹果开发者账号**：要做 iOS App 就早点注册。付款后没开通、姓名不对都会卡住，别等 App 做完再弄。
- **微信小程序账号**：决定做小程序，就先注册。上架前必须完成备案，备案要等平台初审和通信管理局审核，官方写的通管局审核是 1～20 个工作日，可以和开发同时进行。
- **服务器、域名**：网站要用的，到 [服务器和部署](/flow/deploy/) 那一步再买，不用提前。

## <span class="role-tag ai">🤖 交给 AI</span> 列清单、查规则、记账号

注册本身 AI 替不了，但下面这些可以交给它：

- 按你的产品形态，列出要注册的账号和每个账号要准备的材料
- 查官方规则：个人主体能不能做你想做的功能、能选哪个类目
- 帮你检查 AI 工具装好没、电脑上还缺什么开发软件
- 在项目里建一份「账号清单.md」，以后续费、交接都看这一份

让它查规则时，一定要它**附上官方链接**，查不到就写「没查到」。
