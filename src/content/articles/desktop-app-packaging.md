---
title: 软件怎么打包成安装包：让 AI 把桌面工具做成 exe 或 dmg
description: 桌面工具在自己电脑上能运行后，先让 AI 确认项目类型，再沿用现有工具生成 Windows 安装包或 Mac 的 dmg。这里讲清 Electron、Tauri、Python 各自怎么交接，以及白屏排查、签名和换电脑安装的验收方法。
intent: 做好了桌面工具，想打包成别人能双击安装的 exe 或 dmg
keyword: 软件怎么打包成安装包
covers:
  - Electron 打包
  - Tauri 打包安装包
  - 打包成 dmg
  - electron打包成安装包
  - electron打包mac应用
  - electron打包后白屏
  - python打包成exe
stage: build
kind: question
platforms: [desktop]
topics: [tools, debug]
date: 2026-11-20
reviewed: 2026-11-20
answer: 先让 Claude / Codex 检查项目，再按目标电脑生成安装包。Electron 可用 Forge，Tauri 有打包工具；Python 可先用 PyInstaller 生成可执行程序，但 exe 不一定是带安装流程的安装包。你负责确定给谁用、准备名称和图标、完成账号认证，并在另一台目标电脑上安装验收。生成文件只代表打包完成，公开分发前还要核查签名；Mac 站外分发要处理签名和公证。
steps:
  - who: me
    text: 确定用户用 Windows 还是 Mac，以及希望直接运行还是安装后使用
  - who: ai
    text: 检查现有项目类型、打包配置和所需构建环境，沿用已有方案
  - who: ai
    text: 生成目标平台的安装文件，说明文件位置、安装方式和签名状态
  - who: me
    text: 完成所需账号认证与签名授权，确认软件名称和发布者信息
  - who: check
    text: 在另一台目标电脑上安装，完成核心操作并退出重开验证
handoff:
  prepare:
    - 项目文件夹位置，以及目前怎样打开这个工具
    - 目标电脑的系统和芯片信息；不知道就提供系统信息截图
    - 软件名称、图标、版本名称和真实发布者信息
    - 希望用户安装后完成的核心操作，以及是否需要联网
    - 是否已有开发者账号或签名证书，只说明有无，不贴密码和私钥
  prompts:
    - title: 检查现有项目并生成安装包
      text: |-
        我的桌面工具在 [项目文件夹路径]，现在通过 [当前启动方式] 能运行。
        我要给使用 [系统及芯片信息] 的人使用，软件叫 [名称]，核心功能是 [用户要完成的操作]。
        请先检查项目属于 Electron、Tauri、Python 还是其他类型，告诉我已有的打包方式和缺少的环境，不要为了打包重写项目。
        我要的是 [Windows 安装程序 / Mac dmg / 可直接运行的程序]。请按当前官方文档配置并执行打包，把相关页面链接留在说明中。
        打包后给出文件的准确路径、适用电脑、安装方式、签名与公证状态，以及哪些步骤没有测试。不要只展示开发预览。
        如需付费、账号认证或授权签名，先说明用途，由我完成。不要上传或公开发布文件。
    - title: 安装后白屏或打不开时继续排查
      text: |-
        安装文件是 [文件名]，目标电脑是 [系统及芯片信息]。
        我通过 [安装和启动步骤] 操作，结果是 [具体现象]，报错截图或已去除隐私的日志是 [内容]。
        请从这个安装后的版本复现，先收集启动日志和页面加载错误，再检查加载地址、资源是否包含、依赖是否齐全。
        给出证据后再改，修改后重新打包并按原步骤复测。不要关闭系统安全防护，不要删除我的用户数据。
humanOnly:
  - text: 决定先支持哪种电脑，以及软件显示的名称和发布者身份
  - text: 完成开发者账号认证、付款和需要本人确认的签名授权
    note: 密码、验证码和证书私钥不贴进对话；让 AI 解释配置用途，你在相应系统中完成授权。
  - text: 在目标电脑上亲自安装，判断核心功能是否达到交付要求
verify:
  - 拿到的是 AI 指明的安装文件，说明中写清适用系统和安装方式
  - 关闭开发预览后，在另一台目标电脑上从安装文件开始测试
  - Windows 从安装后的入口启动；Mac 拖入应用程序文件夹后，从该文件夹启动
  - 完成核心操作，例如导入测试文件、处理并导出，再打开结果检查
  - 退出后重新打开，检查应当保存的设置和记录；使用测试数据验证卸载与重装行为
  - 分开记录打包成功、安装成功、功能通过、签名与公证状态，未测试的项目如实说明
