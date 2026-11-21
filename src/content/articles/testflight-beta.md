---
title: TestFlight 怎么用：把 AI 做好的 iOS App 发给朋友测试
description: 给普通朋友安装测试版，通常走 TestFlight 外部测试。让 AI 准备构建和测试说明，你在 App Store Connect 建组、提交测试审核并邀请朋友；本文说明安装方法、外部测试入口和版本状态排查。
intent: 正式上架前想先给朋友装上测试
keyword: TestFlight 怎么用
covers:
  - iOS App 内测分发
  - TestFlight 外部测试审核
  - testflight是干什么的
  - TestFlight怎么安装
  - testflight怎么发布
  - testflight 怎么没有外部测试
stage: review
kind: question
platforms: [app]
topics: []
date: 2026-11-21
reviewed: 2026-11-21
answer: 正式上架前给普通朋友试用，通常选 TestFlight 外部测试。让 Claude / Codex 准备安装包和测试说明，你在 App Store Connect 上传构建、先建内部组再建外部组，提交首个构建的测试审核。通过并完成分发后，朋友用邮件邀请或公开链接，在 TestFlight 里安装。每个构建从上传起最多测试 90 天；测试审核通过不等于 App Store 正式上架。
steps:
  - who: me
    text: 确认开发者会员和后台权限，把普通朋友安排为外部测试者
  - who: ai
    text: 检查现有项目，准备可用于外部测试的构建、测试说明和上传步骤
  - who: me
    text: 上传构建，在 TestFlight 先建内部组，再建外部组并添加构建
  - who: me
    text: 填写测试资料并提交测试审核，通过后完成分发和邀请
  - who: check
    text: 请朋友从邀请入口实际安装，走完核心功能并反馈问题
handoff:
  prepare:
    - 现有项目文件夹、App 用途，以及希望朋友完成的核心操作
    - 当前版本和构建版本；构建版本用于区分实际上传的安装包
    - App Store Connect 的构建状态、测试组截图和账号角色，遮住私人信息
    - 朋友使用的设备和系统、这轮要验证的功能、已知问题
  prompts:
    - title: 准备给朋友测试的版本
      text: |-
        我的 iOS App 用来 [用途]，现有项目在 [路径]，现在想正式上架前给朋友测试。
        请先只读检查项目，不读取密钥，不上传、不提交审核、不发送邀请。
        根据 Apple 当前官方文档，判断项目还缺哪些打包条件，列出我需要在后台完成的操作。
        我要做外部测试，请检查是否误选了 TestFlight Internal Only，并解释如何准备合适的构建。
        请起草测试版简介、测试重点和操作步骤，内容只能来自现有功能；不确定的先问我。
        我确认方案后再修改本地项目，并分别报告本地检查结果和仍需真机验证的事项。
    - title: 根据后台状态排查安装失败
      text: |-
        当前构建是 [版本与构建版本]，后台状态为 [完整状态]，测试组为 [组名]。
        朋友的设备和系统是 [设备与系统]，从 [邮件或公开链接] 进入，看到 [原文或截图]。
        请对照 Apple 官方帮助，区分审核未完成、未分发、构建不适用、邀请条件和过期问题。
        不要猜原因，不要直接重打包；给出当前证据支持的下一步，以及我操作后应看到的结果。
humanOnly:
  - text: 登录自己的开发者账号，确认会员、角色和 App 信息
  - text: 核实测试说明与真实功能一致，在后台上传、填写资料和提交审核
  - text: 决定邀请谁，选择邮件或公开链接，并完成分发
  - text: 请朋友实际安装并反馈；用真实测试结果决定是否准备正式上架
verify:
  - 后台测试组包含这次要测的构建，手机显示的版本也一致
  - 普通朋友能从邀请入口接受邀请并安装，不依赖你的后台账号
  - 从首次打开开始完成核心任务，而不只是看到启动画面
  - 记录出问题时的操作、设备、系统和截图，再交给 AI 排查
  - 分别确认上传成功、测试审核通过、朋友安装成功，不把其中一步当成全部完成
troubleshoot:
  - symptom: 后台找不到外部测试组入口
    cause: 先核对是否已创建内部测试组，以及当前账号角色是否支持外部测试管理
    say: 请对照 [后台截图与账号角色] 和 Apple 外部测试帮助，列出缺少的前置步骤，不要让我随意提升他人权限。
  - symptom: 内部能测，外部组却选不到这个包
    cause: 可能上传成了 TestFlight Internal Only，或构建状态尚不适合外部测试
    say: 请核对 [构建标记与状态]，先确认原因；若确为仅内部测试包，再给我重新准备构建的方案。
  - symptom: 已通过测试审核，朋友还是装不到
    cause: 需要继续检查是否完成分发、组内是否有对应构建，以及设备是否符合邀请条件
    say: 请按 [构建状态、测试组、邀请页面] 检查分发情况，再核对朋友设备，不要把审核通过当成安装成功。
