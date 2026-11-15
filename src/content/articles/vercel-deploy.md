---
title: vercel部署：让 AI 准备项目，照着完成上线、更新和绑定域名
description: AI 做好的网页可以从 GitHub 导入 Vercel 部署。先核对 Hobby 免费套餐的用途限制，再让 Claude / Codex 检查项目和构建设置，你负责登录授权、填写配置，最后打开正式网址验收。
intent: 用 AI 做好了网页，想用 Vercel 免费部署上线，按步骤操作
keyword: vercel部署
covers:
  - vercel部署静态页面
  - vercel可以部署后端吗
  - vercel部署怎么更新
  - vercel部署报错
  - vercel怎么绑定自己的域名
  - vercel怎么套上cloudflare域名
stage: deploy
kind: question
platforms: [web]
topics: [debug]
date: 2026-11-15
reviewed: 2026-11-15
answer: 可以把 AI 做好的网页通过 GitHub 导入 Vercel 上线。Hobby 套餐免费，但服务条款限定个人或非商业用途，收费产品先核对适用套餐。让 Claude / Codex 检查项目、完成本地构建并列出配置，你登录授权、导入仓库、点击部署。先验收平台提供的 vercel.app 地址，再绑定自己的域名。以后通过关联仓库更新；部署成功后，还要亲自检查页面和核心功能。
steps:
  - who: me
    text: 说明网站用途，核对是否适用 Hobby 免费套餐
  - who: ai
    text: 让 AI 检查项目、验证本地构建，整理 GitHub 仓库和部署配置
  - who: me
    text: 登录 Vercel，授权目标仓库，核对设置后点击 Deploy
  - who: check
    text: 打开正式部署的网址，检查首页、内页和核心功能
  - who: me
    text: 按需添加自己的域名，照项目提示填写 DNS 记录
  - who: check
    text: 核对一次内容更新是否出现在正式网址，保存以后更新的说明
handoff:
  prepare:
    - 项目文件夹位置，以及网站是个人练习、展示用途还是用于经营和收费
    - 已有 GitHub 仓库地址；没有仓库就说明尚未创建
    - 本地预览结果，有无登录、表单提交或其他后台功能
    - 想使用的域名和当前 DNS 服务商；还没有域名也可以先部署
  prompts:
    - title: 先检查，再列出我在 Vercel 上要填什么
      text: |-
        我用 AI 做了一个 [网站用途]，项目在 [文件夹位置]，想部署到 Vercel。
        网站 [是否收费、是否服务于商业用途]，GitHub 仓库是 [仓库地址 / 尚未创建]。
        请先检查项目文件，判断它是可直接发布的静态文件、需要构建的网页，还是带后台功能的应用。
        需要构建就先在本地验证。列出 Framework Preset、Root Directory、Build Command、Output Directory 的建议值和依据。
        如果需要环境变量，只列变量名、用途和适用环境，不读取或输出密钥值。
        对照 Vercel 官方文档说明兼容性和套餐限制。先给检查结果，不上传、不部署。
    - title: 准备仓库并完成部署后的交接
      text: |-
        我已确认采用 [部署方案]，目标 GitHub 仓库是 [仓库地址]。
        请先列出要上传的文件，排除密钥、真实用户数据和无关文件，等我确认后再提交并推送。
        我会登录 Vercel 并完成仓库授权。请按你检查过的项目，逐项指导我填写导入页面。
        部署后帮我核对 [正式网址]，区分构建通过、页面能打开和功能可用。
        在项目里保存部署说明，写清关联仓库、正式发布的分支、配置项和下次更新步骤，不保存密钥值。
    - title: 部署报错时交给 AI 的信息
      text: |-
        Vercel 项目是 [项目名]，出问题的部署是 [部署链接]。
        现象是 [构建失败 / 页面打不开 / 某个功能失败]，访问地址是 [完整网址]。
        最近改过 [具体内容]，下面是已遮住密钥和个人信息的报错，以及报错前后的日志：[日志]。
        请先定位失败环节，说明证据和最小修改方案。不要只根据最后一句失败提示猜原因。
        修复后告诉我该在哪个网址、做什么操作来验证，不要用构建成功代替功能验收。
