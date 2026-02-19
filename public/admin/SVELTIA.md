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

## テスト手順（乗り換え前に確認）

1. **ログイン**
   - 「Sign in with Token」→ GitHub の PAT（scope: `repo`）を入力してログインできるか。

2. **記事投稿**
   - **Notes** を開く → **New Notes** で新規作成。
   - タイトル・公開日・著者・タグ・本文を入力して **Publish**。
   - GitHub の `main`（config の branch）にコミットされているか確認。

3. **画像（Cloudinary）連携**
   - 本文で画像を挿入（Image またはメディア選択）→ **Cloudinary** から選ぶ or アップロードできるか。
   - 既存の Notes で画像入り記事を編集して、画像が表示・差し替えできるか。

4. **他コレクション（任意）**
   - **Member** のアイコン画像（Cloudinary）が使えるか。
   - **Works** のカバー画像・動画URL が問題ないか。

5. **ビルド・表示**
   - 投稿後に `npm run build` が通るか。
   - 該当記事のページが意図どおり表示されるか（画像 URL 形式が Decap と違う場合は要確認）。

ここまで問題なければ、`main` にマージして Sveltia に乗り換えてよし。

## 戻し方

Decap に戻す場合は `main` にチェックアウトするか、このブランチの `public/admin/` と `src/pages/admin.astro` を `main` の内容で上書きしてください。
