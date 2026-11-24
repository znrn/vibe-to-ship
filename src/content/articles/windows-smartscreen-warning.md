---
title: 自己开发的 Windows 软件被 SmartScreen 拦截怎么办：先查提示，再处理签名和误报
description: 别人打开你做的 Windows 软件时出现「已保护你的电脑」，先分清信誉不足和恶意软件检测。让 Claude / Codex 检查实际下载文件与签名，确有错误检测再走微软复核；签名成功、提交成功都不代表警告已经消失。
intent: 别人运行我做的 Windows 软件时弹出「已保护你的电脑」
keyword: 自己开发的 Windows 软件被 SmartScreen 拦截怎么办
covers:
  - SmartScreen 拦截软件
  - 软件被杀毒软件误报
  - windows已保护你的电脑阻止了无法识别的应用启动
stage: review
kind: question
platforms: [desktop]
topics: [debug]
date: 2026-11-24
reviewed: 2026-11-24
answer: 先请对方保留完整提示和下载地址，再让 Claude / Codex 检查实际安装文件、发布者和签名。SmartScreen 的「无法识别」可能来自信誉不足，不能仅凭弹窗认定软件有毒，也不能认定是误报。准备公开分发时处理可信签名；若有具体的错误检测，再提交对应产品复核。签名或提交成功都不等于警告消失，最后要按用户的下载路径重新验收，全程保持安全防护开启。
steps:
  - who: me
    text: 收集完整提示、下载地址、文件名和对方的 Windows 版本
  - who: ai
    text: 检查被拦截的实际文件，区分信誉警告、检测告警和其他拦截
  - who: ai
    text: 核验签名与发布者，按现有项目整理修复方案或误报说明
  - who: me
    text: 完成需要本人办理的签名身份验证，或提交有依据的错误检测复核
  - who: check
    text: 从原下载入口重新取得文件，在保留安全防护的 Windows 电脑上验收
handoff:
  prepare:
    - 项目文件夹、准备交付的安装文件，以及用户实际下载的地址
    - 完整弹窗截图、出现在哪一步、Windows 版本和安全软件名称
    - 若有检测告警，提供检测名称、受影响文件及去除隐私后的记录
    - 是否已有签名方案，只说明服务或证书名称，不提供私钥和密码
  prompts:
    - title: 先确定是谁拦截，再检查交付文件
      text: |-
        我用 AI 做的 Windows 软件在 [项目路径]，发给用户的下载地址是 [地址]，文件是 [文件名]。
        对方使用 [Windows 版本]，在 [下载 / 安装 / 启动] 时看到 [完整提示]，截图是 [截图]。
        请先只读检查，区分 SmartScreen 信誉警告、杀毒检测或其他拦截。证据不足时列出还缺什么，不要直接认定误报。
        检查用户下载的文件是否与准备交付的文件一致，报告签名是否存在、是否有效、发布者是谁，以及实际检查了哪些文件。
        根据当前微软官方资料，给出适合这个项目的修复步骤；需要付费、身份验证或签名授权的地方交给我。
        不要关闭防护、添加排除项、改用户电脑策略或公开上传文件。没有 Windows 检查环境就明确告诉我，不要把未执行的检查写成通过。
    - title: 整理有依据的误报复核材料
      text: |-
        被检测的文件是 [文件路径]，安全产品是 [名称]，检测名称是 [原文]。
        软件用途是 [用途]，复现过程是 [步骤]，我们已经核验的结果是 [结果]。
        请整理一份英文说明，写清用途、文件来源、受影响环境、检测结果和申请复核的理由。
        区分已确认事实与尚未排除的问题，列出需要提交的具体文件，不要编造测试结果或安全承诺。
        先把材料交给我检查，不代替我上传。
humanOnly:
  - text: 确认用户看到的原始提示和文件来源，决定是否暂停分发当前版本
  - text: 完成签名服务要求的本人身份验证、付款与授权
    note: 选择前核对服务是否接受你的真实身份和所在地，不借用他人资料。
  - text: 检查申诉文件没有夹带用户数据，再登录官方入口提交并保存记录
  - text: 亲自走一遍下载、安装和核心功能，记录仍然出现的提示