humanOnly:
  - text: 确认项目的真实用途，查看套餐条款；涉及付费升级时自己核对价格并决定
  - text: 登录 GitHub 和 Vercel，完成验证，确认授权的是目标仓库
  - text: 核对 AI 列出的配置；密钥值由自己填写到相应环境，不贴到聊天里
  - text: 在域名解析控制台保存记录，确认没有影响邮箱和其他网站
verify:
  - 在 Vercel 部署详情中核对仓库、版本和部署环境，确认检查的是准备对外使用的版本
  - 用未登录 Vercel 的浏览器打开正式网址，确认普通访客能看到预期页面
  - 用手机流量打开首页和一个内页，刷新内页后再检查图片、样式和链接
  - 如果有提交、登录或保存功能，亲自完成相应操作，核对实际结果
  - 绑定域名后，用 HTTPS 打开准备使用的完整地址，确认内容正确且没有证书警告
  - 修改一处容易辨认的文案，按更新流程发布后，在正式网址看到新内容
troubleshoot:
  - symptom: 点击 Deploy 后构建失败
    cause: 可能是项目本身构建不过、构建配置不匹配，或缺少所需配置
    say: 请根据这次部署的构建日志定位具体失败位置，对照本地构建结果和 Vercel 配置，先解释原因再修改。
  - symptom: 改了内容，正式网址仍是旧版
    cause: 可能没有推送到关联仓库，或本次更新只生成了预览部署
    say: 请核对本地修改、远端仓库版本、Production Branch 和最新正式部署，告诉我更新停在哪一步。
  - symptom: 补了环境变量，原来的部署仍报错
    cause: 环境变量变更只应用到新部署，也要核对所选环境
    say: 请只检查变量名、适用环境和部署时间，不读取密钥值；说明是否需要重新部署，并验证对应功能。
  - symptom: 平台地址正常，自己的域名配置未通过
    cause: 可能是 DNS 记录与项目要求不一致，或尚未完成域名验证
    say: 请逐项对比 Vercel 给出的记录和实际 DNS 查询结果，检查我是否在当前生效的解析服务里修改。
    link: domain-dns-setup
boundaries:
  - 不要把账号密码、短信验证码、密钥值或真实用户数据贴到对话、日志截图或仓库里
  - 不要让 AI 为了导入项目而公开原本私有的仓库；先查权限和具体提示
  - 不要默认允许 AI 开通付费套餐、提交正式发布或修改现有域名；先说清目标和影响
  - 不要为了网站解析清空整组 DNS 记录，也不要拿关闭安全防护当排障办法
  - 不要把部署状态正常当成用户已经能完成操作，验收要走到实际功能结果
aiRun: true
sources:
  - title: Vercel：Terms of Service
    url: https://vercel.com/legal/terms
  - title: Vercel：Vercel Hobby Plan
    url: https://vercel.com/docs/plans/hobby
  - title: Vercel：Deploying Git Repositories with Vercel
    url: https://vercel.com/docs/git
  - title: Vercel：Configuring a Build
    url: https://vercel.com/docs/builds/configure-a-build
  - title: Vercel：Environment variables
    url: https://vercel.com/docs/environment-variables
  - title: Vercel：Run server-side code with Vercel Functions
    url: https://vercel.com/docs/functions
  - title: Vercel：Configuring Maximum Duration for Vercel Functions
    url: https://vercel.com/docs/functions/configuring-functions/duration
  - title: Vercel：Troubleshooting Build Errors
    url: https://vercel.com/docs/deployments/troubleshoot-a-build
  - title: Vercel：Adding & Configuring a Custom Domain
    url: https://vercel.com/docs/domains/working-with-domains/add-a-domain
  - title: Vercel：Working with SSL Certificates
    url: https://vercel.com/docs/domains/working-with-ssl
  - title: Vercel：Using Cloudflare and other reverse proxies with Vercel
    url: https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment
  - title: Cloudflare：Proxy status
    url: https://developers.cloudflare.com/dns/proxy-status/
