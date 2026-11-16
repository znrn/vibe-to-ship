---
title: app 内收费必须用什么支付：苹果内购怎么选、抽成和结算怎么算
description: iPhone App 卖数字功能通常要用苹果内购，实物和 App 外使用的服务另走支付方式。中国大陆 App Store 标准佣金已调整为 25%，符合小型企业计划条件的内购为 12%；先确认销售地区，再让 AI 接入并测试。
intent: App 里要收费，想知道是不是必须走苹果内购、苹果抽多少
keyword: app 内收费必须用什么支付
covers:
  - 苹果抽成 30%
  - 苹果小型企业计划 15%
  - App 里能不能接微信支付
  - 苹果内购的钱怎么结算
  - 苹果内购流程
stage: payment
kind: question
platforms: [app]
topics: [cost, roles]
date: 2026-11-16
reviewed: 2026-11-16
answer: 在中国大陆 App Store 上架，App 内解锁数字功能、会员或内容，通常要用苹果内购；实物和 App 外使用的服务则用其他支付方式。不要统一按 30% 算：大陆标准佣金已改为 25%，符合小型企业计划条件的内购为 12%；其他地区另核对条款。你决定收费内容、填写收款资料，让 Claude / Codex 接入，再亲自测试。满足结算条件后，苹果在交易所属财务月结束后 45 天内付款。
steps:
  - who: me
    text: 列清收费内容和销售地区，判断买到的是数字功能还是实物、线下服务
  - who: ai
    text: 核对适用支付规则与佣金，整理内购接入方案和后台填写清单
  - who: me
    text: 接受付费协议，填写银行与税务资料，符合条件时申请小型企业计划
  - who: ai
    text: 按确认的商品方案接入购买、恢复购买及付费权限处理，准备测试版本
  - who: check
    text: 在测试环境检查付款前后能用什么，再核对审核资料和结算状态
handoff:
  prepare:
    - 项目文件夹、App 用途、计划销售的 App Store 国家或地区
    - 收费内容、期望价格，以及买断、按次购买或订阅的想法
    - 现有免费功能、网站会员与 App 会员的关系；没有就说明没有
    - 后台协议状态、内购商品信息和错误截图；先遮住银行账号等私人信息
  prompts:
    - title: 先判断我的 App 应该怎样收费
      text: |-
        我的 App 用来 [产品用途]，项目在 [文件夹路径]，准备在 [国家或地区] 销售。
        用户付费后得到 [具体功能、内容或服务]，我想采用 [买断、按次购买或订阅]。
        请先只读检查项目，打开 Apple 当前官方规则，判断这种收费适用什么支付方式。
        区分销售地区、商品性质和我的计划资格，说明佣金依据，不要直接套用网上的统一费率。
        给我商品方案、需要我填写的后台信息，以及接入后怎么用手机验收。
        不读取密钥、银行信息或真实用户数据，不上传、不提交审核。
    - title: 按确认的方案完成内购接入
      text: |-
        已确认采用 [内购商品方案]，后台商品信息为 [商品标识与状态]。
        请在本地项目实现购买、适用的恢复购买和付费权限处理。
        请考虑取消付款、付款失败、订阅状态变化及退款后的处理，不要只做一个显示成功的按钮。
        用大白话列出我需要亲自完成的后台操作，准备测试步骤并说明当前测试环境。
        完成后分别报告已实现、已测试、需要我真机验证的部分。不要把测试交易说成真实收入，不自行上传或提审。
humanOnly:
  - text: 决定卖什么、定什么价格，以及用户付费后实际得到哪些功能
  - text: 用自己的开发者账号接受协议，如实填写银行、税务和小型企业计划申请资料
  - text: 核对后台商品名称、价格、销售地区和审核说明，再操作提交
  - text: 用手机验收测试版本，并在正式销售后核对苹果付款记录与银行入账
verify:
  - 测试前确认当前是苹果沙盒或 TestFlight 测试环境；沙盒就是模拟交易的环境
  - 购买页展示的商品、价格与预期一致，付款成功后实际能使用对应功能
  - 取消或失败时没有被误当成成功，重新打开 App 后付费状态仍正确
  - 适用的恢复购买可以找回权益；订阅与退款场景按 AI 给出的测试步骤逐项验证
  - 测试成功、审核通过、正式成交和银行到账分别核对，不把其中一项当成全部完成
troubleshoot:
  - symptom: 购买页读不到商品或价格
    cause: 可能是协议状态、商品资料或项目中的标识不一致，需要逐项检查
    say: 请核对 [后台状态与错误截图]、商品标识和 App 标识，列出证据与我需要检查的字段，不要先重写整个支付流程。
  - symptom: 显示购买成功，但功能没有解锁
    cause: 可能只显示了付款提示，没有正确处理实际交易与用户权限
    say: 请跟踪这次测试交易如何变成可用权限，检查重新打开 App 后的结果，并给我复测步骤。
  - symptom: 内购被拒，不知道改商品还是改 App
    cause: 需要结合完整审核消息，区分商品资料、实际功能和支付规则问题
    say: 请对照 [完整拒审消息] 和当前提审版本逐项解释，列出修改方案与验收路径，不编造已完成的修复。
    link: app-store-rejected
