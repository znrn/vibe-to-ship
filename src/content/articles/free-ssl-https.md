---
title: 免费SSL证书申请：网站显示「不安全」，让 AI 配上免费证书和自动续期
description: 浏览器提示网站「不安全」，多半是没开 HTTPS 或证书过期。个人网站用免费证书就够：托管平台绑定域名后自动配好；自己的服务器让 Claude / Codex 用 Let's Encrypt 申请并配好自动续期，不用装面板。
intent: 浏览器提示网站「不安全」，想免费配上 HTTPS
keyword: 免费SSL证书申请
covers:
  - 网站显示不安全
  - HTTPS 证书过期
  - ssl证书怎么安装
  - ssl证书需要买吗
  - ssl证书多少钱一年
  - https不安全怎么解决
  - 免费ssl证书和收费的区别
  - 免费ssl证书自动续期
stage: domain
platforms: [web, miniprogram]
date: 2026-10-27
updated: 2026-10-28
answer: 网站显示「不安全」，是因为没用 HTTPS，或者证书过期、和域名对不上。个人网站不用买证书。放在 Vercel 这类托管平台的，绑定域名后平台自动签发和续期。放在自己服务器上的，冬瓜的做法是交给 Claude / Codex：通过 SSH 用 Let's Encrypt 免费申请证书，配好 HTTPS 和自动续期，不用装宝塔这类面板。Let's Encrypt 证书默认 90 天，官方建议每 60 天续期一次，所以一定要让它自动续，别靠手动。阿里云、腾讯云也能领 90 天的免费证书，但不能续费，到期要重新申请、重新安装。
steps:
  - who: me
    text: 确认域名已经解析到服务器；用中国内地服务器的，ICP 备案已经通过
  - who: ai
    text: 让 AI 用 Let's Encrypt 给你的域名申请证书，配上 HTTPS，并让 http 自动跳到 https
  - who: ai
    text: 让 AI 配好自动续期，并做一次续期演练，确认到期前会自己续上
  - who: check
    text: 用浏览器打开 https 网址，地址栏显示安全；带 www 和不带 www 都试一遍
handoff:
  prepare:
    - 域名，以及它是否带 www（两个都要用就都告诉 AI）
    - 域名已经解析到服务器公网 IP（没解析的先看「域名是什么意思」和「域名、备案和 HTTPS」）
    - AI 能用 SSH 登录服务器（还没配的见「ssh密钥配置」）
  prompts:
    - title: 先检查，再申请证书
      text: |-
        我的网站在这台服务器上，域名是 [你的域名]（还有 [www.你的域名]）。
        先只检查、不要改：域名有没有解析到这台服务器、80 和 443 端口通不通、现在有没有证书。告诉我能不能直接申请 Let's Encrypt 免费证书，还缺什么。
      note: 先看再改。域名还没解析过来、或者 80 端口不通，申请会失败。
    - title: 申请证书，配上 HTTPS 和自动续期
      text: |-
        用 Let's Encrypt 给 [你的域名] 和 [www.你的域名] 申请免费证书，配到 Nginx 上，让 http 自动跳转到 https。
        配好自动续期，然后做一次续期演练（dry run），把结果告诉我。不要关闭防火墙，不要动和这个网站无关的配置。
    - title: 证书快到期 / 已经过期
      text: 网站提示证书过期（或快过期了）。先检查自动续期为什么没生效，告诉我原因；我同意后再续期，并修好自动续期。
humanOnly:
  - text: 在 DNSPod 等解析服务里，把域名解析到服务器公网 IP
    note: 也可以交给 AI 操作，见「域名是什么意思」里的 DNSPod 说明
  - text: 用中国内地服务器的，ICP 备案通过后再对外开放 HTTPS 访问
  - text: 云服务器的防火墙或安全组放行 443 端口
    note: 阿里云轻量应用服务器的 Linux 系统默认已放行 22、80、443；云服务器 ECS 在「安全组」里设置
  - text: 用小程序的，在小程序后台把服务器域名（https 开头）填进去
verify:
  - 浏览器打开 https://你的域名，点地址栏左边的图标，显示「连接是安全的」
  - 用 http:// 打开，会自动跳到 https://
  - 带 www 和不带 www 都打开一遍，都是安全的
  - AI 做过续期演练，结果是成功
  - 浏览器按 F12 看「控制台」，没有 Mixed Content 警告
