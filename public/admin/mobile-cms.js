// Mobile CMS Enhancement Script
// シンプルで確実に動作するモバイル用CMS機能

(function() {
  'use strict';
  
  let isInitialized = false;
  
  function initMobileFeatures() {
    if (isInitialized || window.innerWidth > 799) return;
    
    // ハンバーガーメニューの作成
    createHamburgerMenu();
    
    // 編集画面のヘッダー作成
    createEditorHeader();
    
    isInitialized = true;
  }
  
  function createHamburgerMenu() {
    const header = document.querySelector('[class*="AppHeaderContent"]');
    if (!header || document.querySelector('.mobile-header-main')) return;
    
    // 既存のボタンを非表示
    const existingButtons = header.querySelectorAll('[class*="AppHeaderButton"], [class*="AppHeaderQuickNewButton"]');
    existingButtons.forEach(btn => {
      btn.style.display = 'none';
    });
    
    // ハンバーガーメニューのHTML
    const hamburgerHTML = `
      <div class="mobile-header-main">
        <div class="mobile-hamburger" id="mobile-hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1 class="mobile-header-title">CMS管理画面</h1>
        <div style="width: 44px;"></div>
      </div>
      <div class="mobile-menu-dropdown" id="mobile-menu">
        <a href="/admin" class="mobile-menu-item">🏠 ダッシュボード</a>
        <a href="/admin#/collections/blog" class="mobile-menu-item">📝 ブログ</a>
        <a href="/admin#/collections/member" class="mobile-menu-item">👥 メンバー</a>
        <a href="/admin#/collections/tracks" class="mobile-menu-item">🎵 曲リスト</a>
        <a href="/admin#/collections/works" class="mobile-menu-item">💿 作品</a>
        <a href="/admin#/collections/live" class="mobile-menu-item">🎤 ライブ</a>
        <a href="/admin#/media" class="mobile-menu-item">📁 メディア</a>
      </div>
    `;
    
    header.innerHTML = hamburgerHTML;
    
    // ハンバーガーメニューのイベント
    const hamburger = document.getElementById('mobile-hamburger');
    const menu = document.getElementById('mobile-menu');
    
    if (hamburger && menu) {
      hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        menu.classList.toggle('active');
      });
      
      // メニュー外をクリックしたら閉じる
      document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('active');
        }
      });
    }
  }
  
  function createEditorHeader() {
    const editorContainer = document.querySelector('[class*="EditorContainer"]');
    if (!editorContainer || document.querySelector('.mobile-editor-header')) return;
    
    // ブログ編集画面かどうかをチェック
    const isBlogEditPage = window.location.hash.includes('/collections/blog/') && window.location.hash.includes('/entries/');
    if (!isBlogEditPage) return;
    
    // 戻るボタンのテキストを取得
    const backButton = document.querySelector('[class*="BackCollection"]');
    const backText = backButton ? backButton.textContent.trim() : '戻る';
    
    // 編集ヘッダーのHTML
    const editorHeaderHTML = `
      <div class="mobile-editor-header">
        <a href="/admin#/collections/blog" class="mobile-back-button">
          ← ${backText}
        </a>
        <button class="mobile-publish-button" id="mobile-publish-btn">
          公開
        </button>
        <button class="mobile-preview-toggle" id="mobile-preview-btn">Preview</button>
      </div>
      <div class="mobile-format-toolbar" id="mobile-format-toolbar">
        <button class="mobile-format-button" data-format="bold" title="太字">B</button>
        <button class="mobile-format-button" data-format="italic" title="斜体">I</button>
        <button class="mobile-format-button" data-format="link" title="リンク">🔗</button>
        <button class="mobile-format-button" data-format="quote" title="引用">"</button>
        <button class="mobile-format-button" data-format="code" title="コード">&lt;/&gt;</button>
        <button class="mobile-format-button" data-format="header" title="見出し">H</button>
        <button class="mobile-toolbar-toggle" id="mobile-toolbar-toggle">−</button>
      </div>
    `;
    
    // ヘッダーをエディタの前に挿入
    editorContainer.insertAdjacentHTML('beforebegin', editorHeaderHTML);
    
    // イベントリスナーの追加
    setupEditorEvents();
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
    }
    
    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newText;
    
    // カーソル位置を調整
    const newStart = start + formattedText.length;
    textarea.setSelectionRange(newStart, newStart);
    textarea.focus();
  }
  
  function cleanup() {
    const mobileElements = document.querySelectorAll('.mobile-header-main, .mobile-editor-header, .mobile-format-toolbar, .mobile-preview-pane');
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
