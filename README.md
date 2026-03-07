# PR0P0SE Website 運用ガイド

このREADMEは、現在のリポジトリ実装を元にした「サイト全体の管理手順」です。

## 運用の全体像

- コンテンツ編集は `Sveltia CMS`（`/admin`）で実施
- 編集内容は GitHub リポジトリ（`main`）へコミット
- `main` への push をトリガーに GitHub Actions がビルド
- ビルド成果物 `dist/` を FTP で本番サーバーへデプロイ
- `develop` への push をトリガーに STG 環境へ自動デプロイ（本番反映前の確認用）

## ディレクトリ責務

- `src/content/notes` : Notes記事
- `src/content/live` : ライブ情報
- `src/content/member` : メンバー情報
- `src/content/tracks` : 楽曲情報
- `src/content/works` : 作品情報
- `public/admin` : CMS設定（`config.yml` を含む）
- `.github/workflows` : デプロイ/同期の自動化
- `scripts` : 同期・生成スクリプト
- `src/data/musicList.generated.ts` : 自動生成ファイル（手編集しない）

## CMS（Sveltia）運用

- 管理画面: `/admin`（`public/admin/index.html` / `src/pages/admin.astro`）
- 設定ファイル: `public/admin/config.yml`
- backend: GitHub (`repo: t332b/website`, `branch: main`)
- メディア: Cloudinary（リポジトリアップロードは使わない設定）

## GitHub Actions

### 1. 本番デプロイ

- `push-deploy.yml`
  - `main` への push（対象パス）または手動実行で起動
  - 再利用ワークフロー `deploy.yml` を呼び出し
- `deploy.yml`
  - Node 20 / 依存インストール / `npm run build`
  - `dist/` 存在確認後、`SamKirkland/FTP-Deploy-Action@v4.3.6` でFTPデプロイ

### 1.5 STGデプロイ（develop確認用）

- `push-deploy-stg.yml`
  - `develop` への push（対象パス）または手動実行で起動
  - 再利用ワークフロー `deploy.yml` を `ref: develop` で呼び出し
  - ビルド時の `base_path` を `/stg/` に設定（CSS/JS を `/stg/assets/...` 参照にする）
  - 本番と同じ FTP Secrets を使い、`FTP_REMOTE_DIR + stg/` に配置

### 2. song.link API チェック（Notes 埋め込み）

- `check-songlink.yml`
  - 毎日 cron または手動（workflow_dispatch）で song.link API に疎通確認
  - 失敗時に GitHub Issue を自動作成（ラベル `songlink-check`）。既に同種の Open Issue があればそこにコメント追加
  - 本番のノート記事では音楽リンク取得をクライアントで行っているため、API 落ちを GitHub 上で把握する用途

### 3. Google Sheets 同期

- `sync-content.yml`（手動実行）
  - `npm run sync:content` で Sheets から `works` と `tracks` を同期
  - 差分があればコミットして push
  - その後 `deploy.yml` を呼び出してデプロイ

## 必要な GitHub Secrets

### デプロイ用

- `FTP_HOST`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_REMOTE_DIR`

- `develop` の STG 反映は同じ Secrets を利用し、配置先のみ `.../stg/` に切り替え

### オプション（Notes 埋め込みの失敗通知）

- `PUBLIC_NOTE_MUSIC_LINK_REPORT_URL`  
  ノート記事で song.link 取得に失敗したときに POST する Webhook URL。未設定なら送信しない。  
  （例: サーバレス関数の URL で受け取り、GitHub API で Issue 作成する運用）

### Google Sheets 同期用

- `GOOGLE_SERVICE_ACCOUNT`（サービスアカウントJSON）
- `GOOGLE_SHEETS_ID`（シートID）

## ローカル開発

```bash
npm install
npm run dev
```

### 主なコマンド

- `npm run dev` : 開発サーバー起動
- `npm run build` : 本番ビルド
- `npm run preview` : ビルド確認
- `npm run sync:content` : Sheetsから `works`/`tracks` を同期
- `npm run test:sheets` : Sheets接続確認

### 重要な注意

- `npm run dev` / `npm run build` の前に `predev` / `prebuild` で `scripts/generate-music-list.mjs` が実行されます
- 生成先は `src/data/musicList.generated.ts` のため、基本は手動編集しないでください

## Google Sheets 同期のローカル実行（任意）

```bash
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account", ... }'
export GOOGLE_SHEETS_ID='your-sheet-id'
npm run sync:content
```

仕様（`scripts/sync-content-from-sheets.mjs`）:

- 対象シート: `Works`, `Tracks`
- 必須カラム:
  - Works: `id`, `title`（`slug` は任意）
  - Tracks: `id`, `title`, `works_id`（または後方互換で `release_id`）
- 既存ファイルがあり、シート側 `body` が空の場合は既存本文を保持

## トラブルシュート

- `astro: command not found`
  - 依存未インストールの可能性が高いです
  - `npm install` 後に `npm run dev` を実行してください
