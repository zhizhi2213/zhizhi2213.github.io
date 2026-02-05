---
title: "如何创建GitHub个人网站"
date: 2026-01-22 19:08:14
tags:
---

## 如何创建GitHub个人网站

本文将详细介绍如何从零开始搭建一个基于GitHub Pages的个人网站，包括环境配置、仓库创建、Hexo框架安装以及主题配置等全过程。

### 准备工作

在开始之前，请确保你的电脑已经安装以下工具：

- Node.js (建议选择LTS版本)
- Git

#### 1. 配置SSH密钥

1. 生成SSH密钥：

```shell
   ssh-keygen -t rsa -C "你的邮箱地址"
```

2. 查看公钥内容：

```shell
   cat ~/.ssh/id_rsa.pub  # Windows系统使用: type C:\Users\用户名\.ssh\id_rsa.pub
```

3. 复制公钥内容，前往访问 GitHub SSH设置

- 访问 GitHub SSH设置
- 点击 “New SSH key”
- 填写标题（如：My PC）
- 粘贴公钥内容
- 点击 “Add SSH key”

4. 测试SSH连接：

```shell
    ssh -T git@github.com
```

#### 2. 创建GitHub Pages仓库

1. 登录GitHub，点击右上角 “+” 号，选择 “New repository”
2. 仓库名称必须为：你的用户名.github.io
3. 选择 “Public”
4. 点击 “Create repository”

#### 3. 安装Hexo框架

1. 全局安装Hexo-CLI：

```shell
   npm install -g hexo-cli
``` 

2. 创建博客项目：

```shell
   hexo init blog
   cd blog
   npm install
``` 

3. 安装必要插件：

```shell
   npm install hexo-deployer-git --save
   npm install hexo-renderer-pug hexo-renderer-stylus --save
```

#### 4. 配置Hexo

1. 编辑根目录下的 _config.yml，修改以下配置：

```yaml
# Site
title: 你的网站标题
subtitle: 副标题
description: 网站描述
keywords: 关键词
author: 作者名
language: zh-CN
timezone: Asia/Shanghai

# URL
url: https://你的用户名.github.io

# Deployment
deploy:
  type: git
  repo: git@github.com:你的用户名/你的用户名.github.io.git
  branch: main
```

#### 5. 安装Butterfly主题

1. 下载主题：

```shell
    #最好开启小飞机，还有问题开启TUN模式
    git clone https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
```

2. 修改Hexo配置文件 `_config.yml`：

```yaml
   theme: butterfly
```

3. 创建主题配置文件：

```
# 在博客根目录创建文件：_config.butterfly.yml
# 从主题目录 themes/butterfly/_config.yml 复制配置到 _config.butterfly.yml
```

#### 6. 创建GitHub Actions自动部署

1. 在博客根目录创建 .github/workflows/deploy.yml：

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

#### 7. 本地预览与部署

1. 本地预览：

```shell
   hexo clean   # 清除缓存
   hexo server  # 启动本地服务器
```

访问 http://localhost:4000 预览效果

2. 部署到GitHub：

```shell
   hexo clean # 清除缓存
   hexo deploy # 部署到GitHub
```

#### 8. 自定义域名（可选）
    1. 在你的域名服务商处添加DNS记录：
        - 类型：CNAME
        - 主机记录：www 或 @
        - 记录值：你的用户名.github.io
    2. 在博客的source目录下创建CNAME文件：

```shell
    echo "你的域名" > source/CNAME
```
#### 9，写作博客
1. 创建博客
```shell
    hexo new 'Github 首页美化教程'
```
2. 编辑生产的博客文件

3. 预览发布

