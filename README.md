# 极简博客生成器

一个现代、优雅的静态博客生成器，专注于简洁设计和良好的阅读体验。

## ✨ 特性

- **极简主义设计**：简洁的布局和优雅的视觉效果
- **现代化交互**：平滑的动画和过渡效果
- **暗色模式**：支持明暗主题切换
- **响应式布局**：完美适配桌面和移动设备
- **快速加载**：纯静态页面，无需数据库
- **易于使用**：使用Markdown撰写文章
- **代码高亮**：支持代码块复制功能
- **自动部署**：GitHub Actions自动构建和部署
- **评论系统**：集成Giscus评论功能

## 🚀 使用方法

### 本地开发

#### 构建博客
```bash
node src/index.js
```

或使用Windows批处理文件：
```bash
src/build.bat
```

生成的静态文件（index.html、atom.xml、static/）会输出到根目录，用于本地预览。

#### 本地预览
```bash
src/serve.bat
```

访问 http://localhost:4000 查看博客。

**注意**：生成的静态文件不会被提交到Git仓库。

### GitHub自动部署

1. **创建GitHub仓库**：仓库名必须是 `yourname.github.io`

2. **推送代码到GitHub**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourname/yourname.github.io.git
   git push -u origin main
   ```

3. **配置GitHub Pages**：
   - 进入仓库的 Settings → Pages
   - Source 选择 **Deploy from a branch**
   - Branch 选择 **gh-pages**，目录选择 **/ (root)**
   - 点击 **Save**

4. **启用GitHub Actions权限**：
   - 进入仓库的 Settings → Actions → General
   - 在 "Workflow permissions" 中选择 "Read and write permissions"
   - 保存设置

5. **自动部署**：
   - 每次向 `main` 分支推送代码时，GitHub Actions会自动运行
   - 构建完成后，静态文件会自动部署到 `gh-pages` 分支
   - 访问 `https://yourname.github.io` 即可查看博客

## 📝 撰写文章

在 `src/posts/` 目录下组织Markdown文件，格式如下：

```markdown
---
title: "文章标题"
date: 2026-01-26
tags: ["标签1", "标签2"]
---

# 文章内容

这里写你的文章内容...
```

## 📁 项目结构

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions自动部署配置
├── src/
│   ├── index.js            # 生成器核心逻辑
│   ├── config.json         # 配置文件
│   ├── package.json        # 项目配置
│   ├── build.bat           # Windows构建脚本
│   ├── serve.bat           # Windows预览脚本
│   ├── serve.js            # 本地预览服务器
│   ├── templates/          # HTML模板
│   │   ├── index.html     # 首页模板
│   │   ├── post.html      # 文章页模板
│   │   └── archives.html  # 归档页模板
│   ├── assets/            # 静态资源
│   │   ├── style.css       # 样式文件
│   │   └── script.js      # 交互脚本
│   └── posts/             # Markdown文章目录
│       ├── 欢迎来到我的博客.md
│       ├── HashMap源码分析.md
│       └── ...
├── .gitignore             # Git忽略文件配置
└── README.md              # 项目说明
```

**注意**：`index.html`、`atom.xml`、`static/` 等静态文件由构建脚本生成，已配置在 `.gitignore` 中，不会被提交到仓库。

## ⚙️ 配置

编辑 `src/config.json` 文件来自定义博客：

```json
{
  "site": {
    "title": "你的博客标题",
    "subtitle": "博客副标题",
    "author": "你的名字",
    "description": "博客描述",
    "url": "https://yourname.github.io"
  },
  "giscus": {
    "enabled": true,
    "repo": "yourname/yourname.github.io",
    "repoId": "your-repo-id",
    "category": "Announcements",
    "categoryId": "your-category-id",
    "mapping": "title"
  }
}
```

### Giscus评论配置

1. 访问 [Giscus](https://giscus.app) 配置你的评论系统
2. 填写仓库信息并获取 `repoId` 和 `categoryId`
3. 将这些信息填入 `src/config.json` 的 `giscus` 部分
4. 确保 GitHub 仓库的 Discussions 功能已启用

## 📦 部署流程

### 工作流程

```
本地开发                  Git仓库                  GitHub Actions                  部署
    │                       │                          │                          │
    ├─ 编写Markdown文章 ────>│                          │                          │
    │                       │                          │                          │
    ├─ 运行构建脚本 ─────────┼─── push to main ────────>│                          │
    │   (生成静态文件)       │                          │                          │
    │                       │                          ├─ 构建博客                 │
    │                       │                          ├─ 部署到gh-pages ────────>│
    │                       │                          │                          │
    └─ 本地预览             │                          │                          └─ 访问网站
```

### 分支说明

- **main 分支**：源代码（Markdown文件、模板、样式、脚本等）
- **gh-pages 分支**：生成的静态文件（由GitHub Actions自动维护）

### 手动触发构建

在GitHub仓库的 Actions 页面可以手动触发构建工作流。

## 🎨 自定义主题

### 修改配色

编辑 `src/assets/style.css` 中的CSS变量：

```css
:root {
  --primary-color: #6366f1;
  --bg-color: #f8fafc;
  --text-color: #1e293b;
  /* ... */
}
```

### 自定义样式

编辑 `src/assets/style.css` 文件来自定义样式。

### 自定义模板

编辑 `src/templates/` 目录下的HTML文件来自定义页面布局。

## 🛠️ 技术栈

- **Node.js** - 运行环境
- **纯JavaScript** - 无需外部依赖
- **纯CSS** - 样式（无框架）
- **原生JavaScript** - 交互（无框架）
- **GitHub Actions** - 自动构建和部署
- **Giscus** - 评论系统

## 💡 工作原理

这个博客生成器的工作原理：

1. **读取配置**：从 `src/config.json` 读取博客配置
2. **解析文章**：从 `src/posts/` 目录读取Markdown文件，解析元数据和内容
3. **渲染模板**：使用HTML模板渲染每个页面
4. **生成静态文件**：将渲染结果输出到根目录（index.html、atom.xml、static/）
5. **自动部署**：GitHub Actions将生成的文件部署到gh-pages分支

## ❓ 常见问题

### Q: 为什么本地构建的静态文件不需要提交？

A: 静态文件已配置在 `.gitignore` 中，避免与GitHub Actions生成的文件冲突。每次推送代码后，GitHub Actions会自动重新构建并部署。

### Q: 如何修改博客主题色？

A: 编辑 `src/assets/style.css` 中的 `--primary-color` 变量。

### Q: 评论功能不显示？

A: 确保 `src/config.json` 中的 `giscus.enabled` 为 `true`，并且GitHub仓库的Discussions功能已启用。

## 📄 许可

MIT License
