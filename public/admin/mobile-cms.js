// Mobile CMS Enhancement Script
// シンプルで確実に動作するモバイル用CMS機能

(function() {
  'use strict';
  
  let isInitialized = false;
  
  function initMobileFeatures() {
    if (isInitialized || window.innerWidth > 799) return;
    
    // 編集画面のヘッダー作成
    createEditorHeader();
    
    isInitialized = true;
  }
  
  function createEditorHeader() {
    const editorContainer = document.querySelector('[class*="EditorContainer"]');
    if (!editorContainer || document.querySelector('.mobile-format-toggle-btn')) return;
    
    // ノート（コンテンツ）編集画面かどうかをチェック
    const isNotesEditPage = window.location.hash.includes('/collections/') && window.location.hash.includes('/entries/');
    if (!isNotesEditPage) return;
    
    // 書式設定トグルボタンと書式設定ツールバーを作成
    createFormatToolbar();
    
    // 元のToolbarContainerを非表示にする
    const toolbarContainers = document.querySelectorAll('[class*="ToolbarContainer"]');
    toolbarContainers.forEach(toolbar => {
      // エディタ内の書式設定ツールバーのみを非表示
      const isEditorToolbar = toolbar.querySelector('[class*="MarkdownButton"], button[title*="Bold"], button[title*="bold"]');
      if (isEditorToolbar) {
        toolbar.style.display = 'none';
      }
    });
  }
  
  function createFormatToolbar() {
    if (document.querySelector('.mobile-format-toggle-btn')) return;
    
    // 書式設定ツールバーのHTML
    const formatToolbarHTML = `
      <button class="mobile-format-toggle-btn" id="mobile-format-toggle-btn" title="書式設定">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 17v2h14v-2H5zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2zM12 5.98L13.87 11h-3.74L12 5.98z"/>
        </svg>
      </button>
      <div class="mobile-format-toolbar" id="mobile-format-toolbar">
        <div class="mobile-format-toolbar-header">
          <span>書式設定</span>
          <button class="mobile-format-close" id="mobile-format-close">×</button>
        </div>
        <div class="mobile-format-buttons">
          <button class="mobile-format-button" data-format="bold" title="太字"><strong>B</strong></button>
          <button class="mobile-format-button" data-format="italic" title="斜体"><em>I</em></button>
          <button class="mobile-format-button" data-format="link" title="リンク">🔗</button>
          <button class="mobile-format-button" data-format="quote" title="引用">"</button>
          <button class="mobile-format-button" data-format="code" title="コード">&lt;/&gt;</button>
          <button class="mobile-format-button" data-format="header" title="見出し">H1</button>
          <button class="mobile-format-button" data-format="list" title="リスト">•</button>
          <button class="mobile-format-button" data-format="image" title="画像">🖼</button>
        </div>
      </div>
    `;
    
    // body に追加
    document.body.insertAdjacentHTML('beforeend', formatToolbarHTML);
    
    // イベントリスナーの追加
    setupFormatToolbarEvents();
  }
  
  function setupFormatToolbarEvents() {
    const toggleBtn = document.getElementById('mobile-format-toggle-btn');
    const toolbar = document.getElementById('mobile-format-toolbar');
    const closeBtn = document.getElementById('mobile-format-close');
    
    if (toggleBtn && toolbar) {
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toolbar.classList.toggle('active');
      });
    }
    
    if (closeBtn && toolbar) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toolbar.classList.remove('active');
      });
    }
    
    // ツールバー外をクリックしたら閉じる
    document.addEventListener('click', function(e) {
      if (toolbar && !toolbar.contains(e.target) && !toggleBtn.contains(e.target)) {
        toolbar.classList.remove('active');
      }
    });
    
    // フォーマットボタン
    const formatButtons = document.querySelectorAll('.mobile-format-button[data-format]');
    formatButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const format = this.dataset.format;
        applyFormat(format);
      });
    });
  }
  
  function setupEditorEvents() {
    // Publishボタン
    const publishBtn = document.getElementById('mobile-publish-btn');
    if (publishBtn) {
      publishBtn.addEventListener('click', function() {
        const originalPublishBtn = document.querySelector('[class*="PublishedToolbarButton"]');
        if (originalPublishBtn) {
          originalPublishBtn.click();
        }
      });
    }
    
    // Previewボタン
    const previewBtn = document.getElementById('mobile-preview-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', function() {
        togglePreview();
      });
    }
    
    // フォーマットボタン
    const formatButtons = document.querySelectorAll('.mobile-format-button[data-format]');
    formatButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const format = this.dataset.format;
        applyFormat(format);
      });
    });
    
    // ツールバーの折りたたみ
    const toggleBtn = document.getElementById('mobile-toolbar-toggle');
    const toolbar = document.getElementById('mobile-format-toolbar');
    
    if (toggleBtn && toolbar) {
      toggleBtn.addEventListener('click', function() {
        toolbar.classList.toggle('collapsed');
        this.textContent = toolbar.classList.contains('collapsed') ? '+' : '−';
      });
    }
  }
  
  function togglePreview() {
    let previewPane = document.querySelector('.mobile-preview-pane');
    
    if (!previewPane) {
      // プレビューペインを作成
      const previewContent = document.querySelector('[class*="PreviewPaneContainer"]');
      if (previewContent) {
        previewPane = document.createElement('div');
        previewPane.className = 'mobile-preview-pane';
        previewPane.innerHTML = `
          <button class="mobile-preview-close" id="mobile-preview-close">×</button>
          <div class="markdown-body">${previewContent.innerHTML}</div>
        `;
        document.body.appendChild(previewPane);
        
        // 閉じるボタンのイベント
        const closeBtn = document.getElementById('mobile-preview-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            previewPane.classList.remove('active');
          });
        }
      }
    }
    
    if (previewPane) {
      previewPane.classList.toggle('active');
    }
  }
  
  function applyFormat(format) {
    const textarea = document.querySelector('textarea[name*="body"], [class*="MarkdownEditor"] textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'link':
        formattedText = `[${selectedText}](URL)`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'header':
        formattedText = `## ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'image':
        formattedText = `![${selectedText || 'alt text'}](image-url)`;
        break;
    }
    
    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newText;
    
    // カーソル位置を調整
    const newStart = start + formattedText.length;
    textarea.setSelectionRange(newStart, newStart);
    textarea.focus();
    
    // 書式設定ツールバーを閉じる
    const toolbar = document.getElementById('mobile-format-toolbar');
    if (toolbar) {
      toolbar.classList.remove('active');
    }
  }
  
  function cleanup() {
    const mobileElements = document.querySelectorAll('.mobile-editor-header, .mobile-format-toolbar, .mobile-format-toggle-btn, .mobile-preview-pane');
    mobileElements.forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    isInitialized = false;
  }
  
  // 初期化
  function waitForCMS() {
    const ncRoot = document.getElementById('nc-root');
    if (ncRoot && ncRoot.children.length > 0) {
      initMobileFeatures();
    } else {
      setTimeout(waitForCMS, 500);
    }
  }
  
  // DOM読み込み完了後に開始
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(waitForCMS, 1000);
    });
  } else {
    setTimeout(waitForCMS, 1000);
  }
  
  // 画面サイズ変更時の処理
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 799) {
      initMobileFeatures();
    } else {
      cleanup();
    }
  });
  
  // ページ遷移時の処理
  window.addEventListener('hashchange', function() {
    cleanup();
    setTimeout(initMobileFeatures, 500);
  });
  
})();
