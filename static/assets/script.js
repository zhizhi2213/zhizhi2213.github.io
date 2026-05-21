(function() {
  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = document.querySelector('.theme-icon');
  const searchToggle = document.querySelector('.search-toggle');
  const searchModal = document.getElementById('searchModal');
  const searchBackdrop = document.getElementById('searchBackdrop');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');
  
  let searchIndex = [];
  let searchTimeout = null;
  
  // ─── Theme Management ───
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      
      themeToggle.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        themeToggle.style.transform = '';
      }, 300);
    });
  }
  
  // ─── Search Functionality ───
  async function loadSearchIndex() {
    if (searchIndex.length > 0) return searchIndex;
    
    try {
      const response = await fetch('/static/assets/search-index.json');
      searchIndex = await response.json();
      return searchIndex;
    } catch (error) {
      console.error('Failed to load search index:', error);
      return [];
    }
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function performSearch(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const post of searchIndex) {
      const titleMatch = post.title.toLowerCase().includes(lowerQuery);
      const excerptMatch = post.excerpt.toLowerCase().includes(lowerQuery);
      const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      if (titleMatch || excerptMatch || tagMatch) {
        results.push({
          ...post,
          titleMatch,
          excerptMatch,
          tagMatch
        });
      }
    }
    
    return results;
  }
  
  function renderResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-empty">没有找到相关文章</div>';
      return;
    }
    
    searchResults.innerHTML = results.map(post => `
      <a href="/static/posts/${post.slug}/" class="search-result-item">
        <div class="search-result-title">${highlightText(escapeHtml(post.title), query)}</div>
        <div class="search-result-meta">
          <span class="search-result-date">${formatDate(post.date)}</span>
          ${post.tags.length > 0 ? `<span class="search-result-tags">${post.tags.map(tag => `<span class="search-result-tag">#${escapeHtml(tag)}</span>`).join(' ')}</span>` : ''}
        </div>
        <div class="search-result-excerpt">${highlightText(escapeHtml(post.excerpt), query)}</div>
      </a>
    `).join('');
  }
  
  function openSearchModal() {
    if (searchModal) {
      searchModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      searchInput.focus();
      loadSearchIndex();
    }
  }
  
  function closeSearchModal() {
    if (searchModal) {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
      searchInput.value = '';
      searchResults.innerHTML = '';
    }
  }
  
  if (searchToggle) {
    searchToggle.addEventListener('click', openSearchModal);
  }
  
  if (searchBackdrop) {
    searchBackdrop.addEventListener('click', closeSearchModal);
  }
  
  if (searchClose) {
    searchClose.addEventListener('click', closeSearchModal);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      if (!query) {
        searchResults.innerHTML = '';
        return;
      }
      
      searchResults.innerHTML = '<div class="search-loading">搜索中...</div>';
      
      searchTimeout = setTimeout(async () => {
        await loadSearchIndex();
        const results = performSearch(query);
        renderResults(results, query);
      }, 200);
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    
    if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
      closeSearchModal();
    }
  });
  
  // ─── Smooth Anchor Scroll ───
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.startsWith('#tocContent')) return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  // ─── Entry Fade-in Animation ───
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.05 });
  
  const animateElements = document.querySelectorAll('.post-item, .archive-item');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(15px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
  
  // ─── Header Shadow Scroll ───
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > 20) {
        header.style.boxShadow = 'var(--shadow-sm)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }
  
  // ─── Code Blocks Enhancements ───
  const preBlocks = document.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    
    const lang = pre.getAttribute('data-lang') || 'text';
    
    const headerEl = document.createElement('div');
    headerEl.className = 'code-header';
    
    const langLabel = document.createElement('span');
    langLabel.className = 'code-lang';
    langLabel.textContent = lang.toUpperCase();
    headerEl.appendChild(langLabel);
    
    const button = document.createElement('button');
    button.textContent = '复制';
    button.className = 'copy-button';
    headerEl.appendChild(button);
    
    pre.appendChild(headerEl);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    
    const linesContainer = document.createElement('div');
    linesContainer.className = 'code-lines';
    
    const codeLines = code.textContent.split('\n');
    // Remove last empty line if any
    if (codeLines[codeLines.length - 1] === '') {
      codeLines.pop();
    }
    
    codeLines.forEach((_, index) => {
      const lineNum = document.createElement('div');
      lineNum.textContent = index + 1;
      linesContainer.appendChild(lineNum);
    });
    
    wrapper.appendChild(linesContainer);
    
    // We wrap the code element
    const codeParent = code.parentNode;
    const codeWrapper = document.createElement('div');
    codeWrapper.style.flex = '1';
    codeWrapper.style.overflowX = 'auto';
    codeParent.replaceChild(codeWrapper, code);
    codeWrapper.appendChild(code);
    
    wrapper.appendChild(codeWrapper);
    pre.appendChild(wrapper);
    
    code.style.paddingLeft = '15px';
    
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(code.textContent).then(() => {
        button.textContent = '已复制!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = '复制';
          button.classList.remove('copied');
        }, 2000);
      });
    });
  });

  // ─── TOC Highlighting ───
  const tocContent = document.getElementById('tocContent');
  const tocItems = document.querySelectorAll('.toc-item');
  const headings = document.querySelectorAll('.article-body h2[id], .article-body h3[id]');

  if (tocContent && tocItems.length > 0 && headings.length > 0) {
    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocItems.forEach(item => item.classList.remove('active'));
          
          const activeItem = document.querySelector(`.toc-item[href="#${id}"]`);
          if (activeItem) {
            activeItem.classList.add('active');
          }
        }
      });
    }, { rootMargin: '-10% 0px -70% 0px' });

    headings.forEach(heading => headingObserver.observe(heading));
  }

  // ─── Mobile Menu Drawer ───
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

  function openMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', openMobileMenu);
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
  }

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // ─── Prism Code Highlight Auto-Loader ───
  const preBlocksWithLang = document.querySelectorAll('pre code[class*="language-"]');
  if (preBlocksWithLang.length > 0) {
    const prismScript = document.createElement('script');
    prismScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    prismScript.async = true;
    
    prismScript.onload = () => {
      const languages = new Set();
      preBlocksWithLang.forEach(block => {
        const classes = block.className.split(' ');
        classes.forEach(cls => {
          const match = cls.match(/language-(\w+)/);
          if (match) {
            languages.add(match[1]);
          }
        });
      });
      
      languages.forEach(lang => {
        if (lang !== 'markup' && lang !== 'css' && lang !== 'clike' && lang !== 'javascript' && lang !== 'js') {
          const langScript = document.createElement('script');
          langScript.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
          langScript.async = true;
          document.head.appendChild(langScript);
        }
      });
      
      setTimeout(() => {
        if (window.Prism) {
          window.Prism.highlightAll();
        }
      }, 100);
    };
    
    document.head.appendChild(prismScript);
  }

  // ─── Back To Top ───
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggleBackToTop);
    toggleBackToTop();

    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ─── Local Post Views Counter ───
  const postViews = document.getElementById('postViews');
  if (postViews) {
    const path = window.location.pathname;
    const storageKey = `post_views_${path}`;
    let views = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    const hasViewed = sessionStorage.getItem(storageKey);
    if (!hasViewed) {
      views += 1;
      localStorage.setItem(storageKey, views.toString());
      sessionStorage.setItem(storageKey, '1');
    }
    
    postViews.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      <span>${views} 次阅读</span>
    `;
  }
})();
