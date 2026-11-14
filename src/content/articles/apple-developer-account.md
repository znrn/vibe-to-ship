---
title: 苹果个人开发者注册：怎么申请、每年多少钱、付款失败怎么查
description: 个人上架 iOS App，可以用本人身份加入 Apple Developer Program。中国大陆通过 Apple Developer App 注册，官方列示每年 688 元；先确认是否接受公开真实姓名，再完成身份验证和购买，最后检查会员资格是否生效。
intent: 个人想上架 iOS App，要注册苹果开发者账号，想知道流程和费用
keyword: 苹果个人开发者注册
covers:
  - 苹果开发者账号 688 元
  - Apple Developer Program 个人注册
  - 苹果开发者账号付款失败
  - 苹果开发者账号一年多少钱
  - 苹果个人开发者账号申请流程
  - 苹果开发者账号个人和公司的区别
  - 苹果开发者账号审核需要多久
stage: accounts
kind: question
platforms: [app]
topics: [cost]
date: 2026-11-14
reviewed: 2026-11-14
answer: 个人上架 iOS App，可以用本人身份加入 Apple Developer Program，不必为了注册先成立公司。个人的法定姓名会作为供应商显示在 App Store。中国大陆通过 Apple Developer App 注册，官方列示每年 688 元，自动续订，实际以购买页面为准。让 Claude / Codex 帮你核对清单，你本人完成实名、协议和付款；付款后还要检查会员资格确认。
steps:
  - who: me
    text: 确认要上架 App Store，并接受个人法定姓名作为供应商公开显示
  - who: ai
    text: 让 Claude / Codex 根据 Apple 官方说明整理注册清单和当前页面的操作顺序
  - who: me
    text: 准备启用双重认证的 Apple 账户，在 Apple Developer App 中选择个人并验证身份
  - who: me
    text: 阅读协议，核对年费及自动续订条款，亲自完成购买
  - who: check
    text: 查看确认邮件并登录开发者账户，核实注册状态
handoff:
  prepare:
    - 产品要上架的平台，以及现在是做原型还是准备提交 App
    - 注册所在地区、打算以个人还是组织身份申请
    - 使用 App 还是网页注册、当前停在哪一步；报错截图先遮住个人信息
  prompts:
    - title: 让 AI 帮我准备注册
      text: |-
        我在做 [产品想法]，准备用 [个人或组织] 身份上架 iOS App，注册地区是 [实际地区]。
        请新建一份项目注册清单，对照 Apple 官方注册文档，说明我需要准备什么、哪些信息会公开、接下来该操作哪个页面。
        我用 [Apple Developer App 或网页]，当前页面提示是 [提示原文]。
        请区分官方要求和你的建议，每条费用、时限、资格要求附官方链接；查不到的不要猜。
        登录、身份验证、同意协议和付款由我自己完成，不要索取密码、验证码、证件照片或银行卡资料。
humanOnly:
  - text: 决定用谁的身份注册，并确认是否接受真实姓名公开显示
  - text: 登录自己的 Apple 账户，填写真实资料，按官方页面完成身份验证
  - text: 阅读协议、核对价格和续订条款，亲自确认付款
  - text: 需要联系 Apple 时，由你在官方支持入口提交注册信息
verify:
  - 用注册时的 Apple 账户登录开发者网站，检查注册状态，而不是只看扣款通知
  - 核对会员资格确认邮件；只有订单回执时，继续检查账户状态
  - 记录自己选择的续订方式和购买页面显示的费用，方便以后管理
troubleshoot:
  - symptom: 注册资料被要求重新核实
    cause: 先检查姓名是否使用了昵称或公司名；Apple 明确说明错误姓名会延误审批
    say: 我的提示是 [去除个人信息后的原文]，帮我对照官方资料要求列检查项，不要替我编身份信息。
  - symptom: 付款页面无法完成购买
    cause: 需要区分 App 内购买和网页付款；两种入口的付款要求不同
    say: 我使用 [入口]，报错是 [原文]。请查官方说明，区分付款方式限制和需要联系支持的问题，不要直接建议再次扣款。
  - symptom: 已购买却没收到会员资格确认
    cause: 订单回执和会员资格确认不是同一个状态，需要查看开发者账户
    say: 帮我整理给 Apple Developer Support 的问题说明，保留注册 ID 栏位让我自己填写，不替我发送。
