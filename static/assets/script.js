document.addEventListener('DOMContentLoaded', function() {
  const langNames = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'java': 'Java',
    'python': 'Python',
    'py': 'Python',
    'c': 'C',
    'cpp': 'C++',
    'csharp': 'C#',
    'go': 'Go',
    'rust': 'Rust',
    'ruby': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'groovy': 'Groovy',
    'shell': 'Shell',
    'bash': 'Bash',
    'powershell': 'PowerShell',
    'sql': 'SQL',
    'html': 'HTML',
    'xml': 'XML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'markdown': 'Markdown',
    'md': 'Markdown',
    'text': 'Text',
    'plaintext': 'Text',
    'diff': 'Diff',
    'git': 'Git',
    'docker': 'Docker',
    'makefile': 'Makefile',
    'cmake': 'CMake',
    'nginx': 'Nginx',
    'apache': 'Apache',
    'vim': 'Vim',
    'viml': 'Vim',
    'emacs': 'Emacs',
    'elisp': 'Emacs Lisp',
    'lisp': 'Lisp',
    'scheme': 'Scheme',
    'haskell': 'Haskell',
    'erlang': 'Erlang',
    'elixir': 'Elixir',
    'clojure': 'Clojure',
    'fsharp': 'F#',
    'ocaml': 'OCaml',
    'r': 'R',
    'matlab': 'MATLAB',
    'perl': 'Perl',
    'lua': 'Lua',
    'dart': 'Dart',
    'flutter': 'Flutter',
    'vue': 'Vue',
    'react': 'React',
    'jsx': 'JSX',
    'tsx': 'TSX',
    'angular': 'Angular',
    'svelte': 'Svelte',
    'graphql': 'GraphQL',
    'protobuf': 'Protocol Buffers',
    'thrift': 'Thrift',
    'avro': 'Avro',
    'regex': 'Regex',
    'tex': 'LaTeX',
    'latex': 'LaTeX',
    'bibtex': 'BibTeX',
    'asciidoc': 'AsciiDoc',
    'rst': 'reStructuredText',
    'toml': 'TOML',
    'ini': 'INI',
    'properties': 'Properties',
    'conf': 'Config',
    'bat': 'Batch',
    'cmd': 'Batch',
    'ps1': 'PowerShell',
    'sh': 'Shell',
    'zsh': 'Zsh',
    'fish': 'Fish'
  };

  const preBlocks = document.querySelectorAll('pre[class*="language-"]');
  
  preBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    
    const langClass = Array.from(code.classList).find(cls => cls.startsWith('language-'));
    const lang = langClass ? langClass.replace('language-', '') : '';
    const langDisplay = langNames[lang] || (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'CODE');
    
    const header = document.createElement('div');
    header.className = 'code-header';
    
    const langLabel = document.createElement('span');
    langLabel.className = 'code-lang';
    langLabel.textContent = langDisplay;
    header.appendChild(langLabel);
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
    copyButton.addEventListener('click', function() {
      const codeText = code.textContent;
      navigator.clipboard.writeText(codeText).then(() => {
        copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied';
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
          copyButton.classList.remove('copied');
        }, 2000);
      });
    });
    header.appendChild(copyButton);
    
    pre.insertBefore(header, code);
    
    const codeLines = code.textContent.split('\n');
    const nonEmptyLines = codeLines.filter(line => line.trim().length > 0);
    
    if (nonEmptyLines.length >= 2) {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      
      const linesContainer = document.createElement('div');
      linesContainer.className = 'code-lines';
      
      const codeText = code.textContent;
      const lineCount = codeText.split('\n').length;
      
      for (let i = 0; i < lineCount; i++) {
        const lineNum = document.createElement('div');
        lineNum.textContent = i + 1;
        linesContainer.appendChild(lineNum);
      }
      
      wrapper.appendChild(linesContainer);
      code.style.paddingLeft = '4rem';
      
      pre.appendChild(wrapper);
      pre.appendChild(code);
    }
  });
});