troubleshoot:
  - symptom: Electron 安装后只有空白窗口
    cause: 仅凭白屏不能确定原因，需要检查页面加载失败信息和应用日志
    say: 请复现安装后的白屏，收集加载失败的地址与错误，核对实际加载文件和打包内容，再决定修改哪里。
  - symptom: Python 程序在自己电脑能用，发给别人就打不开
    cause: 需要检查目标系统是否匹配、文件夹包是否发全，以及依赖或数据文件是否遗漏
    say: 请核对这个包的构建系统和对方电脑，检查我发出的文件是否完整；先用文件夹模式排查缺少的文件，再考虑单文件。
  - symptom: Mac 打包任务失败，当前用的是 Windows
    cause: 本文所用 Forge DMG 目标要求 macOS，Tauri DMG 文档也在 Mac 上构建
    say: 请说明当前方案缺少的 Mac 构建环境，给出可以使用的环境选项和费用依据，由我决定后再操作。
  - symptom: 系统提示开发者无法验证或阻止打开
    cause: 需要核对具体提示、签名与公证状态，不能仅凭弹窗认定是误报
    say: 请保留拦截提示，检查最终交付文件的签名状态，Mac 还要检查公证结果；不要通过关闭安全防护来完成验收。
boundaries:
  - 不要让 AI 为了生成安装包擅自重写整个项目或更换技术方案
  - 不要把账号密码、证书私钥或带隐私的完整日志贴进对话
  - 不要通过关闭系统安全防护解决安装问题
  - 不要让 AI 擅自删除用户数据、覆盖旧安装包或公开发布测试文件
  - 不要把自己电脑上打开成功写成所有用户都能安装
aiRun: true
sources:
  - title: Electron：Packaging Your Application
    url: https://github.com/electron/electron/blob/main/docs/tutorial/tutorial-5-packaging.md
  - title: Electron Forge：Squirrel.Windows
    url: https://www.electronforge.io/config/makers/squirrel.windows
  - title: Electron Forge：DMG
    url: https://www.electronforge.io/config/makers/dmg
  - title: Tauri：Windows Installer
    url: https://v2.tauri.app/distribute/windows-installer/
  - title: Tauri：DMG
    url: https://v2.tauri.app/distribute/dmg/
  - title: PyInstaller：What PyInstaller Does and How It Does It
    url: https://pyinstaller.org/en/latest/operating-mode.html
  - title: Electron：webContents
    url: https://www.electronjs.org/docs/latest/api/web-contents
  - title: Electron Forge：Signing a macOS app
    url: https://www.electronforge.io/guides/code-signing/code-signing-macos
faq:
  - q: electron打包成安装包，是把项目文件夹压缩一下吗？
    a: 不是。Forge 会先把应用代码和 Electron 运行程序打包，再由对应的安装包生成工具制作分发文件；让 AI 指明哪个文件才是给用户安装的。
  - q: electron打包mac应用，能在 Windows 上直接做 dmg 吗？
    a: 本文采用的 Electron Forge DMG 工具只支持在 macOS 上生成 dmg。让 AI 先核对构建环境，不要把改文件后缀当作打包。
  - q: Tauri 打包安装包，Windows 应该选 exe 还是 msi？
    a: Tauri 支持用 NSIS 生成 setup.exe，也支持用 WiX 生成 msi。没有指定格式时，让 AI 沿用现有配置并给出可安装结果；其中 msi 需要在 Windows 上构建。
  - q: python打包成exe 后，对方还要安装 Python 吗？
    a: PyInstaller 会把 Python 解释器和识别到的依赖一起打包，用户不用另装 Python。仍要检查额外数据文件是否包含，并在目标电脑测试。
  - q: 有了 dmg，是不是就完成 Mac 应用发布了？
    a: 还没有。dmg 是交付形式，签名和公证是另外的事项；还要验证下载后的文件能正常安装和使用，不能用本机打包成功代替这些结果。
stuckNext: 安装和功能验收通过后，继续核对正式分发所需的代码签名；Mac 站外分发还要检查公证结果
sample: false
---

> 本文处理已经能运行的桌面工具，目标是交付 Windows 安装程序或 Mac 的 dmg。具体格式和构建条件以项目使用的工具及其当前官方文档为准；打包、安装测试和正式分发要分别确认。

## <span class="role-tag me">🧑 你来做</span> 先判断：你要的是安装包，还是双击就能用的程序？

先告诉 AI 用户拿到文件后应该怎么用。例如：“我做了一个图片整理工具，想让 Windows 用户安装后打开，选择文件夹就能整理图片。”比只说“帮我打包”更明确。