boundaries:
  - 不把 Apple 账户密码、验证码、身份证照片、自拍照或银行卡资料交给 AI
  - 不让 AI 编造姓名、地址、组织信息，也不让它自行确认购买或接受协议
  - 不把 AI 的判断、扣款通知或订单回执当成会员资格已经生效
sources:
  - title: Apple Developer：成为会员
    url: https://developer.apple.com/cn/programs/enroll/
  - title: Apple Developer：使用 Apple Developer App 注册、验证和续订
    url: https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app/
  - title: Apple Developer：计划注册
    url: https://developer.apple.com/cn/help/account/membership/program-enrollment/
faq:
  - q: 苹果个人开发者注册需要先开公司吗？
    a: 不需要。Apple Developer Program 接受个人注册；个人法定姓名会作为供应商显示在 App Store，不能填一个品牌名来代替。
  - q: 苹果开发者账号一年多少钱，为什么有 688 元和 99 美元两种说法？
    a: Apple 官网通用年费为 99 美元，并说明会按地区显示当地货币价格；中国大陆的 App 注册说明列示每年 688 元。以官网当前说明和你的购买页面为准。
  - q: 苹果开发者账号审核需要多久？
    a: 本文核对的官方注册文档没有承诺统一审核完成时间。官方写的是购买后 24 小时内未收到会员资格确认，可联系支持并提供注册 ID，这不代表所有申请都能在 24 小时内通过。
  - q: 个人账号以后能改成组织账号吗？
    a: Apple 的注册帮助说明，可以联系开发者支持申请转换。组织仍需满足法人实体等注册要求，不能只把个人姓名改成公司名。
  - q: 只是想先在自己的手机上试 App，也要付费吗？
    a: Apple 说明，通过 Xcode 在个人设备上安装 App 不要求先加入付费计划。Xcode 是 Apple 的开发工具；本文针对准备分发、上架 App 的注册需求。
aiRun: true
stuckNext: 会员资格确认后，继续整理产品的上架资料；隐私政策要与 App 的实际数据用途一致
next: app-privacy-policy
sample: false
---

> 本文以中国大陆个人通过 Apple Developer App 注册为主。费用、资格和界面按文末 Apple 官方页面核对，实际办理以官网当前说明及你的注册页面为准。

## <span class="role-tag me">🧑 你来做</span> 先判断：现在要不要付年费？

如果你还在描述想法、让 AI 做第一版，建议先新建项目，把产品要解决的问题告诉 Claude / Codex，让它把产品做起来。不要把付款当成开始做 App 的前提。

如果你准备把 iOS App 放到 App Store，就要办理 Apple Developer Program 会员资格。它是 Apple 的开发者会员计划。这里先解决账号和身份，后面的产品资料准备仍要继续做。

