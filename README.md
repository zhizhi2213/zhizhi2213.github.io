# 极简博客生成器

一个现代、优雅的静态博客生成器，专注于简洁设计和良好的阅读体验。

## ✨ 特性

- **极简主义设计**：简洁的布局和优雅的视觉效果
- **现代化交互**：平滑的动画和过渡效果
- **暗色模式**：支持明暗主题切换
- **响应式布局**：完美适配桌面和移动设备
- **快速加载**：纯静态页面，无需数据库
- **易于使用**：使用Markdown撰写文章
- **动态背景**：微妙的渐变动画效果
- **代码高亮**：支持代码块复制功能
- **自动部署**：GitHub Actions自动构建和部署

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

生成的静态文件会直接输出到根目录。

#### 本地预览
```bash
src/serve.bat
```

访问 http://localhost:4000 查看博客。

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

3. **启用GitHub Actions**：
   - 进入仓库的 Settings → Actions → General
   - 在 "Workflow permissions" 中选择 "Read and write permissions"
   - 保存设置

4. **自动部署**：
   - 每次向 `main` 分支推送代码时，GitHub Actions会自动运行
   - 构建完成后，静态文件会自动部署到仓库根目录
   - 访问 `https://yourname.github.io` 即可查看博客

## 📝 撰写文章

在 `src/posts/` 目录下按年/月组织Markdown文件，例如 `src/posts/2026/02/`，格式如下：

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
│   └── posts/             # Markdown文章目录（按年/月组织）
│       └── 2026/
│           ├── 01/
│           └── 02/
├── static/                # 生成的静态文件（自动生成）
│   ├── posts/             # 文章页面
│   ├── archives/          # 归档页面
│   └── assets/            # 静态资源
├── index.html             # 首页（自动生成）
├── atom.xml               # RSS订阅（自动生成）
├── README.md              # 项目说明
└── .gitignore            # Git忽略文件配置
```

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
  "posts": {
    "directory": "posts",
    "output": "posts"
  },
  "output": ".",
  "theme": {
    "accentColor": "#6366f1",
    "fontFamily": "system-ui, -apple-system, sans-serif",
    "postsPerPage": 10
  }
}
```

## 📦 部署流程

### GitHub Actions自动部署流程

1. 当你推送代码到 `main` 分支时
2. GitHub Actions自动触发构建
3. 运行 `node src/index.js` 生成静态文件到根目录
4. 自动提交并推送生成的静态文件
5. GitHub Pages自动部署新内容

### 手动触发构建

你也可以在GitHub仓库的 Actions 页面手动触发构建工作流。

## 🎨 自定义主题

### 修改配色

在 `config.json` 中修改 `accentColor` 来改变主题色：

```json
{
  "theme": {
    "accentColor": "#6366f1"  // 改为你喜欢的颜色
  }
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

## 💡 工作原理

这个博客生成器的工作原理：

1. **读取配置**：从 `src/config.json` 读取博客配置
2. **解析文章**：从 `src/posts/` 目录按年/月读取Markdown文件，解析元数据和内容
3. **渲染模板**：使用HTML模板渲染每个页面
4. **生成静态文件**：将渲染结果输出到 static/ 目录（posts/, archives/, assets/），index.html 和 atom.xml 生成到根目录
5. **自动部署**：GitHub Actions将生成的文件部署到GitHub Pages

## 📄 许可

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