troubleshoot:
  - symptom: 申请证书失败
    cause: 域名还没解析到这台服务器，或者 80 端口不通
    say: 申请 Let's Encrypt 证书失败了。把完整报错给我看，用大白话说原因：是解析的问题、端口的问题，还是别的？先别改配置。
  - symptom: 以前好好的，突然满屏「不安全」或打不开
    cause: 证书过期了，自动续期没生效
    say: 网站提示证书过期。检查自动续期为什么没跑，修好它，再续期一次，并做一次续期演练确认。
  - symptom: 已经是 https，地址栏还是提示不安全
    cause: 页面里还有 http:// 开头的图片、脚本（混合内容）
    say: 把项目里所有 http:// 的资源链接改成 https://，自己网站的资源改成相对地址，改完告诉我还有没有 Mixed Content 警告。
  - symptom: 不带 www 是安全的，带 www 不安全（或反过来）
    cause: 证书只申请了其中一个域名
    say: 证书只覆盖了 [其中一个域名]。帮我把 [另一个域名] 也加进证书，或者把它 301 跳转到主域名。
boundaries:
  - 不要为了「先跑通」让 AI 关掉防火墙或放开所有端口
  - 证书的私钥（.key 文件）只留在服务器上，不要发给别人、不要贴进对话或提交到代码仓库
  - 不要用自己生成的证书（自签名证书）对外服务，浏览器和小程序都不认
aiRun: true
sources:
  - title: Let's Encrypt：常见问题（免费、默认 90 天、建议每 60 天续期、推荐 Certbot）
    url: https://letsencrypt.org/docs/faq/
  - title: Let's Encrypt：证书有效期从 90 天缩短到 45 天
    url: https://letsencrypt.org/2025/12/02/from-90-to-45/
  - title: CA/Browser Forum：Ballot SC-081v3 缩短证书有效期
    url: https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/
  - title: Vercel：Working with SSL Certificates
    url: https://vercel.com/docs/domains/working-with-ssl
  - title: 阿里云：个人测试证书（原免费证书）
    url: https://help.aliyun.com/zh/ssl-certificate/purchase-an-individual-test-certificate
  - title: 腾讯云：免费 SSL 证书概述
    url: https://cloud.tencent.com/document/product/400/89868
  - title: 腾讯云：关于免费 SSL 证书策略调整通知
    url: https://cloud.tencent.com/document/product/400/104538
  - title: 微信开放文档：小程序网络使用说明
    url: https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
  - title: MDN：Mixed content
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content
  - title: 阿里云：轻量应用服务器管理防火墙
    url: https://www.alibabacloud.com/help/zh/simple-application-server/user-guide/manage-the-firewall-of-a-server
reviewed: 2026-10-28
faq:
  - q: SSL 证书需要买吗？
    a: 个人网站一般不用。免费证书和最便宜的收费证书都是只验证域名的 DV 证书，加密效果一样，浏览器里都显示「连接是安全的」。阿里云、腾讯云的文档建议免费证书用于测试、正式业务买正式证书；网站开始收钱、出问题会影响生意时再考虑买。
  - q: SSL 证书多少钱一年？
    a: Let's Encrypt 和云服务商的免费证书都不花钱。收费证书按品牌、类型和域名数量定价，差别很大，以云服务商官网当前价格为准。证书最长有效期正在逐步缩短，买「一年」的证书，一年内也要重新签发不止一次。
  - q: 免费 SSL 证书能自动续期吗？
    a: Let's Encrypt 能：在服务器上配好自动续期（比如官方推荐的 Certbot），到期前会自己续上，托管平台也是这样自动续。阿里云、腾讯云的免费证书不支持续费，到期要重新申请、重新安装。
  - q: 免费证书和收费证书有什么区别？
    a: 加密强度一样。收费证书多的是：可以覆盖多个域名或所有子域名（通配符）、有人工售后，以及验证企业身份的 OV、EV 证书。
  - q: 免费证书能用于小程序吗？
    a: 能。微信要求服务器域名用 HTTPS、证书由受信任的机构签发、在有效期内、信任链完整、和域名一致，没有要求必须是收费证书。小程序的服务器域名还要完成 ICP 备案。