付款前还有一个决定：**你是否接受真实姓名出现在 App Store 的供应商信息里？** Apple 的个人注册使用法定姓名，也就是你的真实法律姓名。不能用产品名或网名代替。依据：[Apple Developer：成为会员](https://developer.apple.com/cn/programs/enroll/)。

## 苹果开发者账号个人和公司的区别是什么？

| 你关心的事 | 个人注册 | 组织注册 |
| --- | --- | --- |
| 商店中的身份 | 个人法定姓名 | 法人实体名称 |
| 核实什么 | 本人的姓名和联系方式等资料 | 法人实体、注册人的签约授权等资料 |
| 是否需要组织资料 | 按个人资料申请 | 公司通常还需 D-U-N-S 编号、组织域名邮箱和公开可用的网站 |

D-U-N-S 编号是用来识别组织的编号。不要因为自己有产品名，就把自己当成组织注册。Apple 对组织有法人实体要求；具体以官方验证结果为准。[成为会员页面](https://developer.apple.com/cn/programs/enroll/)列出了两类身份所需资料。

## 苹果开发者账号是每年 688 元，还是只交一次？

**这是年费，不是一次购买永久使用。**

| 官方页面 | 页面列示的费用口径 |
| --- | --- |
| Apple Developer Program 成为会员页面 | 每年 99 美元，价格因区域而异，注册时显示当地货币 |
| 中国大陆 Apple Developer App 注册说明 | 每年 688 元，以年度自动续订方式购买 |

不要把两种币种相加，也不要自己按汇率推算结账金额。中国大陆走 App 注册时，先看清页面的年费和自动续订说明，再确认购买。官方说明中，这类订阅会持续按年续订，直到取消。来源：[App 注册与续订说明](https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app/)。

## 苹果个人开发者账号申请流程怎么走？

下面按 iPhone 或 iPad 上的官方 App 路径操作。具体按钮以当前界面为准。

1. **准备账户和设备。** Apple 账户要开启双重认证，资料保持有效；设备启用锁屏密码、触控 ID 或面容 ID，登录 iCloud，并安装最新 Apple Developer App。整个注册过程使用同一台设备。
2. **进入注册入口。** 打开 App 的“账户”，登录后进入“现在注册”，阅读计划要求。
3. **填写本人资料。** 按提示填写姓名、身份证号和电话，拍摄清晰自拍照验证身份；后续页面要求用英文字母填写姓名和地址时，按提示输入，并选择“个人”。
4. **阅读协议并购买。** 检查订阅详情、费用及续订方式，由你自己接受协议和付款。
5. **查看确认。** 回到开发者账户检查注册状态，并查看会员资格确认邮件。

操作依据为 [Apple Developer App 注册说明](https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app/)及[计划注册中的确认说明](https://developer.apple.com/cn/help/account/membership/program-enrollment/)。AI 可以解释页面，但真实资料应直接填进 Apple 页面。

## 苹果开发者账号付款失败，先查哪一步？

建议先记下：从 App 还是网页购买、报错原文、有没有收据或订单回执。不要只给 AI 一句“付不了钱”，也不要在原因不明时反复确认购买。

| 现象或入口 | 先核对什么 | 接下来怎么做 |
| --- | --- | --- |
| App 内打算用 Apple 账户余额支付 | 官方明确不接受用 Apple 账户余额支付此会员费 | 查看购买页面可用的付款方式，不要继续充值余额尝试 |
| 网页以个人身份用信用卡购买 | Apple 要求使用本人的信用卡 | 核对持卡人；不要借用他人的卡来完成注册 |
| 已有订单回执，但会员没确认 | 回执和会员确认需要分别检查 | 用注册时的 Apple 账户登录开发者网站查看状态 |
| 报错不属于上述情况 | 单凭“付款失败”无法确定原因 | 把去掉个人信息的报错交给 AI 查官方说明，仍不明确就联系 Apple 开发者支持 |

前一项依据 [App 购买说明](https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app/)，网页付款及确认要求依据[计划注册说明](https://developer.apple.com/cn/help/account/membership/program-enrollment/)。这里不保证换一种付款方式就能成功。

## 苹果开发者账号审核需要多久，什么情况该联系支持？

不要把“填完了”“扣款了”“收到订单邮件”都理解为账号已经开通。

Apple 官方没有在本文所列注册页面承诺统一的审核完成时间。它明确给出的处理节点是：**购买后 24 小时内没有收到会员资格确认，就联系 Apple Developer Support，并注明注册 ID。** 这是求助节点，不是审核时限承诺。依据：[计划注册：确认](https://developer.apple.com/cn/help/account/membership/program-enrollment/)。

可以让 AI 帮你整理问题描述：使用哪个注册入口、何时购买、当前状态和报错是什么。注册 ID 由你自己填入官方支持表单；需要补充身份资料时，也直接通过 Apple 官方流程提交。

会员资格确认以后，建议接着整理产品资料。涉及隐私政策的部分，可以按 [App 隐私政策怎么写](/articles/app-privacy-policy/)让 AI 检查实际数据用途，再由你核对内容。
