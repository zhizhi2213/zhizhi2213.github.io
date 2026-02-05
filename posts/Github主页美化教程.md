---
layout: '''github'
title: 首页美化教程'
date: 2026-01-23 18:55:54
tags:
---
[参考教程](https://zhuanlan.zhihu.com/p/454597068 Github 首页美化教程（一）：打造个性化的GitHub首页)

[参考主页](https://github.com/sun0225SUN/ sun0225SUN (Guoqi Sun))

### 1. ctrl+c and ctrl+v 复制参考主页的代码
创建一个与用户名同名的仓库，然后将这个代码推到我们刚刚建立的仓库里面去。
注意要先打开仓库权限
- 仓库 Settings → Actions → General → Workflow permissions
- 选 Read and write permissions
- 如果看到 “Allow GitHub Actions to create and approve pull requests”，也勾上

### 2. WakaTime Token 配置
这个主要作用是用来记录与统计我们的编程时间的。
我们需要到[WakaTime](https://wakatime.com/)网站注册一个账号，然后在设置里面找到API Key，复制下来。
1. 需要在你的编辑器中安装WakaTime插件 并设置API Key

2. 在 GitHub 仓库里添加 Secrets
- 打开你的仓库 → 点上方菜单里的 Settings
- 左边栏找到 Secrets and variables → Actions
- 点 New repository secret
- Name 填：WAKATIME_API_KEY
- Value 填：刚才复制的那串 key
- 保存

这个WAKATIME_API_KEY就是我们.github/workflows/waka.yml文件里面的那个环境变量。
```markdown
<!--START_SECTION:waka-->
<!--END_SECTION:waka-->
```
Action 每次跑，会自动把数据填充在这两行之间。

### 3. 配置Token
1. 生成 PAT
   - 去 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 点击「Generate new token (classic)」
   - 勾选最少的权限：
      -  repo
      - read:user
      - read:org（如果你要展示组织/私有仓库信息）
      - workflow
   - 复制生成的 token（格式是 ghp_XXXXXXXXX...）

2. 配置插件变量
   - 打开你的仓库
   - Settings → Secrets and variables → Actions → New repository secret
   - Name 填：GH_TOKEN（插件所需变量就是.github/workflows/xxx.yml文件里面的那个环境变量）
   - Value 填：刚才生成的 PAT

   一般有以下几个变量
   - GH_TOKEN
   - ACCESS_TOKEN
   - METRICS_TOKEN
   - GITHUB_TOKEN

### 4. Repobeats 配置
```md
<img width="120%" src="https://repobeats.axiom.co/api/embed/7aa7311e6885fc4b499b17d5c47c0cd5cbca9d4d.svg" />
```
这一行是 Repobeats 服务，自动生成一张仓库贡献的动态分析图。比如提交数、活跃度、PR、issue 等，会显示成五颜六色的曲线图。这个 Repobeats 图，它并不是记录你的「整个 GitHub 账号」，而是记录某一个具体仓库的活动情况。

你只需要在 [Repobeats](https://repobeats.axiom.co/) 这个网页中登录你的 Github 账号，然后选择需要记录的仓库，就会有一句这样的话：
```
// Add the following to your README.md to embed Repobeats

![Alt](https://repobeats.axiom.co/api/embed/7aa7311e6885fc4b499b17d5c47c0cd5cbca9d4d.svg "Repobeats analytics image")
```
替换掉这个地址就ok了。
### 5. readme-streak-stats配置

[github-readme-streak-stats 项目地址](https://github.com/DenverCoder1/github-readme-streak-stats?tab=readme-ov-file)
1. 参考项目地址部署配置
2. readme 修改 user 与 域名（主题、语言等都可以修改，具体参考项目介绍）
```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-streak-stats-nu-six.vercel.app?user=zhizhi2213&theme=dark&locale=zh_Hans&hide_border=true&date_format=j/n/Y" />
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-streak-stats-nu-six.vercel.app?user=zhizhi2213&theme=light&locale=zh_Hans&hide_border=true&date_format=j/n/Y" />
  <img src="https://github-readme-streak-stats-nu-six.vercel.app?user=zhizhi2213&theme=dark&locale=zh_Hans&hide_border=true&date_format=j/n/Y" />
</picture>
```

### 6. Hexo blog 配置
1. Hexo 生成 RSS
   - 在你的 Hexo 博客目录（有 source/、themes/ 的那个根目录）里执行：
```shell
      npm install hexo-generator-feed --save=hexo-generator-feed@3.0.0
```

2. 修改 根目录 _config.yml

```yaml
# 站点基本信息（确保正确，影响 feed 的链接）
url: https://wenjiew-astro.github.io
root: /
permalink: :year/:month/:day/:title/

# RSS 配置（hexo-generator-feed）
feed:
   type: atom            # 可选 atom | rss2 | both
   path: atom.xml        # 生成文件名（常见：atom.xml 或 rss2.xml）
   limit: 10             # 列出最近 N 篇
   hub:
   content: true         # 是否包含全文（true/false）
```

3. 使用hexo启动 本地预览 提交

   http://localhost:4000/atom.xml


4. 修改 GitHub Actions
```yaml
name: Recent Blog

on:
   schedule:
      - cron: "0 0 * * *"   # 每天 00:00 UTC 跑一次
   workflow_dispatch:

jobs:
   build:
      runs-on: ubuntu-latest
      name: generate-readme-feed
      steps:
         - uses: actions/checkout@v4
         - uses: sarisia/actions-readme-feed@v1
           with:
              url: "https://你的用户名.github.io/atom.xml"  # ← 用你刚生成的 feed
              file: "README.md"
              # 可选：最多显示 5 篇、每项的格式
              max_item: 5
              format: "- <a href='${link}'>${title}</a> <sub>(${pubDate})</sub>"
         - uses: sarisia/actions-commit@master

```
5. 修改readme
   在 README.md 里加：
```markdown
## 📝 最近更新
<!--START_SECTION:feed-->
<!--END_SECTION:feed-->
```
Action 每次跑，会自动把最新文章列表填充在这两行之间。