stuckNext: 网站能用 HTTPS 安全打开了，接下来是让用户付钱
next: first-payment-without-license
---

> 本文的有效期和额度以 Let's Encrypt、阿里云、腾讯云、Vercel 2026 年 10 月的官方文档为准。证书规则这几年改过不止一次，**申请时以官方当前说明为准**。用 Claude Code 或 Codex 前，先确认服务在你所在地区可用，遵守服务条款。

## 网站为什么显示「不安全」？

| 情况 | 怎么看出来 | 怎么解决 |
| --- | --- | --- |
| 网站没开 HTTPS | 网址是 `http://` 开头 | 申请证书并配上，见下文 |
| 证书过期了 | 以前好好的，突然打不开或满屏警告 | 续期，并修好自动续期 |
| 证书和网址对不上 | 证书申请的是 `example.com`，访问的却是 `www.example.com` | 把两个域名都加进证书，或者一个跳转到另一个 |

还有一种：网址已经是 `https://`，地址栏还是不显示安全，通常是页面里有 `http://` 开头的图片或脚本（叫「混合内容」）。处理办法见下面「卡住了怎么办」。

SSL 证书就是一个电子凭证，证明「这个网站确实是这个域名的」，并让浏览器和网站之间的传输加密。配上证书，网址就能用 `https://` 打开。

## <span class="role-tag me">🧑 你来做</span> 先判断：网站放在哪？

- **放在 Vercel 这类托管平台**：什么都不用做。域名绑定、解析生效后，平台会自动向 Let's Encrypt 申请证书，到期前 14～30 天自动续期。续期失败时平台会发通知，按提示检查 DNS 就行。
- **放在自己的服务器上**（比如阿里云轻量应用服务器）：交给 AI，用 Let's Encrypt 申请证书并配好自动续期，见下一节。开始前域名要先解析到服务器（见 [域名、备案和 HTTPS](/flow/domain/)），AI 要能用 SSH 登录服务器（见 [ssh密钥配置](/articles/ssh-key-login/)）。整套部署流程见 [服务器和部署](/flow/deploy/)。
- **做小程序**：小程序的服务器域名只能用 HTTPS，证书要在有效期内、由受信任的机构签发、和域名一致。免费证书满足这些条件，同样按下一节给接口域名（比如 `api.example.com`）配上证书，再填进小程序后台。

## <span class="role-tag ai">🤖 交给 AI</span> 自己的服务器：Let's Encrypt + 自动续期

冬瓜的做法是**不装宝塔这类面板**，让 Claude / Codex 通过 SSH 直接在服务器上配：申请证书、配到 Nginx 上、http 跳转到 https、配好自动续期，最后做一次续期演练确认。具体说法见下面「这样交代给 AI」。

**为什么一定要自动续期**：Let's Encrypt 的证书默认 90 天有效，官方建议每 60 天续期一次，推荐的客户端是 Certbot。而且有效期还会变短：按 Let's Encrypt 公布的时间表，默认证书 2027 年 2 月起改为 64 天，2028 年 2 月起改为 45 天。浏览器厂商和证书机构 2025 年也投票通过，从 2026 年 3 月起逐步缩短所有证书的最长有效期。靠手动换证书，迟早会忘。

## 另一种做法：云服务商的免费证书

不想用 Let's Encrypt，也可以在云服务商领免费证书，但它们**不能续费、到期要重新申请并重新安装**：

| | 阿里云（个人测试证书免费版） | 腾讯云（免费 SSL 证书） |
| --- | --- | --- |
| 有效期 | 90 天 | 90 天 |
| 数量 | 每个实名主体每个自然年 20 张 | 每个账号 50 张 |
| 域名 | 单个域名，不支持通配符 | 单个域名，不支持通配符和 IP |
| 到期 | 不能续费，重新申请，消耗当年额度 | 不能续费，重新申请 |

领到证书后，同样可以让 AI 帮你装到服务器上：「这是证书文件和密钥文件，帮我配到 Nginx 上，http 跳到 https」。但每 90 天要重复一次，所以冬瓜更推荐上面的自动续期。