**exe 不一定是安装包。** 它可能就是程序本身，也可能是安装程序。Mac 的 dmg 是磁盘映像，可以把它理解成装着应用的交付文件；本文说的安装方式是打开后，把应用拖到“应用程序”文件夹。[Tauri 的 DMG 文档](https://v2.tauri.app/distribute/dmg/)说明了这种操作。

你先决定目标用户用什么电脑。技术类型不用猜，让 AI 查看现有项目后回答。已经做好的工具，优先沿用现有打包配置。

| 现有项目 | 交给 AI 的任务 | 你检查什么 |
| --- | --- | --- |
| Electron | 没有打包方案时，可按官方教程接入 Forge，配置目标格式 | Windows 是否拿到安装程序，Mac 是否拿到 dmg |
| Tauri | 使用项目的 Tauri 打包配置，生成目标系统文件 | 是 Windows 的 setup.exe、msi，还是 Mac 的 dmg |
| Python | 先用 PyInstaller 生成能独立运行的程序，再明确是否还需要安装流程 | 拿到的是完整文件夹包、单文件程序，还是另做的安装包 |

这些格式分别见 [Electron 打包教程](https://github.com/electron/electron/blob/main/docs/tutorial/tutorial-5-packaging.md)、[Tauri Windows 安装包文档](https://v2.tauri.app/distribute/windows-installer/)和 [PyInstaller 打包说明](https://pyinstaller.org/en/latest/operating-mode.html)。

## Electron 打包：为什么 AI 说成功了，却找不到安装包？

让 AI 明确报告它完成到了哪一步。Forge 的打包过程先生成应用文件夹，再用对应工具生成分发文件。只看到应用文件夹，不能据此确认安装包已经做好。

如果目标是 Windows，Forge 的 Squirrel.Windows 会生成作为安装程序的 `Setup.exe`；具体文件名由应用名称决定。如果目标是 Mac，可以配置 DMG 工具，而且这个目标只能在 macOS 上构建。依据分别见 [Squirrel.Windows](https://www.electronforge.io/config/makers/squirrel.windows)和 [Forge DMG](https://www.electronforge.io/config/makers/dmg)。

你不用记命令，直接补充要求：“告诉我最终交付文件的准确位置，并说明用户从双击它到打开软件要做什么。”拿到文件后再照着走，别只看 AI 展示的开发窗口。

## Tauri 打包安装包：我需要准备什么电脑？

Tauri 的 Windows 安装包可以是 `setup.exe` 或 `msi`。官方文档说明，msi 只能在 Windows 上创建；NSIS 的 exe 有跨系统构建路线，但不必因为存在这条路线就先更换你现有的环境。

建议先让 AI 检查当前电脑能否完成所选目标，缺什么再决定怎么补。Mac 的 dmg 按 [Tauri 官方流程](https://v2.tauri.app/distribute/dmg/)在 Mac 上构建。不要先承诺用户某个版本已经可用，等对应电脑验收后再写支持范围。

## Python 打包成 exe，为什么还要带一个文件夹？

PyInstaller 支持文件夹包，也支持单个可执行文件。文件夹模式里的其他文件是程序运行所需的内容，不能只挑出 exe 发给别人。它的产物与构建时的操作系统有关，制作 Windows 程序要在相应系统上运行 PyInstaller。

先让 AI 做文件夹版本并测试，再考虑单文件，这是 [PyInstaller 官方建议](https://pyinstaller.org/en/latest/operating-mode.html)的排查顺序。若你希望有完整安装流程，要另外说清楚；生成可执行文件不等于已经提供安装向导。

## electron打包后白屏，应该把什么交给 AI？

先记录：用的是哪个安装文件，在哪台电脑，安装后从哪里启动，以及空白窗口截图。不要只发“打不开”，也不要直接要求 AI 重写界面。

让 AI 从安装后的版本收集页面加载错误。Electron 的 [webContents 文档](https://www.electronjs.org/docs/latest/api/web-contents)提供加载失败事件，能报告错误和加载地址；文件加载方法也明确要求使用应用内正确的 HTML 路径。

据此可以安排排查：**实际加载的地址是什么，目标文件是否在包里，日志又报了什么。** 这是检查方向，不是看到白屏就能断言原因。修改后必须重新打包，再从安装文件复测。

## 打包成 dmg 后，为什么还要做签名和公证？

签名用于证明应用作者身份并检查内容是否被改动；公证是把应用提交给苹果做自动恶意软件扫描。它们与 dmg 这种文件格式不是一回事。[Electron Forge 的 Mac 签名说明](https://www.electronforge.io/guides/code-signing/code-signing-macos)明确区分了这些环节。

准备向用户直接分发 Mac 应用时，把签名和公证列入交付任务。需要账号时，可以先看 [苹果个人开发者注册](/articles/apple-developer-account/)。具体证书配置交给 AI 根据项目检查，账号认证和授权由你完成。

遇到安全提示，把原文交给 AI 核查最终文件，不要教用户关闭安全防护。最后让 AI 留下一份大白话打包说明，写清安装文件位置、适用电脑、已测功能和仍未完成的事项，方便以后更新时继续验收。
