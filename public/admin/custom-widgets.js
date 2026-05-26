(function () {
  'use strict';

  var CLOUD_NAME = 'djzxpyzu3';
  var UPLOAD_PRESET = 'pr0p0se';
  var FOLDER = 'pr0p0se-website';

  function waitForCMS(cb, attempts) {
    attempts = attempts || 0;
    if (window.CMS && window.createClass && window.h) {
      cb();
    } else if (attempts < 80) {
      setTimeout(function () { waitForCMS(cb, attempts + 1); }, 100);
    }
  }

  function getEntryValue(entry, field) {
    if (!entry) return '';
    // Immutable.js style (Decap CMS)
    if (typeof entry.getIn === 'function') return entry.getIn(['data', field]) || '';
    // Plain object style (Sveltia CMS)
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

  function uploadToCloudinary(imageUrl) {
    var fd = new FormData();
    fd.append('file', imageUrl);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', FOLDER);
    return fetch('https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload', {
      method: 'POST',
      body: fd,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error && data.error.message || 'Cloudinaryアップロード失敗');
        return data.secure_url;
      });
    });
  }

  waitForCMS(function () {
    var AIImageControl = window.createClass({
      displayName: 'AIImageControl',

      getInitialState: function () {
        return { generating: false, error: null };
      },

      buildPrompt: function () {
        var entry = this.props.entry;
        var title = getEntryValue(entry, 'title');
        var body = stripMarkdown(getEntryValue(entry, 'body')).slice(0, 200);
        var text = [title, body].filter(Boolean).join('. ');
        return 'cinematic wide header image, ' + text + ', artistic, high quality, 16:9';
      },

      handleGenerate: function (e) {
        e.preventDefault();
        e.stopPropagation();
        var self = this;
        self.setState({ generating: true, error: null });

        var prompt = self.buildPrompt();
        var pollinationsUrl =
          'https://image.pollinations.ai/prompt/' +
          encodeURIComponent(prompt) +
          '?width=1280&height=720&nologo=true&seed=' +
          Date.now();

        uploadToCloudinary(pollinationsUrl)
          .then(function (secureUrl) {
            self.props.onChange(secureUrl);
            self.setState({ generating: false });
          })
          .catch(function (err) {
            self.setState({ generating: false, error: err.message });
          });
      },

      handleClear: function (e) {
        e.preventDefault();
        this.props.onChange('');
        this.setState({ error: null });
      },

      render: function () {
        var value = this.props.value || '';
        var generating = this.state.generating;
        var error = this.state.error;

        var genBtnStyle = {
          padding: '7px 14px',
          borderRadius: '4px',
          border: 'none',
          cursor: generating ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          background: generating ? '#b0c4de' : '#4a90e2',
          color: '#fff',
          fontWeight: '500',
        };
        var clearBtnStyle = {
          padding: '7px 12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          cursor: 'pointer',
          fontSize: '14px',
          background: '#fff',
          color: '#555',
        };

        return window.h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },

          // Preview
          value
            ? window.h('img', {
                src: value,
                alt: 'ヘッダー画像プレビュー',
                style: {
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  display: 'block',
                },
              })
            : window.h(
                'div',
                {
                  style: {
                    padding: '20px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    color: '#aaa',
                    textAlign: 'center',
                    fontSize: '14px',
                  },
                },
                '画像未設定'
              ),

          // Buttons
          window.h(
            'div',
            { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } },
            window.h(
              'button',
              { type: 'button', onClick: this.handleGenerate, disabled: generating, style: genBtnStyle },
              generating ? '⏳ 生成中…（30〜60秒かかります）' : '✨ AIで画像生成'
            ),
            value
              ? window.h(
                  'button',
                  { type: 'button', onClick: this.handleClear, style: clearBtnStyle },
                  '削除'
                )
              : null
          ),

          // Error
          error
            ? window.h(
                'p',
                { style: { color: '#c00', margin: 0, fontSize: '13px' } },
                'エラー: ' + error
              )
            : null
        );
      },
    });

    var AIImagePreview = function (props) {
      return props.value
        ? window.h('img', {
            src: props.value,
            alt: 'ヘッダー画像',
            style: { maxWidth: '100%' },
          })
        : null;
    };

    window.CMS.registerWidget('ai-image', AIImageControl, AIImagePreview);
  });
})();
