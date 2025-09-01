// カスタム著者ウィジェット
CMS.registerWidget('author-auto', {
  id: 'author-auto',
  label: '著者（自動設定）',
  
  // ウィジェットの初期化
  create: function() {
    return {
      value: '',
      user: null
    };
  },

  // ウィジェットの描画
  render: function(value, field, entry) {
    const container = document.createElement('div');
    container.className = 'author-auto-widget';
    
    // ユーザー情報を取得
    this.getCurrentUser().then(user => {
      if (user) {
        // memberコレクションからGitHubユーザー名で検索
        this.findMemberByGitHub(user.login).then(member => {
          if (member) {
            // 自動設定
            this.value = member.id;
            this.updateWidget(container, member);
          } else {
            // 手動選択
            this.renderManualSelect(container);
          }
        });
      } else {
        // 手動選択
        this.renderManualSelect(container);
      }
    });

    return container;
  },

  // 現在のユーザー情報を取得
  getCurrentUser: async function() {
    try {
      // Decap CMSの内部APIを使用してユーザー情報を取得
      const user = await CMS.auth.getUser();
      return user;
    } catch (error) {
      console.log('ユーザー情報の取得に失敗:', error);
      return null;
    }
  },

  // GitHubユーザー名でmemberを検索
  findMemberByGitHub: async function(githubUsername) {
    try {
      // memberコレクションのエントリを取得
      const entries = await CMS.getEntries('member');
      const member = entries.find(entry => 
        entry.data.github && entry.data.github.toLowerCase() === githubUsername.toLowerCase()
      );
      return member ? member.data : null;
    } catch (error) {
      console.log('member検索に失敗:', error);
      return null;
    }
  },

  // 自動設定時のウィジェット表示
  updateWidget: function(container, member) {
    container.innerHTML = `
      <div class="author-auto-set">
        <label>著者（自動設定）</label>
        <div class="author-info">
          <strong>${member.name}</strong> (${member.id})
          <small>GitHub: ${member.github}</small>
        </div>
        <input type="hidden" value="${member.id}" />
        <button type="button" class="change-author-btn">変更</button>
      </div>
    `;

    // 変更ボタンのイベント
    container.querySelector('.change-author-btn').addEventListener('click', () => {
      this.renderManualSelect(container);
    });
  },

  // 手動選択時のウィジェット表示
  renderManualSelect: function(container) {
    container.innerHTML = `
      <div class="author-manual-select">
        <label>著者を選択</label>
        <select class="author-select">
          <option value="">選択してください</option>
        </select>
      </div>
    `;

    // memberコレクションからオプションを生成
    this.loadMembers(container.querySelector('.author-select'));
  },

  // memberコレクションを読み込み
  loadMembers: async function(select) {
    try {
      const entries = await CMS.getEntries('member');
      entries.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.data.id;
        option.textContent = `${entry.data.name} (${entry.data.id})`;
        select.appendChild(option);
      });
    } catch (error) {
      console.log('member読み込みに失敗:', error);
    }
  },

  // 値の取得
  getValue: function() {
    return this.value;
  },

  // 値の設定
  setValue: function(value) {
    this.value = value;
  }
});
