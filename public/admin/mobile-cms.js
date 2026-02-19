// Mobile CMS Enhancement Script
// モバイル用CMS補助（書式設定ボタン機能は削除済み）

(function() {
  'use strict';

  function cleanup() {
    const mobileElements = document.querySelectorAll(
      '.mobile-editor-header, .mobile-format-toolbar, .mobile-format-toolbar-overlay, .mobile-format-toggle-btn, .mobile-preview-pane'
    );
    mobileElements.forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  window.addEventListener('hashchange', cleanup);
})();
