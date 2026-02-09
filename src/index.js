const fs = require('fs').promises;
const path = require('path');

const config = require('../config.json');

class BlogGenerator {
  constructor() {
    this.config = config;
    this.posts = [];
  }

  async init() {
    await this.cleanOutput();
    await this.loadPosts();
    await this.generateIndex();
    await this.generatePosts();
    await this.generateArchives();
    await this.generateFeed();
    await this.copyAssets();
    console.log('✨ Blog generated successfully!');
  }

  async cleanOutput() {
    const outputDir = path.join(__dirname, '..', this.config.output);
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (e) {}
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(path.join(outputDir, 'posts'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'archives'), { recursive: true });
  }

  async loadPosts() {
    const postsDir = path.join(__dirname, '..', this.config.posts.directory);
    
    try {
      const files = await fs.readdir(postsDir);
      const markdownFiles = files.filter(f => f.endsWith('.md'));
      
      for (const file of markdownFiles) {
        const filePath = path.join(postsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { attributes, body } = this.parseFrontMatter(content);
        
        const post = {
          ...attributes,
          content: this.parseMarkdown(body),
          slug: this.slugify(attributes.title || file.replace('.md', '')),
          date: attributes.date || new Date().toISOString(),
          excerpt: this.createExcerpt(body)
        };
        
        this.posts.push(post);
      }
      
      this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.log('No posts directory found, creating sample posts...');
      await this.createSamplePosts();
    }
  }

  parseFrontMatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (match) {
      const attributes = {};
      const lines = match[1].split('\n');
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          } else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          
          attributes[key] = value;
        }
      }
      
      return { attributes, body: match[2] };
    }
    
    return { attributes: {}, body: content };
  }

  parseMarkdown(content) {
    let html = content;
    
    const codeBlocks = [];
    html = html.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      const langName = lang || 'text';
      const index = codeBlocks.length;
      code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      codeBlocks.push({ lang: langName, code });
      return `__CODEBLOCK_${index}__`;
    });
    
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    
    html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');
    
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>|<ol>|<pre>|<blockquote>)/g, '$1');
    html = html.replace(/(<\/ul>|<\/ol>|<\/pre>|<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<li>([^<]*)<\/li>/g, (match, content) => {
      if (!content.includes('<')) {
        return `<li>${content.replace(/\n/g, '<br>')}</li>`;
      }
      return match;
    });
    
    html = html.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
      const block = codeBlocks[index];
      return `<pre class="language-${block.lang}" data-lang="${block.lang}"><code class="language-${block.lang}">${block.code}</code></pre>`;
    });
    
    return html;
  }

  async createSamplePosts() {
    const postsDir = path.join(__dirname, '..', this.config.posts.directory);
    await fs.mkdir(postsDir, { recursive: true });
    
    const samplePosts = [
      {
        title: '欢迎来到我的博客',
        date: '2026-01-26',
        tags: ['随笔', '生活'],
        content: `# 欢迎来到我的博客

这是使用全新的静态博客生成器创建的第一篇文章。

## 特点

这个博客生成器具有以下特点：

- **简洁设计**：极简主义风格
- **快速加载**：纯静态页面
- **响应式**：适配所有设备
- **暗色模式**：保护你的眼睛

希望你喜欢这个全新的博客设计！
`
      },
      {
        title: '关于技术分享',
        date: '2026-01-25',
        tags: ['技术', '思考'],
        content: `# 关于技术分享

技术是不断进步的，分享让知识流动得更快。

## 学习方式

1. 实践是最好的老师
2. 记录学习笔记
3. 与他人交流讨论
4. 持续迭代改进

让我们一起在技术的道路上前行！
`
      },
      {
        title: '代码之美',
        date: '2026-01-24',
        tags: ['编程', '美学'],
        content: `# 代码之美

优雅的代码就像诗歌一样令人愉悦。

## 编程哲学

> "简单是复杂的终极境界。" - 达芬奇

好的代码应该：
- 易于理解
- 易于维护
- 高效运行
- 遵循最佳实践

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`
`
      }
    ];
    
    for (const post of samplePosts) {
      const filename = post.title + '.md';
      const filePath = path.join(postsDir, filename);
      const content = `---
title: "${post.title}"
date: ${post.date}
tags: [${post.tags.map(t => `"${t}"`).join(', ')}]
---

${post.content}`;
      await fs.writeFile(filePath, content, 'utf-8');
      
      const parsed = this.parseFrontMatter(content);
      this.posts.push({
        ...parsed.attributes,
        content: this.parseMarkdown(parsed.body),
        slug: this.slugify(post.title),
        date: post.date,
        excerpt: this.createExcerpt(parsed.body)
      });
    }
    
    this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  slugify(text) {
    return text
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  createExcerpt(content, maxLength = 150) {
    const text = content.replace(/[#*`\[\]]/g, '').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatDateISO(dateStr) {
    return new Date(dateStr).toISOString();
  }

  async generateIndex() {
    const template = await this.loadTemplate('index.html');
    const html = this.renderTemplate(template, {
      posts: this.posts,
      formatDate: this.formatDate.bind(this)
    });
    
    await fs.writeFile(
      path.join(__dirname, '..', this.config.output, 'index.html'),
      html
    );
  }

  async generatePosts() {
    const template = await this.loadTemplate('post.html');
    
    for (const post of this.posts) {
      const html = this.renderTemplate(template, {
        post,
        posts: this.posts,
        formatDate: this.formatDate.bind(this)
      });
      
      const postDir = path.join(__dirname, '..', this.config.output, 'posts', post.slug);
      await fs.mkdir(postDir, { recursive: true });
      await fs.writeFile(path.join(postDir, 'index.html'), html);
    }
  }

  async generateArchives() {
    const template = await this.loadTemplate('archives.html');
    const archives = {};
    
    this.posts.forEach(post => {
      const date = new Date(post.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!archives[key]) {
        archives[key] = [];
      }
      archives[key].push(post);
    });
    
    const html = this.renderTemplate(template, {
      archives: Object.entries(archives).sort().reverse(),
      posts: this.posts,
      formatDate: this.formatDate.bind(this)
    });
    
    await fs.writeFile(
      path.join(__dirname, '..', this.config.output, 'archives', 'index.html'),
      html
    );
  }

  async generateFeed() {
    const updated = this.posts.length > 0 ? this.formatDateISO(this.posts[0].date) : new Date().toISOString();
    
    const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${this.config.site.title}</title>
  <link href="${this.config.site.url}/atom.xml" rel="self"/>
  <link href="${this.config.site.url}/"/>
  <updated>${updated}</updated>
  <id>${this.config.site.url}/</id>
  <author>
    <name>${this.config.site.author}</name>
  </author>
${this.posts.map(post => `  <entry>
    <title>${post.title}</title>
    <link href="${this.config.site.url}/posts/${post.slug}/"/>
    <updated>${this.formatDateISO(post.date)}</updated>
    <id>${this.config.site.url}/posts/${post.slug}/</id>
    <summary>${post.excerpt}</summary>
  </entry>`).join('\n')}
</feed>`;

    await fs.writeFile(
      path.join(__dirname, '..', this.config.output, 'atom.xml'),
      feed
    );
  }

  async copyAssets() {
    const srcAssets = path.join(__dirname, 'assets');
    const dstAssets = path.join(__dirname, '..', this.config.output, 'assets');
    
    try {
      await fs.mkdir(dstAssets, { recursive: true });
      
      const files = await fs.readdir(srcAssets);
      for (const file of files) {
        const src = path.join(srcAssets, file);
        const dst = path.join(dstAssets, file);
        await fs.copyFile(src, dst);
      }
    } catch (e) {
      console.log('Assets directory not found');
    }
  }

  async loadTemplate(name) {
    return await fs.readFile(
      path.join(__dirname, 'templates', name),
      'utf-8'
    );
  }

  renderTemplate(template, data) {
    const config = this.config;
    
    const postCard = (post) => `
      <article class="post-card">
        <div class="post-card-inner">
          <h2 class="post-title">
            <a href="/posts/${post.slug}/">${post.title}</a>
          </h2>
          <div class="post-meta">
            <span class="post-date">${data.formatDate(post.date)}</span>
            ${post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : ''}
          </div>
          <p class="post-excerpt">${post.excerpt}</p>
          <a href="/posts/${post.slug}/" class="read-more">阅读全文 →</a>
        </div>
      </article>
    `;
    
    let html = template
      .replace(/\{\{site\.title\}\}/g, config.site.title)
      .replace(/\{\{site\.subtitle\}\}/g, config.site.subtitle)
      .replace(/\{\{site\.author\}\}/g, config.site.author)
      .replace(/\{\{site\.description\}\}/g, config.site.description)
      .replace(/\{\{site\.url\}\}/g, config.site.url)
      .replace(/\{\{theme\.accentColor\}\}/g, config.theme.accentColor)
      .replace(/\{\{posts\}\}/g, data.posts.map(postCard).join(''))
      .replace(/\{\{archives\}\}/g, data.archives ? data.archives.map(([month, posts]) => `
        <div class="archive-month">
          <h3 class="archive-month-title">${month}</h3>
          <ul class="archive-list">
            ${posts.map(post => `
              <li class="archive-item">
                <span class="archive-date">${data.formatDate(post.date)}</span>
                <a href="/posts/${post.slug}/" class="archive-title">${post.title}</a>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('') : '');
    
    if (data.post) {
      const post = data.post;
      html = html
        .replace(/\{\{post\.title\}\}/g, post.title)
        .replace(/\{\{post\.date\}\}/g, data.formatDate(post.date))
        .replace(/\{\{post\.content\}\}/g, post.content)
        .replace(/\{\{post\.tags\}\}/g, post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : '');
    }
    
    return html;
  }
}

const generator = new BlogGenerator();
generator.init();
