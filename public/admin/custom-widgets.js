(function () {
  'use strict';

  var CLOUD_NAME = 'djzxpyzu3';
  var UPLOAD_PRESET = 'pr0p0se';
  var FOLDER = 'pr0p0se-website';

  function getEntryValue(entry, field) {
    if (!entry) return '';
    if (typeof entry.getIn === 'function') return entry.getIn(['data', field]) || '';
    return (entry.data && entry.data[field]) || '';
  }

  function stripMarkdown(text) {
    return (text || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/#{1,6}\s*/g, '')
      .replace(/[*_~`>]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function fetchImageAsBlob(url) {
    return fetch(url).then(function(res) {
      if (!res.ok) throw new Error('画像取得失敗: ' + res.status);
      return res.blob();
    });
  }

  function uploadToCloudinary(fileOrUrl) {
    var fd = new FormData();
    fd.append('file', fileOrUrl);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', FOLDER);
    return fetch('https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload', {
      method: 'POST',
      body: fd,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data.error && data.error.message) || 'Cloudinaryアップロード失敗');
        return data.secure_url;
      });
    });
  }

  // ---- スタイル定数 ----
  var S = {
    primary: {
      padding: '7px 14px', borderRadius: '4px', border: 'none',
      fontSize: '14px', fontWeight: '500', cursor: 'pointer',
      background: '#4a90e2', color: '#fff',
    },
    primaryDisabled: {
      padding: '7px 14px', borderRadius: '4px', border: 'none',
      fontSize: '14px', fontWeight: '500', cursor: 'not-allowed',
      background: '#b0c4de', color: '#fff',
    },
    secondary: {
      padding: '7px 12px', borderRadius: '4px', border: '1px solid #ccc',
      fontSize: '14px', cursor: 'pointer', background: '#fff', color: '#555',
    },
    success: {
      padding: '7px 14px', borderRadius: '4px', border: 'none',
      fontSize: '14px', fontWeight: '500', cursor: 'pointer',
      background: '#2e7d32', color: '#fff',
    },
    danger: {
      padding: '7px 12px', borderRadius: '4px', border: '1px solid #e53935',
      fontSize: '14px', cursor: 'pointer', background: '#fff', color: '#e53935',
    },
    img: {
      maxWidth: '100%', maxHeight: '200px',
      objectFit: 'cover', borderRadius: '4px', display: 'block',
    },
  };

  // window.CMS_MANUAL_INIT=true のため、ここで同期的に登録して CMS.init() を呼ぶ
  var AIImageControl = window.createClass({
      displayName: 'AIImageControl',

      getInitialState: function () {
        // mode: 'idle' | 'generating' | 'uploading' | 'previewing'
        return { mode: 'idle', candidate: null, error: null };
      },

      buildPrompt: function () {
        var entry = this.props.entry;
        var title = getEntryValue(entry, 'title');
        var body = stripMarkdown(getEntryValue(entry, 'body')).slice(0, 200);
        var text = [title, body].filter(Boolean).join('. ');
        return 'cinematic wide header image, ' + text + ', artistic, high quality, 16:9';
      },

      // AI生成 → Cloudinaryに保存 → プレビュー表示
      handleGenerate: function (e) {
        e.preventDefault();
        e.stopPropagation();
        var self = this;
        self.setState({ mode: 'generating', candidate: null, error: null });

        var url =
          'https://image.pollinations.ai/prompt/' +
          encodeURIComponent(self.buildPrompt()) +
          '?width=1280&height=720&nologo=true&seed=' + Date.now();

        fetchImageAsBlob(url)
          .then(function(blob) {
            self.setState({ mode: 'uploading' });
            return uploadToCloudinary(blob);
          })
          .then(function (secureUrl) {
            self.setState({ mode: 'previewing', candidate: secureUrl });
          })
          .catch(function (err) {
            self.setState({ mode: 'idle', error: err.message });
          });
      },

      // ファイル選択 → Cloudinaryにアップロード → プレビュー表示
      handleFileSelect: function (e) {
        e.preventDefault();
        var self = this;
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function (ev) {
          var file = ev.target.files && ev.target.files[0];
          if (!file) return;
          self.setState({ mode: 'uploading', candidate: null, error: null });
          uploadToCloudinary(file)
            .then(function (secureUrl) {
              self.setState({ mode: 'previewing', candidate: secureUrl });
            })
            .catch(function (err) {
              self.setState({ mode: 'idle', error: err.message });
            });
        };
        input.click();
      },

      // プレビューの画像を確定してヘッダー画像にセット
      handleConfirm: function (e) {
        e.preventDefault();
        this.props.onChange(this.state.candidate);
        this.setState({ mode: 'idle', candidate: null });
      },

      // プレビューをキャンセル（生成した画像は破棄）
      handleCancel: function (e) {
        e.preventDefault();
        this.setState({ mode: 'idle', candidate: null, error: null });
      },

      // 現在セットされているヘッダー画像を削除
      handleClearCurrent: function (e) {
        e.preventDefault();
        this.props.onChange('');
        this.setState({ error: null });
      },

      render: function () {
        var self = this;
        var value = this.props.value || '';
        var mode = this.state.mode;
        var candidate = this.state.candidate;
        var error = this.state.error;

        var generating = mode === 'generating';
        var uploading = mode === 'uploading';
        var previewing = mode === 'previewing';
        var busy = generating || uploading;

        // ---- 現在のヘッダー画像（プレビュー中は非表示） ----
        var currentSection = !previewing
          ? (value
            ? window.h('div', {},
                window.h('p', { style: { margin: '0 0 4px', fontSize: '12px', color: '#666' } }, '現在のヘッダー画像'),
                window.h('img', { src: value, alt: 'ヘッダー画像', style: S.img })
              )
            : window.h('div', {
                style: {
                  padding: '20px', background: '#f5f5f5', borderRadius: '4px',
                  color: '#aaa', textAlign: 'center', fontSize: '14px',
                },
              }, '画像未設定')
          )
          : null;

        // ---- プレビューエリア ----
        var previewSection = previewing
          ? window.h('div', {
              style: {
                border: '2px solid #4a90e2', borderRadius: '6px',
                padding: '8px', background: '#f0f6ff',
              },
            },
              window.h('p', {
                style: { margin: '0 0 6px', fontSize: '12px', color: '#4a90e2', fontWeight: '600' },
              }, 'プレビュー — この画像を使いますか？'),
              window.h('img', { src: candidate, alt: '候補画像', style: S.img }),
              window.h('div', { style: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' } },
                window.h('button', { type: 'button', onClick: self.handleConfirm, style: S.success }, 'この画像を使う'),
                window.h('button', { type: 'button', onClick: self.handleGenerate, style: S.secondary }, '再生成'),
                window.h('button', { type: 'button', onClick: self.handleCancel, style: S.danger }, 'キャンセル')
              )
            )
          : null;

        // ---- 操作ボタン（プレビュー中は非表示） ----
        var actionButtons = !previewing
          ? window.h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } },
              window.h('button', {
                type: 'button',
                onClick: self.handleGenerate,
                disabled: busy,
                style: busy ? S.primaryDisabled : S.primary,
              },
                generating ? '⏳ AI生成中…（30〜60秒）'
                : uploading  ? '⏳ Cloudinaryに保存中…'
                : '✨ AIで画像生成'
              ),
              window.h('button', {
                type: 'button',
                onClick: self.handleFileSelect,
                disabled: busy,
                style: busy
                  ? Object.assign({}, S.secondary, { opacity: '0.5', cursor: 'not-allowed' })
                  : S.secondary,
              }, '画像をアップロード'),
              value
                ? window.h('button', { type: 'button', onClick: self.handleClearCurrent, style: S.danger }, '削除')
                : null
            )
          : null;

        return window.h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          currentSection,
          previewSection,
          actionButtons,
          error
            ? window.h('p', { style: { color: '#c00', margin: 0, fontSize: '13px' } }, 'エラー: ' + error)
            : null
        );
      },
    });

    var AIImagePreview = function (props) {
      return props.value
        ? window.h('img', { src: props.value, alt: 'ヘッダー画像', style: { maxWidth: '100%' } })
        : null;
    };

  window.CMS.registerWidget('ai-image', AIImageControl, AIImagePreview);
  window.CMS.init();
})();