faq:
  - q: Vercel 免费部署能直接用于收费产品吗？
    a: 不要把免费套餐当作通用的商用许可。Vercel 服务条款将 Hobby 用途限定为个人或非商业用途；准备经营或收费时，先按真实用途核对套餐，拿不准就向官方确认。
  - q: 没买域名可以先部署吗？
    a: 可以。Vercel 会为部署提供 vercel.app 地址，先用它检查页面和功能，再决定是否绑定自己的域名。
  - q: 用 AI 做的网页一定要选 Next.js 吗？
    a: 不用。让 AI 检查实际项目，再核对 Vercel 自动识别的框架；只有 HTML、CSS、JavaScript 文件且不需要构建的静态页面，可以选择 Other 并跳过构建。
  - q: 本地预览正常，为什么 Vercel 还是部署报错？
    a: 本地预览和部署时的构建不是同一项检查。让 AI 先在本地执行项目构建，再对照 Vercel 的完整错误日志、构建设置和环境变量检查。
  - q: 修改环境变量后，要重新部署吗？
    a: 要让新配置生效，需要新的部署。Vercel 文档说明环境变量的改动不会应用到已有部署；还要确认变量选中了实际使用的 Production 或 Preview 环境。
  - q: 把域名留在 Cloudflare，就必须开启代理吗？
    a: 不必。可以只用 Cloudflare 管理 DNS，按 Vercel 提供的记录接入并使用 DNS only；这表示网页流量直接到 Vercel，不经过 Cloudflare 的网页代理。
stuckNext: 平台地址能用后，接下来通常是把自己的域名正确指向项目，并验收 HTTPS
next: domain-dns-setup
sample: false
---

> 本文按 2026-11-15 实际核对的 Vercel、Cloudflare 官方页面整理。套餐、界面和配置可能调整，**以官网当前条款和你项目里显示的设置为准**；需要付费时，以官网当前价格为准。

## <span class="role-tag me">🧑 你来做</span> 我的网页适合用 Vercel 免费部署吗？