verify:
  - 检查的是用户实际取得的文件，文件名、版本和下载地址已记录
  - 签名报告说明检查对象、发布者和有效性，不只有「命令执行成功」
  - 使用保留安全防护的 Windows 测试环境，从用户使用的入口重新下载
  - 警告仍在就保存原文，未能正常安装时不记为交付通过
  - 能正常安装后，用测试数据完成核心操作，再退出重开检查结果
  - 把签名核验、官方复核结果和目标电脑实测分别记录
troubleshoot:
  - symptom: AI 说签好了，用户仍看到「已保护你的电脑」
    cause: 签名完成不能单独证明下载文件已获得足够信誉，也要确认检查的是同一个文件
    say: 请核对用户下载文件与签名报告的对象，报告有效性和发布者，再按完整提示判断下一步。
  - symptom: 杀毒软件报出具体检测名称
    cause: 需要检查被检出的文件和行为，不能先把它归为信誉不足或误报
    say: 请根据检测记录检查项目和打包内容；发现真实问题先修复，有依据认为误判再整理复核材料。
  - symptom: 提交复核后仍然被拦截
    cause: 提交回执不是最终判定，也不是目标电脑的验收结果
    say: 请对照提交记录、最终结果和现在的提示，确认是否同一文件、同一安全产品，不要直接宣布解决。
boundaries:
  - 不让 AI 关闭 SmartScreen、杀毒软件或其他系统防护，也不把添加排除项当交付步骤
  - 不把证书私钥、账号密码、验证码或用户私有数据贴进对话
  - 不为让弹窗消失而伪造发布者、借用身份或刷下载
  - 不把「自己写的」或「AI 检查过」当作文件安全的证明
aiRun: true
sources:
  - title: 微软：Microsoft Defender SmartScreen
    url: https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/
  - title: 微软：SmartScreen reputation for Windows app developers
    url: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation
  - title: 微软：Code signing options for Windows app developers
    url: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
  - title: 微软：Submit files for analysis
    url: https://learn.microsoft.com/en-us/defender-xdr/submission-guide
  - title: 微软：Submit a file for malware analysis
    url: https://www.microsoft.com/en-us/wdsi/filesubmission
faq:
  - q: 「无法识别的应用」是不是已经被判定为病毒？
    a: 不能这样判断。SmartScreen 也会对缺少信誉的文件发出警告；应核对完整提示和检测记录，不能只凭这句话判断安全或有害。
  - q: 自己生成一张证书，能解决公开分发的提示吗？
    a: 不要把自签证书当成公开分发的可信签名方案。微软文档说明，自签证书面对 SmartScreen 时仍会出现警告。
  - q: 买 EV 代码签名证书就一定不弹窗吗？
    a: 不一定。微软说明，EV 证书已不再提供即时 SmartScreen 信誉，不能为了保证消除弹窗而购买。
  - q: 要积累多少下载、等多久才不再警告？
    a: 微软没有给出精确门槛。不要向用户承诺固定下载次数或消失日期，应以实际下载文件的测试结果为准。
  - q: 微软复核结果不符合预期，还能继续说明吗？
    a: 可以。等提交得到最终判定后，按微软指南使用结果页提供的开发者联系表单，补充具体证据。
stuckNext: 拦截原因处理后，还要验证重新打包的文件能在目标电脑上安装并完成核心操作
next: desktop-app-packaging
sample: false
---

> 本文适用于把自己做的 Windows 软件交给别人安装时遇到的拦截。判断以完整提示、实际文件和微软当前文档为准；不要把所有安全弹窗都当成同一个问题。

## <span class="role-tag me">🧑 你来做</span> 先判断：「已保护你的电脑」到底在提醒什么？

先让对方把弹窗截完整，连同下载地址一起给你。不要只收一句「软件打不开」。

**SmartScreen 是 Windows 用来检查下载文件等内容是否可信的安全功能。**它既会检查已知风险，也会对缺少信誉的文件提示谨慎。因此，出现警告既不能直接证明有病毒，也不能证明只是误报。[微软：SmartScreen 说明](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/)

按看到的证据决定下一步：

| 看到什么 | 先交给 AI 做什么 |
| --- | --- |
| 提示「无法识别的应用」，没有其他检测信息 | 检查实际下载文件、签名和发布者，判断是否涉及信誉不足 |
| 安全软件给出具体检测名称和受影响文件 | 按检测记录检查文件与行为，不预设是误报 |
| 提示中写的是其他安全功能或管理员限制 | 保留原文，查对应功能；公司设备由其管理员核查 |

