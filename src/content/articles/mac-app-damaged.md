---
title: mac软件提示已损坏：自己做的应用怎么修复签名和公证
description: 别人打开你做的 Mac 软件，提示已损坏或无法验证开发者，先保留完整弹窗，再让 AI 检查实际下载文件、签名和公证结果。按站外分发流程修复后，换一台 Mac 重新下载安装验收，不靠关闭安全防护解决。
intent: 别人打开我做的 Mac 软件提示已损坏或无法验证开发者
keyword: mac软件提示已损坏
covers:
  - Mac 应用公证
  - 无法验证开发者
  - mac已损坏无法打开您应该将它移到废纸篓
  - mac已损坏无法打开您应该推出
  - mac安装软件显示文件已损坏
  - mac软件提示已损坏怎么办
stage: review
kind: question
platforms: [desktop]
topics: [debug]
date: 2026-11-28
reviewed: 2026-11-28
answer: 别人打不开你做的 Mac 软件，先收集完整弹窗、下载地址和系统版本，让 Claude / Codex 检查实际文件。「无法验证开发者」要查签名和公证；「已损坏」还要查文件是否被修改或损坏，不能认定误报。通过网站等渠道分发时，让 AI 修好 Developer ID 签名、完成 Apple 公证并附上票据，你负责账号授权和换电脑验收。保持安全防护开启，下载后的文件能正常安装运行才算交付通过。
steps:
  - who: me
    text: 收集完整弹窗、下载地址、文件名和对方的 macOS 版本
  - who: ai
    text: 检查实际下载文件，分清身份验证、文件损坏和恶意软件告警
  - who: me
    text: 确认站外分发方案，完成所需开发者账号办理与签名授权
  - who: ai
    text: 修复打包与签名流程，提交公证并核验结果，将票据附到交付文件
  - who: check
    text: 在另一台保留安全防护的 Mac 上重新下载，安装并完成核心操作
handoff:
  prepare:
    - 项目文件夹、准备交付的安装文件，以及用户实际使用的下载地址
    - 完整弹窗截图、出现在哪一步、macOS 版本和芯片信息
    - 分发方式是自己的网站、直接发文件，还是 Mac App Store
    - 是否已有 Apple Developer Program 会员及 Developer ID 证书，只说明有无和类型
    - 已有的签名检查结果、公证状态及去除隐私后的错误日志
  prompts:
    - title: 检查用户拿到的 Mac 文件并修复交付流程
      text: |-
        我用 AI 做的 Mac 软件在 [项目路径]，通过 [网站 / 直接发文件] 分发，下载地址是 [地址]，文件名是 [名称]。
        用户在 [macOS 版本、芯片信息] 上执行 [具体操作] 时看到 [完整提示]，截图是 [截图]。
        请先只读检查实际下载文件和现有打包配置，报告检查对象、签名发布者、签名有效性、公证结果，以及还没有证据的部分。
        对照 Apple 当前官方文档，区分无法验证开发者、文件被修改或损坏、恶意软件或授权撤销提示。不要先认定误报。
        请说明需要修复哪里，沿用现有项目完成打包与 Developer ID 签名配置。账号登录、购买会员和签名授权由我完成，不读取或输出密码、私钥和验证码。
        提交 Apple 公证前告诉我具体上传哪个文件，等我确认后再提交；获取最终结果和日志，失败就按日志修复。通过后将公证票据附到适用的交付文件，并验证。
        最后给我最终文件路径、签名核验、公证结果、票据核验和换电脑测试步骤。没有测试环境就写明未测试，不要把提交成功写成用户已能打开。
        不关闭系统防护，不移除下载文件的安全标记，不删除用户数据，不擅自公开发布文件。
humanOnly:
  - text: 确认报错来自哪份文件，决定是否暂停分发问题版本
  - text: 完成所需开发者账号注册、协议确认、付款和系统签名授权
    note: 密码、验证码和证书私钥不贴进对话；只向 AI 说明配置是否完成。
  - text: 确认提交公证的文件没有夹带用户资料，再授权上传到 Apple
  - text: 在目标 Mac 上亲自走完下载、安装和核心功能，确认可以交付
verify:
  - 检查报告对应最终下载文件，写清文件名、版本、下载地址和签名发布者
  - 已取得公证最终结果，并检查日志中的问题，不只有上传成功或提交编号
  - AI 已说明票据附到了哪个文件，以及对应的核验结果
  - 在没有给此应用手动放行过的测试 Mac 上，保留系统安全防护，从实际下载入口重新取得文件
  - 按交付说明安装并打开，记录完整提示，分清正常的首次打开确认与安全拦截
  - 用测试数据完成核心操作，退出重开；若宣称支持离线使用，再测试离线安装或启动
