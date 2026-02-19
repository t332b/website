# Sveltia CMS トライアル（try-sveltia-cms ブランチ）

このブランチでは管理画面を Decap CMS から **Sveltia CMS** に差し替えています。

## 前提

- **投稿フロー**: 管理画面で公開 → GitHub にコミット → GitHub Actions が自動で FTP デプロイ
- **メディア**: 画像・動画は **Cloudinary** に保存（Sveltia がネイティブ対応）

## 認証（GitHub）

いずれかでログインできます。

1. **Sign in with Token（おすすめ・手軽）**  
   ログイン画面で「Sign in with Token」を選び、GitHub の **Personal Access Token (classic)** を入力。  
   - Scope: `repo` にチェック  
   - [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) で発行

2. **既存の OAuth プロキシ**  
   `config.yml` の `base_url: https://cms-login-proxy.pages.dev` のまま。  
   Decap 互換の OAuth クライアントなら Sveltia でも使える可能性あり（要動作確認）。

## デプロイの流れ

- Sveltia で「Publish」すると、**現在のブランチ**（例: `try-sveltia-cms`）にコミットされます。
- 本番 FTP デプロイは **`main` への push** で動くため、  
  **`try-sveltia-cms` で試す → 問題なければ `main` にマージ** すると、これまでどおり自動デプロイされます。

## 変更内容

- `config.yml`: `media_library` → `media_libraries.cloudinary`（Sveltia 形式）、backend はそのまま
- `index.html`: Decap のスクリプトを Sveltia の CDN に差し替え、Cloudinary 用の custom-widgets.js は削除（Sveltia が Cloudinary を内蔵）
- GitHub Actions は変更なし（push で従来どおりビルド＆FTP）

## 戻し方

Decap に戻す場合は `main` にチェックアウトするか、このブランチの `public/admin/` を `main` の内容で上書きしてください。