建议排查期间先暂停继续分发被报告的版本。保留原文件和记录，让 AI 对照检查，不要反复打包覆盖掉出问题的样本。

## 为什么我自己能运行，别人下载就被 SmartScreen 拦截？

自己的开发环境能运行，只能说明在那里跑通了。接下来要查的是**用户拿到的那个文件**。

微软说明，SmartScreen 会参考发布者信誉和文件信誉。后者针对具体文件，可以把文件哈希理解成用于辨认文件的指纹。新文件即使有签名，也可能因信誉不足出现警告。[微软：SmartScreen 信誉机制](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

把项目和问题交给 Claude / Codex 时，要求它给出可核对的结果：检查了哪个安装文件、是否与下载版本一致、签名是否有效、还有哪些没有检查。让它据此排查，别直接要求「把弹窗去掉」。

## 没签名或签名不对，应该怎么处理？

代码签名用来标识软件发布者。准备在自己的网站等渠道公开提供下载时，让 AI 先检查现有打包流程，再整理可信签名方案。你负责完成所需身份验证和授权，AI 负责配置与核验。

**不要把购买证书当作立即消除警告的保证。**微软的签名选项文档明确说明，可信签名后的新文件仍可能出现信誉警告；EV 证书也不再提供即时免提示效果。[微软：代码签名选项](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)

如果愿意改用 Microsoft Store 分发，可以让 AI 先评估当前项目是否适合：MSIX 包通过商店认证后由微软重新签名；通过商店提交传统 MSI / EXE 安装程序时，仍由发布者负责签名。不要把这两条路线混在一起，也不要把原安装文件直接换个后缀当成完成转换。[微软：商店包与安装程序的签名要求](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)

这里先处理交付文件，不必为了弹窗重写整个产品。需要重新生成安装包时，接着看 [软件怎么打包成安装包：让 AI 把桌面工具做成 exe 或 dmg](/articles/desktop-app-packaging/)。

## 软件疑似被杀毒软件误报，去哪里提交复核？

先检查检测记录对应的文件。AI 查到真实问题，就先修复；有依据认为检测错误，再申请复核。不是微软产品给出的告警，就先让 AI 查对应厂商的官方入口，别把所有问题都提交给微软。

微软的 [文件分析入口](https://www.microsoft.com/en-us/wdsi/filesubmission) 提供 **Software developer（软件开发者）**选项。按实际告警选择安全产品，提交被检测的具体文件，并填写检测名称和用途说明。页面要求补充英文信息，可以让 AI 根据你提供的事实整理。

建议这样准备材料：

- 写清软件要帮用户做什么、文件从哪里获得。
- 附上实际检测名称、出现步骤和受影响环境。
- 只提交需要分析的文件，先检查是否夹带用户资料。
- 保存提交记录，等待最终判定后再决定后续处理。

微软指南区分「已收到」「处理中」「已有最终判定」。拿到提交回执不能写成误报已解除；对最终判定有异议，可用结果页的开发者联系表单继续说明。[微软：文件提交与结果说明](https://learn.microsoft.com/en-us/defender-xdr/submission-guide)

## 提交 SmartScreen 复核，能让新软件立刻获得信誉吗？

**不要把错误警告复核理解成申请信誉认证。**微软的 SmartScreen 总览允许对认为不正确的警告或拦截提交复核，并要求选择对应产品；开发者信誉文档则明确，面向普通消费者设备没有手动提交文件来建立信誉的机制。[错误警告复核说明](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/)、[开发者信誉说明](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

所以，只有「这是刚发布的软件」时，不能承诺提交后就不再提示。先完成文件与签名检查，向试用者如实说明现状；有具体的错误检测依据，再走复核。

## 怎么确认这次真的处理好了？

让 AI 交出最终文件和核验报告，再在保留安全防护的 Windows 测试环境中，从用户使用的下载入口开始验收。

分别记下：下载时有没有提示、安装能否完成、启动有没有新告警、核心操作能否完成。还有警告就记录原文继续排查，不要把手动放行后的启动成功算成问题已解决。

签名有效、官方给出复核结果、用户电脑实测通过，是不同的结果。只报告已经验证的那一项，才能知道下一步究竟该修文件、补材料，还是继续检查目标电脑的提示。
