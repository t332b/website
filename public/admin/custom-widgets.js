(function () {
  // safety: 必要スクリプトが無ければ何もしない
  if (typeof window === "undefined" || !window.CMS || !window.cloudinary) return;

  const UploadControl = window.createClass({
    handleClick(e) {
      e.preventDefault();
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: "djzxpyzu3",      // ← あなたの cloud_name
          uploadPreset: "pr0p0se",     // ← unsigned の upload_preset
          multiple: false,
          sources: ["local", "url"],
          maxFileSize: 5242880,        // 5MB
          folder: "pr0p0se-website",               // 任意: 事前に作成推奨
        },
        (err, result) => {
          if (!err && result && result.event === "success") {
            // secure_url をCMSのフィールド値に保存
            this.props.onChange(result.info.secure_url);
          }
        }
      );
      widget.open();
    },
    render() {
      const value = this.props.value || "";
      return window.h("div", {},
        window.h(
          "div",
          { style: { marginBottom: "0.5rem" } },
          value
            ? window.h("img", { src: value, style: { maxWidth: "240px" } })
            : "未選択"
        ),
        window.h(
          "button",
          { className: "nc-button", onClick: this.handleClick },
          "画像をアップロード / 選択"
        )
      );
    },
  });

  const UploadPreview = (props) =>
    window.h("img", { src: props.value, style: { maxWidth: "100%" } });

  // "cldupload" という名前で新しいウィジェットを登録
  window.CMS.registerWidget("cldupload", UploadControl, UploadPreview);
})();