boundaries:
  - 不把 Apple 账号密码、签名私钥、银行账号或真实用户交易资料贴进对话
  - 不让 AI 用二维码、隐藏入口或虚假商品说明规避适用的内购要求
  - 不让 AI 代填不真实的税务、银行或关联开发者账号信息
  - 不让 AI 未经确认改正式价格、上传版本或提交审核
aiRun: true
sources:
  - title: Apple：App Review Guidelines
    url: https://developer.apple.com/app-store/review/guidelines/
  - title: Apple：对中国 App Store 的 iOS 及 iPadOS 的调整
    url: https://developer.apple.com/cn/news/?id=dadukodv
  - title: Apple：Apple Developer Program License Agreement
    url: https://developer.apple.com/support/terms/apple-developer-program-license-agreement/
  - title: Apple：App Store Small Business Program
    url: https://developer.apple.com/app-store/small-business-program/
  - title: Apple：Overview for configuring In-App Purchases
    url: https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/
  - title: Apple：Testing at all stages of development with Xcode and the sandbox
    url: https://developer.apple.com/documentation/storekit/testing-at-all-stages-of-development-with-xcode-and-the-sandbox.md
  - title: Apple：Submit an In-App Purchase
    url: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/
  - title: Apple：Overview of receiving payments
    url: https://developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments
faq:
  - q: 个人开发者也能申请苹果小型企业计划吗？
    a: 可以，计划面向符合条件的小企业和个人开发者，新开发者也可申请。需要按官方要求申报收益和关联账号，由账号持有人申请，不是注册后自动享受。
  - q: 苹果小型企业计划的 100 万美元，是指用户付款总额吗？
    a: 不是。官方使用 proceeds，指扣除苹果佣金、某些税款和调整后的收益；你与关联开发者账号的收益需要合并计算。
  - q: App 原来免费，现在加内购，需要一起交新版本吗？
    a: 首次提交某一种类型的内购或订阅，需要与新 App 版本一起提交。首次提交订阅还要包含对应订阅群组，具体以官方提交说明为准。
  - q: TestFlight 里测试付款，会真的扣钱吗？
    a: TestFlight 的苹果内购使用沙盒，测试交易不产生实际扣款。测试成功只能说明对应测试路径可用，不能当作已经收到真实收入。
  - q: 苹果抽成扣完，剩下的就一定是银行卡到账金额吗？
    a: 不能直接这样算。适用税费、汇率和银行或中间机构费用都可能影响结果；用 App Store Connect 的付款与财务报告对照实际入账。
stuckNext: 内购做好后，如果审核对收费入口或商品内容提出问题，先逐条处理拒审消息
next: app-store-rejected
sample: false
---

> 本文面向用 AI 做 iPhone App、准备加入收费功能的人，主要按中国大陆 App Store 说明。支付规则和佣金因销售地区、商品及适用协议而异，以 Apple 当前官方文件和账号适用条款为准；费率不要只凭旧教程判断。

## <span class="role-tag me">🧑 你来做</span> 先判断：App 里收的到底是什么钱？

先写一句话：“用户付钱以后，会得到什么？”不要先让 AI 加微信支付按钮。

苹果内购，也叫 App 内购买或 IAP，是 Apple 提供的 App 内数字商品购买机制。按审核指南，可以先这样分：

| 你准备卖什么 | 支付方向 |
| --- | --- |
| App 内解锁高级功能、会员或付费内容 | 通常使用苹果内购，对照 3.1.1 |
| 实物，或在 App 外使用的服务 | 使用内购以外的支付方式，对照 3.1.3(e) |
| 已有网站会员，想让用户在 App 登录使用 | 先核对跨平台服务等具体条款，不能只凭“网站已收钱”下结论 |

以上判断来自 [Apple：App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)。地区例外和特定业务例外需要单独核对，不能把别人的付款页面直接复制到自己的 App。

建议在 Claude / Codex 新建一个项目对话，说清自己的想法和项目位置，把上面的交接提示词发过去。让 AI 先给出适用条款和方案，你确认后再做接入。

## App 里能不能接微信支付？

**要先判断这笔钱是否属于必须走内购的数字消费。** 面向中国大陆商店，在 App 内卖高级功能，不能直接用微信收款码替换苹果内购。Apple 的 3.1.1 明确限制用自建机制解锁功能，例子包括二维码。