boundaries:
  - 不把 Apple 账号密码、签名私钥或真实用户数据贴给 AI
  - 不为了给朋友试用而随意授予后台管理权限
  - 不让 AI 编造测试说明、隐藏实际功能或规避审核
  - 不让 AI 未经确认上传、提交审核或发送邀请
aiRun: true
sources:
  - title: Apple：Programs overview
    url: https://developer.apple.com/help/account/membership/programs-overview/
  - title: Apple：TestFlight
    url: https://developer.apple.com/testflight/
  - title: Apple：TestFlight overview
    url: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
  - title: Apple：Add internal testers
    url: https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/
  - title: Apple：Invite external testers
    url: https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers
  - title: Apple：App build statuses
    url: https://developer.apple.com/help/app-store-connect/reference/app-uploads/app-build-statuses/
  - title: Apple：Testing Apps with TestFlight
    url: https://testflight.apple.com/
faq:
  - q: testflight是干什么的？安装它就能看到我的 App 吗？
    a: 它用于安装和反馈测试版 App。朋友还要接受你的邮件或公开链接邀请，才能访问你向其提供的构建。
  - q: 给朋友测试，需要先正式上架吗？
    a: 不需要先正式发布到 App Store。TestFlight 用于发布前测试，但首个外部测试构建需要测试审核。
  - q: TestFlight 是免费的吗？
    a: 测试者安装的 TestFlight App 免费。作为开发者分发测试版，TestFlight 和 App Store Connect 属于 Apple Developer Program 提供的会员资源，不能把测试者免费安装理解为无需开发者会员。
  - q: 外部测试每次上传都必须完整审核吗？
    a: 首次提交的构建需要完整审核，同一版本的后续构建可能不需要完整审核。以当前构建状态为准，不要承诺每次都免审。
  - q: 测试版到期后，重新点邀请链接能续期吗？
    a: 每个构建从上传起最多可测试 90 天，到期后不能再打开该测试构建。需要提供仍可测试的构建，重新打开旧邀请不会重置旧包的期限。
stuckNext: 测试后准备正式提交；如果收到拒审消息，先看懂原因再修改
next: app-store-rejected
sample: false
---

> 本文适用于已经用 AI 做出 iOS App、准备给朋友装机测试的人。规则和按钮以 Apple 当前官方文档、App Store Connect 的实际状态为准；下文的测试安排是执行建议，不承诺审核时长。

## <span class="role-tag me">🧑 你来做</span> 先判断：给朋友测试，选内部还是外部？

**普通朋友选外部测试。** Apple 所说的“内部”，指有相应内容访问权限的 App Store Connect 用户，并不是指你熟悉的人。App Store Connect 就是管理 App 资料、构建和审核的后台。

| 对象 | 选择 | 你要注意什么 |
| --- | --- | --- |
| 已有后台权限的团队成员 | 内部测试 | 从符合条件的后台用户中选择测试者 |
| 只想帮你试用的朋友 | 外部测试 | 使用邮件邀请或公开链接，并处理测试审核 |

内部测试的用户条件见 [Apple：Add internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)。建议不要为了省操作，给普通朋友开后台管理权限。

