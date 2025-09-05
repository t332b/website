// カスタム著者ウィジェット
CMS.registerWidget('author-auto', {
  id: 'author-auto',
  label: '著者（自動設定）',
  
  // ウィジェットの初期化
  create: function() {
    return '';
  },

  // ウィジェットの描画
  render: function(value, field, entry) {
    const container = document.createElement('div');
    container.className = 'author-auto-widget';
    
    // 初期表示
    container.innerHTML = `
      <div class="author-auto-container">
        <label>著者（自動設定）</label>
        <div class="author-status">読み込み中...</div>
        <select class="author-select" style="display: none;">
          <option value="">選択してください</option>
        </select>
      </div>
    `;

    // ユーザー情報を取得して著者を設定
    this.initializeAuthor(container, value);

    return container;
  },

  // 著者の初期化
  initializeAuthor: async function(container, currentValue) {
    try {
      // 現在のユーザー情報を取得
      const user = await this.getCurrentUser();
      
      if (user && user.login) {
        // memberコレクションからGitHubユーザー名で検索
        const member = await this.findMemberByGitHub(user.login);
        
        if (member) {
          // 自動設定
          this.setAuthorValue(container, member.id, member.name);
          this.showAutoSet(container, member);
        } else {
          // 手動選択
          this.showManualSelect(container, currentValue);
        }
      } else {
        // 手動選択
        this.showManualSelect(container, currentValue);
      }
    } catch (error) {
      console.log('著者初期化エラー:', error);
      this.showManualSelect(container, currentValue);
    }
  },

  // 現在のユーザー情報を取得
  getCurrentUser: async function() {
    try {
      // GitHub OAuthのユーザー情報を取得
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // 代替方法: localStorageから取得
      const userData = localStorage.getItem('netlify-cms-user');
      if (userData) {
        return JSON.parse(userData);
      }
      
      return null;
    } catch (error) {
      console.log('ユーザー情報取得エラー:', error);
      return null;
    }
  },

  // GitHubユーザー名でmemberを検索
  findMemberByGitHub: async function(githubUsername) {
    try {
      // memberコレクションのエントリを取得
      const entries = await CMS.getEntries('member');
      
      for (const entry of entries) {
        if (entry.data.github && 
            entry.data.github.toLowerCase() === githubUsername.toLowerCase()) {
          return entry.data;
        }
      }
      
      return null;
    } catch (error) {
      console.log('member検索エラー:', error);
      return null;
    }
  },

  // 自動設定時の表示
  showAutoSet: function(container, member) {
    const statusDiv = container.querySelector('.author-status');
    statusDiv.innerHTML = `
      <div class="author-auto-set">
        <strong>${member.name}</strong> (${member.id})
        <small>GitHub: ${member.github}</small>
        <button type="button" class="change-author-btn" style="margin-left: 10px;">変更</button>
      </div>
    `;

    // 変更ボタンのイベント
    container.querySelector('.change-author-btn').addEventListener('click', () => {
      this.showManualSelect(container, member.id);
    });
  },

  // 手動選択時の表示
  showManualSelect: async function(container, currentValue) {
    const statusDiv = container.querySelector('.author-status');
    const select = container.querySelector('.author-select');
    
    statusDiv.style.display = 'none';
    select.style.display = 'block';
    
    // memberコレクションを読み込み
    await this.loadMembers(select, currentValue);
  },

  // memberコレクションを読み込み
  loadMembers: async function(select, currentValue) {
    try {
      const entries = await CMS.getEntries('member');
      
      entries.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.data.id;
        option.textContent = `${entry.data.name} (${entry.data.id})`;
        
        if (entry.data.id === currentValue) {
          option.selected = true;
        }
        
        select.appendChild(option);
      });
    } catch (error) {
      console.log('member読み込みエラー:', error);
    }
  },

  // 著者値を設定
  setAuthorValue: function(container, value, displayName) {
    // 隠しフィールドを作成または更新
    let hiddenInput = container.querySelector('input[type="hidden"]');
    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'author';
      container.appendChild(hiddenInput);
    }
    hiddenInput.value = value;
  },

  // 値の取得
  getValue: function() {
    const container = document.querySelector('.author-auto-widget');
    if (container) {
      const hiddenInput = container.querySelector('input[type="hidden"]');
      const select = container.querySelector('.author-select');
      
      if (hiddenInput && hiddenInput.value) {
        return hiddenInput.value;
      } else if (select && select.value) {
        return select.value;
      }
    }
    return '';
  },

  // 値の設定
  setValue: function(value) {
    // 値の設定は render メソッドで処理される
  }
});