troubleshoot:
  - symptom: AI 说已签名，仍然无法验证开发者
    cause: 需要确认使用的是适合站外分发的证书，以及实际下载文件是否已完成公证
    say: 请核对证书类型、签名有效性和公证最终结果，逐项指明检查的是哪份文件。
  - symptom: 改过应用里的文件后，提示已损坏
    cause: 签名后修改应用内容可能导致签名验证失败
    say: 请对比修改前后的文件，定位签名失败处，修复构建顺序后重新签名、公证和验收。
  - symptom: 公证失败，不知道日志是什么意思
    cause: 可能涉及无效签名、证书类型或未满足公证要求，应按实际日志判断
    say: 请把日志中的问题翻译成我能理解的原因，列出受影响文件与修复动作，再提交检查。
  - symptom: 联网能安装，离线被拦截
    cause: 未附上公证票据时，门禁可能无法在离线环境确认公证状态
    say: 请检查最终文件的公证票据，再用支持离线的功能复测，不要关闭防护。
boundaries:
  - 不让 AI 关闭门禁或其他安全防护，也不把移除安全标记、手动放行当作正式修复
  - 不把账号密码、证书私钥、验证码或用户资料交进对话、安装包或公开仓库
  - 不让 AI 借用他人证书、擅自撤销证书或覆盖唯一的问题样本
  - 不把公证通过说成 App Store 审核通过，也不承诺所有电脑都不会再出现提示
aiRun: true
sources:
  - title: Apple：在 Mac 上安全地打开 App
    url: https://support.apple.com/zh-cn/102445
  - title: Apple：Signing your apps for Gatekeeper
    url: https://developer.apple.com/developer-id/
  - title: Apple：Developer ID certificates
    url: https://developer.apple.com/help/account/certificates/create-developer-id-certificates
  - title: Apple：Notarizing macOS software before distribution
    url: https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
  - title: Apple：Resolving common notarization issues
    url: https://developer.apple.com/documentation/security/resolving-common-notarization-issues
  - title: Apple：Packaging Mac software for distribution
    url: https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution
faq:
  - q: mac安装软件显示文件已损坏，是不是重新下载就行？
    a: 可以重新取得文件后对比，但不能保证解决。若发布的文件本身有损坏或签名问题，需要制作者修复交付文件，再让用户测试。
  - q: 提示「已损坏，您应该推出」，和「移到废纸篓」怎么处理？
    a: 不要只根据末尾按钮判断原因。保留完整提示及被点开的文件，让 AI 检查该分发文件与其中的应用，再决定修复哪一层。
  - q: 自己生成的签名能代替 Developer ID 吗？
    a: 不能把自签证书当作新应用站外分发的公证方案。Apple 要求使用有效的 Developer ID 证书，自签证书不符合这项要求。
  - q: Mac 应用公证通过，就等于上架 App Store 了吗？
    a: 不是。公证是自动检查恶意内容和签名问题，不是 App Store 审核；通过 Mac App Store 分发的应用也不需要另做这项公证。
  - q: 公证通过后，为什么第一次打开还会询问？
    a: 来自被认可开发者的站外下载应用，首次打开时仍可能出现确认提示。应区分正常确认与「已损坏」「无法验证开发者」等拦截。
stuckNext: 修好签名和公证后，还要确认最终安装包在目标电脑上能完成核心功能
next: desktop-app-packaging
sample: false
---

> 本文处理自己用 AI 做的 Mac 软件发给别人后打不开的问题，以 Apple 当前文档、完整弹窗和实际文件检查结果为准。重点是修复正式交付文件，保持系统安全防护开启。

## <span class="role-tag me">🧑 你来做</span> 先判断：你是发安装文件，还是走 Mac App Store？

如果你把软件放在自己的网站，或者直接把安装文件发给用户，就按下文检查站外分发流程。不要只告诉 AI「让这个弹窗消失」，要告诉它：**让用户下载后能按正常流程安装和使用。**

如果应用通过 Mac App Store 分发，Apple 说明不需要另做站外公证，因为商店提交过程已包含相应的安全检查。遇到问题时先让 AI 核实用户拿到的是商店版本还是另一份文件，再按对应渠道排查。[Apple：公证适用范围](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)

还没有做出能交给别人安装的文件，先看 [软件怎么打包成安装包：让 AI 把桌面工具做成 exe 或 dmg](/articles/desktop-app-packaging/)。这篇继续处理已经拿到安装文件、却被 Mac 拦住的情况。

## 「已损坏」和「无法验证开发者」是一回事吗？

不是。**门禁（Gatekeeper）是 macOS 用来检查软件是否可信的安全功能。**先让对方提供完整截图、下载地址、文件名和系统版本，按提示区分：