还没准备开发者账号时，先确认会员条件。Apple 将 TestFlight 和 App Store Connect 列为开发者计划会员资源；在自己的设备上开发测试，与通过 TestFlight 分发是不同安排。[来源：Apple：Programs overview](https://developer.apple.com/help/account/membership/programs-overview/)

## TestFlight 怎么发布，AI 先帮我准备什么？

不用另建一套 App。在现有项目里告诉 Claude / Codex：“这版要给朋友做外部测试”，让它检查项目、准备构建和测试说明。**构建就是这次准备上传的具体安装包。** 签名和打包细节交给 AI 梳理，你负责确认账号和后台操作。

建议先写清这轮到底测什么。例如，一个记事 App 可以让朋友“新建笔记、退出后重新打开、检查内容是否还在”。这是测试任务示例，要换成你 App 真实有的功能，不要只写“帮忙看看”。

Apple 要求外部测试提供测试版简介和测试审核信息，还需要反馈邮箱。让 AI 起草，你逐项核对后再填写。[来源：Apple：TestFlight](https://developer.apple.com/testflight/)

接着按后台流程操作：

1. 上传构建，在 App 的 **TestFlight** 页查看。测试信息中写清要试的功能；涉及加密合规资料时，按实际项目和后台要求处理，不让 AI 随意代选。
2. 在 **Internal Testing** 旁点加号建立内部测试组。Apple 要求先有内部组，才能创建外部组。
3. 在 **External Testing** 旁点加号，建立外部组。进入组后点 **Add Builds** 添加构建，在 **What to Test** 填写测试重点。
4. 按构建状态选择 **Submit Review** 或 **Start Testing**。如果没选自动通知测试者，获批后还要手动分发。

[来源：Apple：TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)、[Apple：Add internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)、[Apple：Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers)

## TestFlight 外部测试审核通过后，怎么邀请朋友？

首个提交的构建需要完整审核；同一版本的后续构建可能不需要完整审核。不要按网上别人等待的时间，承诺朋友某天一定能装。[来源：Apple：Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers)

面向已经确定的朋友，建议用邮件邀请。希望通过链接招募测试者时，可以用公开链接；Apple 还支持设置设备和系统条件。先确认你想邀请的人的设备符合条件。[来源：Apple：TestFlight](https://developer.apple.com/testflight/)

审核通过后，请实际确认测试组和邀请状态，再让朋友安装。收到拒审则保存原文，不要用猜测改包；先按下面的状态表找到所处环节。

## TestFlight 怎么安装？可以发给朋友什么说明？

可以把下面的安装步骤连同邀请交给朋友：

1. 在测试用的 iPhone 上，从 App Store 安装 Apple 的 TestFlight。
2. 在手机上打开邀请邮件，点 **View in TestFlight**；或者打开收到的公开邀请链接。
3. 点 **Accept** 接受邀请，再点 **Install** 安装测试 App。

有与设备兼容的构建时才会显示安装按钮；若邀请设置了设备或系统条件，在邀请中的 **Learn More** 查看具体要求。[来源：Apple：Testing Apps with TestFlight](https://testflight.apple.com/)

再附上你自己的测试任务：“请从 [入口] 完成 [操作]，预期看到 [结果]；遇到问题时把操作过程和截图发给我。”你要验收的是朋友真正完成了任务，而不是只收到一句“安装好了”。

## TestFlight 怎么没有外部测试，或者外部组里没有包？

先把“找不到入口”和“找不到构建”分开。入口问题先核对内部组是否已创建；外部测试管理要求账号角色为 Account Holder、Admin 或 App Manager。构建问题则检查是否带有 **TestFlight Internal Only** 标记：这种包只能加入内部测试组，不能直接用于外部测试。[来源：Apple：Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers)

其余情况照着构建状态排查：

| 后台状态 | 表示什么 | 下一步 |
| --- | --- | --- |
| Missing Compliance | 缺少出口合规资料 | 让 AI 解释要求，你根据项目实际情况补充 |
| Ready to Submit | 可以提交测试审核 | 给外部朋友测试时，继续提交测试审核 |
| Waiting for Review / In Beta Review | 等待或正在测试审核 | 查看状态和消息，尚未到外部测试开始环节 |
| Ready to Test | 可测试，但还没有添加测试者；也可能选择了手动通知 | 核对测试者和通知、分发操作 |
| Expired | 构建已超过测试有效期 | 准备新的可测试构建 |
| Rejected | 构建被测试审核拒绝 | 阅读反馈，修复问题后上传新构建 |

[来源：Apple：App build statuses](https://developer.apple.com/help/app-store-connect/reference/app-uploads/app-build-statuses/)

把状态原文、构建版本和截图交给 AI，让它按证据排查。不要一看到装不了，就删项目或重新申请账号。

## 朋友能装上了，就算 App 上架了吗？

还不算。TestFlight 是测试分发；正式发布时，还要在 App Store Connect 选择准备发布的构建并提交 App Store 审核。[来源：Apple：TestFlight](https://developer.apple.com/testflight/)

每个测试构建从上传起最多可用 **90 天**，测试期结束就不能再打开该构建。这不是永久交付方式。[来源：Apple：Testing Apps with TestFlight](https://testflight.apple.com/)

建议先把朋友反馈交给 AI，修复后用对应版本复测，再准备正式提交。如果在测试审核或正式审核收到拒审消息，继续看 [苹果审核被拒怎么办：让 AI 看懂拒审理由，改完再决定怎么提交](/articles/app-store-rejected/)。读懂反馈的思路可以复用，后台操作要按本次审核类型和状态处理。
