const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const prism = require('markdown-it-prism');
const anchor = require('markdown-it-anchor');
const taskLists = require('markdown-it-task-lists');

const config = require('./config.json');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})
.use(anchor, {
  level: 2,
  slugify: (s) => s.trim().toLowerCase().replace(/\s+/g, '-')
})
.use(taskLists, {
  enabled: true,
  label: true,
  labelAfter: true
})
.use(prism, {
  defaultLanguageForUnknown: 'plaintext',
  defaultLanguageForUnspecified: 'plaintext'
});

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
    await this.generateTags();
    await this.generateFeed();
    await this.generateSitemap();
    await this.generateSearchIndex();
    await this.copyAssets();
    console.log('✨ Blog generated successfully!');
  }

  async cleanOutput() {
    const rootDir = path.join(__dirname, '..');
    const filesToClean = ['index.html', 'atom.xml', 'sitemap.xml', 'sw.js'];
    const dirsToClean = ['static'];

    for (const file of filesToClean) {
      const filePath = path.join(rootDir, file);
      try {
        await fs.unlink(filePath);
      } catch (e) {}
    }

    for (const dir of dirsToClean) {
      const dirPath = path.join(rootDir, dir);
      try {
        await fs.rm(dirPath, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  async loadPosts() {
    const postsDir = path.join(__dirname, this.config.posts.directory);
    
    try {
      await fs.access(postsDir);
    } catch (e) {
      console.log('Posts directory not found, creating sample posts...');
      await this.createSamplePosts();
      return;
    }

    const markdownFiles = await this.findMarkdownFiles(postsDir);
    
    for (const file of markdownFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const { attributes, body } = this.parseFrontMatter(content);
      
      const relativePath = path.relative(postsDir, file);
      
      const parsedContent = this.parseMarkdown(body);
      const post = {
        ...attributes,
        content: parsedContent.html,
        toc: parsedContent.toc,
        slug: this.slugify(attributes.title || path.basename(file, '.md')),
        date: attributes.date || new Date().toISOString(),
        excerpt: this.createExcerpt(body),
        path: relativePath
      };
      
      this.posts.push(post);
    }
    
    this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async findMarkdownFiles(dir, files = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.findMarkdownFiles(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    
    return files;
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
    let toc = [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    
    content = content.replace(headingRegex, (match, hashes, title) => {
      const level = hashes.length;
      const id = this.slugify(title);
      toc.push({ level, title, id });
      return `${hashes} ${title} {#${id}}`;
    });
    
    let rendered = md.render(content);
    
    rendered = rendered.replace(/<h([23])[^>]*>(.+?)\s+\{#([^}]+)\}<\/h\1>/g, (match, level, title, id) => {
      return `<h${level} id="${id}">${title}</h${level}>`;
    });
    
    rendered = rendered.replace(/<img([^>]*?)(?:\s+loading=["'][^"']*["'])?([^>]*?)>/gi, (match, before, after) => {
      if (before.includes('loading=') || after.includes('loading=')) {
        return match;
      }
      return `<img${before} loading="lazy"${after}>`;
    });
    
    return { html: rendered, toc };
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
      const parsedContent = this.parseMarkdown(parsed.body);
      this.posts.push({
        ...parsed.attributes,
        content: parsedContent.html,
        toc: parsedContent.toc,
        slug: this.slugify(post.title),
        date: post.date,
        excerpt: this.createExcerpt(parsed.body),
        path: filename
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
      path.join(__dirname, '..', 'index.html'),
      html
    );
  }

  findRelatedPosts(currentPost, maxCount = 3) {
    const scored = this.posts
      .filter(p => p.slug !== currentPost.slug)
      .map(post => {
        let score = 0;
        
        if (currentPost.tags && post.tags) {
          const commonTags = currentPost.tags.filter(t => post.tags.includes(t));
          score += commonTags.length * 10;
        }
        
        const currentTitle = currentPost.title.toLowerCase();
        const postTitle = post.title.toLowerCase();
        const currentWords = currentTitle.split(/\s+/);
        const postWords = postTitle.split(/\s+/);
        
        currentWords.forEach(word => {
          if (word.length > 1 && postTitle.includes(word)) {
            score += 2;
          }
        });
        
        return { post, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount)
      .map(item => item.post);
    
    return scored;
  }

  async generatePosts() {
    const template = await this.loadTemplate('post.html');
    
    for (const post of this.posts) {
      const relatedPosts = this.findRelatedPosts(post);
      const html = this.renderTemplate(template, {
        post,
        posts: this.posts,
        relatedPosts,
        giscus: this.config.giscus,
        formatDate: this.formatDate.bind(this)
      });
      
      const postDir = path.join(__dirname, '..', 'static', 'posts', post.slug);
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
    
    const archivesDir = path.join(__dirname, '..', 'static', 'archives');
    await fs.mkdir(archivesDir, { recursive: true });
    await fs.writeFile(path.join(archivesDir, 'index.html'), html);
  }

  async generateTags() {
    const tags = {};
    
    this.posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (!tags[tag]) {
            tags[tag] = [];
          }
          tags[tag].push(post);
        });
      }
    });

    const sortedTags = Object.entries(tags)
      .sort((a, b) => b[1].length - a[1].length);

    const template = await this.loadTemplate('tags.html');
    const html = this.renderTemplate(template, {
      tags: sortedTags,
      posts: this.posts,
      formatDate: this.formatDate.bind(this)
    });

    const tagsDir = path.join(__dirname, '..', 'static', 'tags');
    await fs.mkdir(tagsDir, { recursive: true });
    await fs.writeFile(path.join(tagsDir, 'index.html'), html);

    for (const [tagName, tagPosts] of sortedTags) {
      const tagHtml = this.renderTemplate(template, {
        currentTag: tagName,
        tags: sortedTags,
        posts: tagPosts,
        formatDate: this.formatDate.bind(this)
      });

      const tagDir = path.join(__dirname, '..', 'static', 'tags', this.slugify(tagName));
      await fs.mkdir(tagDir, { recursive: true });
      await fs.writeFile(path.join(tagDir, 'index.html'), tagHtml);
    }
  }

  async generateFeed() {
    const updated = this.posts.length > 0 ? this.formatDateISO(this.posts[0].date) : new Date().toISOString();
    
    const escapeXml = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(this.config.site.title)}</title>
  <link href="${this.config.site.url}/atom.xml" rel="self"/>
  <link href="${this.config.site.url}/"/>
  <updated>${updated}</updated>
  <id>${this.config.site.url}/</id>
  <author>
    <name>${escapeXml(this.config.site.author)}</name>
  </author>
${this.posts.map(post => `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${this.config.site.url}/static/posts/${post.slug}/"/>
    <updated>${this.formatDateISO(post.date)}</updated>
    <id>${this.config.site.url}/static/posts/${post.slug}/</id>
    <summary>${escapeXml(post.excerpt)}</summary>
  </entry>`).join('\n')}
</feed>`;

    await fs.writeFile(
      path.join(__dirname, '..', 'atom.xml'),
      feed
    );
  }

  async generateSitemap() {
    const escapeXml = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    const lastMod = this.posts.length > 0 ? this.formatDateISO(this.posts[0].date) : new Date().toISOString();
    
    const urls = [
      { loc: this.config.site.url + '/', lastmod: lastMod, priority: '1.0' },
      { loc: this.config.site.url + '/static/archives/', lastmod: lastMod, priority: '0.8' },
      { loc: this.config.site.url + '/static/tags/', lastmod: lastMod, priority: '0.8' }
    ];
    
    this.posts.forEach(post => {
      urls.push({
        loc: this.config.site.url + `/static/posts/${post.slug}/`,
        lastmod: this.formatDateISO(post.date),
        priority: '0.9'
      });
    });
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    await fs.writeFile(
      path.join(__dirname, '..', 'sitemap.xml'),
      sitemap
    );
  }

  async generateSearchIndex() {
    const searchIndex = this.posts.map(post => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags || [],
      date: post.date
    }));

    const assetsDir = path.join(__dirname, '..', 'static', 'assets');
    await fs.mkdir(assetsDir, { recursive: true });

    await fs.writeFile(
      path.join(assetsDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2)
    );
  }

  async copyAssets() {
    const srcAssets = path.join(__dirname, 'assets');
    const dstAssets = path.join(__dirname, '..', 'static', 'assets');
    
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
            <a href="/static/posts/${post.slug}/">${post.title}</a>
          </h2>
          <div class="post-meta">
            <span class="post-date">${data.formatDate(post.date)}</span>
            ${post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : ''}
          </div>
          <p class="post-excerpt">${post.excerpt}</p>
          <a href="/static/posts/${post.slug}/" class="read-more">阅读全文 →</a>
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
                <a href="/static/posts/${post.slug}/" class="archive-title">${post.title}</a>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('') : '');

    if (data.currentTag) {
      html = html.replace(/\{\{#currentTag\}\}([\s\S]*?)\{\{\/currentTag\}\}/g, (match, content) => {
        return content.replace(/\{\{currentTag\}\}/g, data.currentTag);
      });
      html = html.replace(/\{\{\^currentTag\}\}[\s\S]*?\{\{\/currentTag\}\}/g, '');
      if (data.posts) {
        html = html.replace(/<span class="posts-count">(\d+)<\/span>/g, `<span class="posts-count">${data.posts.length}</span>`);
      }
    } else {
      html = html.replace(/\{\{#currentTag\}\}[\s\S]*?\{\{\/currentTag\}\}/g, '');
      html = html.replace(/\{\{\^currentTag\}\}([\s\S]*?)\{\{\/currentTag\}\}/g, '$1');
    }

    if (data.tags) {
      html = html.replace(/\{\{tags\}\}/g, data.tags.map(([tag, posts]) => `
        <a href="/static/tags/${this.slugify(tag)}/" class="tag-cloud-item" style="font-size: calc(1rem + ${posts.length} * 0.1rem);">
          ${tag}
          <span class="tag-count">${posts.length}</span>
        </a>
      `).join(''));
    }
    
    if (data.post) {
      const post = data.post;
      html = html
        .replace(/\{\{post\.title\}\}/g, post.title)
        .replace(/\{\{post\.excerpt\}\}/g, post.excerpt)
        .replace(/\{\{post\.date\}\}/g, data.formatDate(post.date))
        .replace(/\{\{post\.content\}\}/g, post.content)
        .replace(/\{\{post\.slug\}\}/g, post.slug)
        .replace(/\{\{post\.tags\}\}/g, post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : '');

      if (post.toc && post.toc.length > 0) {
        html = html.replace(/\{\{#toc\}\}([\s\S]*?)\{\{\/toc\}\}/g, (match, content) => {
          return content.replace(/\{\{toc\}\}/g, post.toc.map(item => {
            const indent = item.level === 3 ? 'padding-left: 1.5rem;' : '';
            return `<a href="#${item.id}" class="toc-item toc-level-${item.level}" style="${indent}">${item.title}</a>`;
          }).join(''));
        });
      } else {
        html = html.replace(/\{\{#toc\}\}[\s\S]*?\{\{\/toc\}\}/g, '');
      }
      
      if (post.tags && post.tags.length > 0) {
        html = html.replace(/\{\{#post\.tags\}\}([\s\S]*?)\{\{\/post\.tags\}\}/g, (match, content) => {
          return content.replace(/\{\{post\.tags\}\}/g, post.tags.map(tag => 
            content.replace(/\{\{\.\}\}/g, tag)
          ).join(''));
        });
      } else {
        html = html.replace(/\{\{#post\.tags\}\}[\s\S]*?\{\{\/post\.tags\}\}/g, '');
      }
    }

    if (data.giscus && data.giscus.enabled) {
      html = html.replace(/\{\{#giscus\}\}([\s\S]*?)\{\{\/giscus\}\}/g, (match, content) => {
        let result = content;
        Object.keys(data.giscus).forEach(key => {
          result = result.replace(new RegExp(`\\{\\{giscus\\.${key}\\}\\}`, 'g'), data.giscus[key]);
        });
        return result;
      });
    } else {
      html = html.replace(/\{\{#giscus\}\}[\s\S]*?\{\{\/giscus\}\}/g, '');
    }

    return html;
  }
}

const generator = new BlogGenerator();
generator.init();