| 完整提示的重点 | Apple 的解释 | 接下来怎么做 |
| --- | --- | --- |
| 无法验证开发者，或无法检查是否包含恶意软件 | 系统未能完成开发者身份或恶意软件检查 | 让 AI 核查实际文件的 Developer ID 签名和公证状态 |
| 已损坏，无法打开 | 软件可能故障、损坏，或被修改、篡改 | 保留问题文件，检查完整性与签名，不能直接说是误报 |
| 将损坏你的电脑 | 可能检测到恶意内容，或软件授权被撤销 | 建议暂停分发，查清文件和告警来源后再处理 |
| 从互联网下载，询问是否确定打开 | 被认可开发者的站外应用首次打开也会出现确认 | 核对来源与完整提示，不把正常确认当作修复失败 |

这些提示的含义见 [Apple：在 Mac 上安全地打开 App](https://support.apple.com/zh-cn/102445)。建议先保留问题样本，让 AI 在副本上排查，避免重新打包后找不到原来的错误。

## 为什么自己电脑能用，别人下载就打不开？

开发电脑上打开成功，不能代替用户拿到安装文件后的测试。Apple 建议尽可能换一台 Mac，按实际安装包测试，避免开发环境的数据影响结果。[Apple：分发文件测试](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)

把现有项目交给 Claude / Codex，补充一句：“请检查下载地址上的文件，不要只检查项目里的应用。”让它对比准备发布的文件与用户实际下载的文件，并指出检查对象。

**签名后又改应用内容，是值得核查的一项。**Apple 的故障文档说明，未签名或签名后修改应用包，会导致签名无效并使公证失败。如果 AI 打包后又替换了包内文件，应让它检查修改顺序，重新生成符合要求的交付文件。[Apple：签名无效的排查](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)

## Mac 应用公证是什么？开发者账号该准备哪种？

可以把这几个词分开理解：

- **Developer ID 签名**：用 Apple 提供的开发者证书标识发布者，并帮助检查签名后的文件是否被改动。
- **公证**：把软件提交给 Apple 的自动系统，检查恶意内容和签名问题；它不是 App Store 审核。
- **公证票据**：公证通过后生成的记录。把票据附到交付文件，称为“装订”，用于让系统确认该软件经过公证。

Apple 的 [Developer ID 证书说明](https://developer.apple.com/help/account/certificates/create-developer-id-certificates)区分了应用证书和安装器证书：应用使用 Developer ID Application；如果交付的是 `.pkg` 安装器，其签名使用 Developer ID Installer。让 AI 根据现有打包形式配置，你不必自己猜证书类型。

Apple 的[签名指南](https://developer.apple.com/developer-id/)要求生成 Developer ID 证书的开发者具备 Apple Developer Program 的相应账号资格。个人还没有办理时，接着看 [苹果个人开发者注册：怎么申请、每年多少钱、付款失败怎么查](/articles/apple-developer-account/)。已经有会员资格的，先核对现有账号和证书，不必因为这次报错另注册一个账号。

## 交给 AI 修复时，要拿到什么结果？

沿用已有项目，把任务交给 Claude / Codex：检查打包流程，修复签名，提交公证，取得结果，附上票据，再交付测试。不要为了处理弹窗重做整个软件。

要求 AI 交出这些证据：

| 要交出的结果 | 你要看清什么 |
| --- | --- |
| 最终安装文件 | 文件路径、版本和准备提供给用户的下载入口 |
| 签名检查 | 检查了哪个文件、发布者是谁、签名是否有效 |
| 公证结果 | Apple 返回的最终结果，以及日志中的具体问题 |
| 票据检查 | 票据附到了哪个交付文件，是否验证成功 |
| 实测记录 | 哪台 Mac、怎样安装、出现什么提示、功能是否可用 |

公证失败时，让 AI 读取日志，解释原因并修复后再提交。Apple 将无效签名、证书类型不对等列为常见问题，不能靠反复上传代替修复。[Apple：常见公证问题](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)

公证通过后也要检查票据。Apple 提醒，没有把票据附到分发文件时，用户离线安装或运行可能仍被门禁拦截。具体附到应用、磁盘映像还是安装器，由 AI 按交付形式处理。[Apple：打包、公证与票据](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)

## mac软件提示已损坏，怎样才算真的修好了？

建议用没有给该应用手动放行过的另一台 Mac，保留系统安全防护，从用户实际使用的入口重新下载。按交付说明安装，完成核心操作，再退出重开。

例如你做的是图片整理工具，就用测试图片走完导入、整理、导出，并打开结果检查。这个动作验证功能；签名检查和公证结果验证的是其他环节，分别记录才知道还缺哪一步。

只出现正常的首次打开确认，不必要求所有提示都消失。仍被拦截时，把完整原文交回 AI，继续检查当前文件。**上传公证成功、取得公证通过结果、用户安装使用成功，要分别确认。**