先说清网站拿来做什么，再选套餐。Vercel 的 Hobby 套餐免费，服务条款写的是供「个人或非商业用途」使用。个人练习页可以先核对 Hobby；准备拿它经营、推广收费产品时，不要只凭「还没有收入」就决定适用免费方案。[依据：Vercel 服务条款](https://vercel.com/legal/terms)。

免费也有资源额度。Hobby 文档说明，超出部分额度后可能需要等待才能继续使用相应功能，所以不要把它理解成不限量托管。[依据：Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)。

这篇适合已经有网页文件、想把它放到网上的人。项目怎么配、需不需要修改，交给 Claude / Codex 检查；你决定用途和费用，完成账号操作，再验收。

如果还在决定网站放哪里、备案怎么处理，先看 [网站不备案有什么后果：先看服务器在哪，再决定要不要先放海外](/articles/website-without-icp/)。本文只讲 Vercel 的部署操作，不用一次访问成功推断所有用户的访问体验。

## 网页已经做好，部署前该交给 AI 什么？

把现有项目文件夹交给 Claude / Codex，并说明网站用途。没有项目文件时，先新建项目，说清想做什么，让 AI 完成网页和本地预览，再走部署。

这里采用 **GitHub 仓库 → Vercel 导入** 的路径。仓库可以理解为保存项目文件和修改历史的地方。让 AI 整理文件、准备上传清单，你确认后再上传；不用自己学写部署命令。

让 AI 给你一张填写表，至少解释这些设置：

| 导入页面上的名称 | 大白话是什么意思 | 怎么确定 |
| --- | --- | --- |
| Framework Preset | 项目使用哪套网页框架 | 对照实际项目，检查平台识别结果 |
| Root Directory | 网站项目在哪个文件夹 | 确认不是误选整个仓库或其他项目 |
| Build Command | 把项目整理成可发布文件的命令 | 让 AI 根据项目配置验证 |
| Output Directory | 构建后要发布的文件放在哪里 | 看实际构建产物，不猜目录名 |
| Environment Variables | 代码之外保存的运行配置 | 让 AI 列变量名、用途及适用环境 |

Vercel 能自动配置多种框架的构建设置，但仍要对照项目核实。环境变量是按名称保存的配置，例如服务地址或访问凭据；这里只把变量名交给 AI 检查，密钥值由你在控制台填写。[构建配置依据](https://vercel.com/docs/builds/configure-a-build)、[环境变量依据](https://vercel.com/docs/environment-variables)。

## 在 Vercel 控制台怎么完成第一次部署？

按这个顺序操作：

1. **登录并新建项目。** 在 Vercel 控制台选择 New Project，连接保存项目的 GitHub 账号。授权时核对目标仓库。
2. **导入仓库。** 从列表选择这个网站的仓库，进入项目配置页。看不到仓库时，先核对账号和授权范围，不要直接改成公开仓库。
3. **核对填写表。** 对照 AI 给出的值检查框架、项目目录、构建和输出设置。有环境变量时，按用途填写并选择对应环境。
4. **点击 Deploy。** 等部署结果。构建失败就进入这次部署查看日志，不要连续重复点部署。
5. **打开部署网址。** 用平台给出的 `vercel.app` 地址检查页面，再用未登录账号的浏览器和手机流量验证。首页出现了，还要点内页、刷新、走完核心操作。

导入配置和 Deploy 操作见 [Vercel：Deploying Git Repositories with Vercel](https://vercel.com/docs/git)；平台地址的说明见 [Vercel：Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)。

## Vercel 部署静态页面，要填构建命令吗？

先让 AI 判断文件是否需要构建。静态页面就是把已经准备好的网页文件直接发给浏览器；它也可能由框架先生成，所以不能仅凭「没有后台」判断要不要构建。

如果项目只有可直接发布的 HTML、CSS、JavaScript 文件，官方文档给出的跳过构建方法是：**Framework Preset 选 Other，打开 Build Command 的 Override，并把构建命令留空。**

还要核对发布目录。Other 的默认输出目录优先使用存在的 `public` 文件夹，否则使用项目根目录。让 AI 确认首页、图片和样式都在实际发布范围内。需要框架构建的项目，继续用它自己的构建设置，不要套用留空做法。[依据：Configuring a Build](https://vercel.com/docs/builds/configure-a-build)。

## Vercel 可以部署后端吗？

可以承接后端功能。后端就是网页背后处理请求的程序，例如接收表单、查询数据。Vercel Functions 能运行服务端代码，但不是把网页上传后，所有后台功能就自动完成了。

让 AI 列出你的登录、提交、数据保存分别依赖什么，核对是否适合部署到 Vercel Functions。函数执行有时长限制，超过配置的最大时长会终止；涉及持续运行或较长任务时，让 AI 另行核对方案，不要照搬静态页面设置。[Functions 文档](https://vercel.com/docs/functions)、[执行时长说明](https://vercel.com/docs/functions/configuring-functions/duration)。

你要验收的是实际结果：表单提交后有没有收到，保存的数据重新打开后能不能看到。仅看到页面，没有完成后台验收。

## Vercel 部署后怎么更新？

先让 AI 保存一份部署说明，记下关联仓库和 **Production Branch**。它是正式发布所跟踪的分支，可以理解为给访客使用的那条版本线，不要默认所有项目都叫 `main`。

日后修改时，让 AI 先改好并检查本地效果，再把确认过的修改提交、推送到对应仓库。正常连接 Git 的项目，会随分支推送或合并触发部署；正式分支产生正式部署，其他分支通常用于预览。改完本地文件，不等于已经更新线上网站。[依据：Vercel Git 部署](https://vercel.com/docs/git)。

更新后在部署列表核对版本，再打开正式网址找一处能辨认的新内容。如果只看了预览地址，要继续确认正式发布结果。

如果这次只改了环境变量，也需要新部署才能应用；已有部署不会自动读到这次修改。[依据：Environment variables](https://vercel.com/docs/environment-variables)。

## Vercel 怎么绑定自己的域名？

建议先把平台地址验收好，再绑定域名，方便区分是网页问题还是域名问题。

打开项目 **Settings → Domains**，添加要使用的完整域名。平台会显示该域名需要的 DNS 记录。DNS 可以理解为把域名指向网站地址的查询系统。

- 根域名，例如 `example.com`，按 Vercel 要求配置 A 记录。
- 子域名，例如 `www.example.com`，按要求配置 CNAME 记录。
- 若提示需要证明域名使用权，再添加它给出的 TXT 验证记录。

**记录值照当前项目显示的内容填，不复制旧教程里的固定 IP 或 CNAME。** 带 `www` 和不带 `www` 都要使用时，分别添加并明确跳转关系。可以保留当前 DNS 服务商，只改这次网站需要的记录。[依据：添加和配置域名](https://vercel.com/docs/domains/working-with-domains/add-a-domain)。

不知道去哪里填、各字段是什么意思，看 [域名解析怎么设置：让 AI 列出 A 记录填法，排查域名打不开的原因](/articles/domain-dns-setup/)。

保存后回到 Vercel 核对域名状态，再用 HTTPS 打开。Vercel 会在域名添加后尝试签发证书，前提是域名验证能够成功；看到记录保存成功，并不代表证书已经可用。[依据：Working with SSL Certificates](https://vercel.com/docs/domains/working-with-ssl)。

## Vercel 怎么接上 Cloudflare 管理的域名？

如果域名当前已经由 Cloudflare 管理 DNS，又只是想让它打开 Vercel 上的新网站，可以继续留在 Cloudflare。

先在 Vercel 添加域名，取到它要求的记录；再到 Cloudflare 对应域名的 DNS 记录页面填写。对这个新网站按 **DNS only** 配置，最后回 Vercel 核对域名和证书状态。这是 Vercel 官方提供的直接接入方法。[依据：Vercel 的 Cloudflare 接入说明](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment)。

DNS only 表示 Cloudflare 负责域名解析，网页请求直接到 Vercel；Proxied 则让网页流量经过 Cloudflare。Cloudflare 的通用文档建议网站流量使用代理，Vercel 针对自身平台建议尽可能直接连接。这里采用的是 Vercel 新网站的 DNS-only 接入路径，并不表示所有网站都应改成这种配置。[Cloudflare：Proxy status](https://developers.cloudflare.com/dns/proxy-status/)。

如果是已有业务域名，已经依赖 Cloudflare 的代理或访问控制，先让 AI 检查当前用途和迁移影响，不要照新站步骤直接改动。这一节解决域名接入，不承诺改变任何地区的访问效果。

## Vercel 部署报错，应该把什么发给 AI？

先区分发生在哪一步：构建失败、页面打不开，还是页面打开后某个操作失败。把对应部署链接、完整网址、最近改动和报错一起交给 AI。

构建失败时，进入项目的 **Deployments**，选择失败的那次部署，展开构建日志。日志是平台记录的执行过程。找到具体错误，并保留它前后的内容；最后一句「构建失败」往往只是结果，单独截这一句不够定位。[依据：Troubleshooting Build Errors](https://vercel.com/docs/deployments/troubleshoot-a-build)。

让 AI 先说明证据、提出最小修改，再重新构建和部署。页面能打开但功能失败时，补上你实际点击了什么、期望得到什么、最后出现什么；不要让它把另一次构建成功当成这次问题已经解决。