实物和 App 外使用的服务则要求用其他支付方式。这只能说明苹果这一侧的分类要求；选择微信支付前，还要核对微信的商户与产品准入条件。不要把“允许其他支付方式”理解成任何个人账号都能直接接入。[来源：Apple 支付审核规则](https://developer.apple.com/app-store/review/guidelines/#payments)

对普通工具 App，建议先把一个收费功能的购买与使用过程做完整，再增加其他商品。这样你更容易亲自检查：用户买了什么，付款后是否真的能用。

## 苹果抽成还是 30% 吗？小型企业计划还是 15% 吗？

**这两个数字不能统一套在中国大陆商店。** Apple 公告写明，自 **2026 年 3 月 15 日**起，中国大陆 App Store 的 iOS、iPadOS 标准佣金由 30% 调整为 **25%**，符合小型企业计划条件的内购佣金由 15% 调整为 **12%**。

| 适用情况 | 佣金 |
| --- | --- |
| 通用付费协议中的标准费率，未适用地区或计划调整 | 30% |
| 小型企业计划介绍页列出的通用优惠费率 | 15% |
| 中国大陆商店的标准内购、付费 App 交易 | 25% |
| 中国大陆商店符合小型企业计划条件的内购交易 | 12% |
| 中国大陆商店符合条件、第一年后的自动续费订阅 | 12% |

通用 30% 来自付费协议 Schedule 2 的 3.4；小型企业计划首页仍介绍 15%。中国大陆的调整见专项公告和许可协议附件 13。它们适用范围不同，**不能看见计划首页的 15%，就忽略大陆调整**。其他地区也应检查是否适用额外条款。

订阅优惠中的年限按用户在同一订阅群组内累计的付费服务判断，不是 App 上线满一年就自动适用。

来源：[Apple：中国商店调整公告](https://developer.apple.com/cn/news/?id=dadukodv)、[Apple：许可协议及付费协议](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)、[Apple：小型企业计划](https://developer.apple.com/app-store/small-business-program/)。

定价前，把销售地区、收费方式和计划资格一起交给 AI 核算。不要把“售价减去佣金”直接当成利润，还要放入你自己的服务成本；实际佣金以官网当前规则及适用协议为准。

## 苹果小型企业计划要怎么申请？

不是只有公司能申请，也不是个人开发者自动加入。官方要求看你和关联开发者账号的合计收益：上一日历年对应的财务月份合计不超过 **100 万美元**，本年也不超过这一门槛；新开发者也可符合条件。本年超过门槛后，后续销售适用标准佣金。

这里的“收益”不是用户支付总额，官方口径已扣除苹果佣金、某些税款和调整。关联账号也要如实申报，不能只拿其中一个 App 的收入判断。

由账号持有人接受最新付费 App 协议，再从官方计划页面申请，按要求填写关联账号。申请后核对批准和生效情况，再更新自己的成本估算。[来源：Apple：App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)

## 苹果内购流程怎么走？哪些交给 AI？

你负责商品和账号资料，代码接入交给 Claude / Codex。App Store Connect 是管理 App、内购商品和收款资料的后台；StoreKit 是 App 接入苹果购买功能所用的工具。

建议按下面的顺序推进：

1. **你处理协议和收款资料。** 官方配置流程要求账号持有人接受付费 App 协议，并提供银行和税务信息；沙盒测试时协议也需要处于 Active 状态。
2. **让 AI 整理商品方案。** 写清商品名称、说明、价格和销售地区。你核对后填写后台，让 AI 检查项目与后台的商品标识是否一致。
3. **让 AI 做完整购买流程。** 包括付款后给用户开放什么，以及适用的恢复购买、退款和订阅状态处理。要求它同时给你测试步骤。

后台准备与接入依据见 [Apple：配置内购概览](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/)。不懂某个后台字段时，发遮住私人信息的截图，让 AI 解释后再填。

接着，用手机在沙盒或 TestFlight 中检查。不要只看付款弹窗：要实际使用付费功能，再试取消、恢复购买等适用场景。Apple 说明 TestFlight 内购使用沙盒，不产生真实扣款。[来源：Apple：内购测试环境说明](https://developer.apple.com/documentation/storekit/testing-at-all-stages-of-development-with-xcode-and-the-sandbox.md)

最后再准备提审。**首次提交每一种类型的内购或订阅，都要带新 App 版本一起提交**；首次订阅还要包含对应订阅群组。核对相关项目都在同一次提交中，再操作送审。[来源：Apple：Submit an In-App Purchase](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/)

## 苹果内购的钱怎么结算，多久能到账？

苹果结算到你在 App Store Connect 登记的银行账户。付款前需要付费协议有效、银行信息齐全、达到适用的最低付款门槛，并完成所在地区适用的月度开票要求。

满足条件时，Apple 说明会在**交易完成所属财务月的最后一天之后 45 天内付款**。这是苹果财务月结束后的付款窗口，不是每个用户购买后立刻转账，也不是承诺某个固定日期到账。

到 App Store Connect 的 **Payments and Financial Reports（付款与财务报告）**查看未付款项、已付款金额及汇率，再对照银行记录。银行或中间机构费用也可能影响最终入账。[来源：Apple：Overview of receiving payments](https://developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments)

## 内购做好了，苹果审核还是被拒怎么办？

把完整拒审消息、商品资料和实际提审版本交给 AI，让它先解释问题，再决定修改范围。不要只发一句“内购被拒了，帮我改”。

具体处理方式见 [苹果审核被拒怎么办：让 AI 看懂拒审理由，改完再决定怎么提交](/articles/app-store-rejected/)。修改后仍由你用手机重走购买与使用路径，再核对后台提交结果。
