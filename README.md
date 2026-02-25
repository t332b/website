# 開発メモ / 運用手順

## ローカル開発

- 開発サーバー
  ```bash
  npm run dev
  ```

## Google Sheets → tracks 同期

スプレッドシートの各シートを「リリース」として扱い、行をトラックとして `src/content/tracks/*.mdx` に同期します。

- 必須列: `slug`, `title`
- 任意列: `duration`, `lyrics_by`, `music_by`, `links.spotify`, `links.apple`, `links.bandcamp`, `links.youtube`, `links.soundcloud`, `links.music_video`, `body`

### 1) GitHub Secrets

リポジトリの Settings → Secrets and variables → Actions に以下を登録:

- `GOOGLE_SERVICE_ACCOUNT`: サービスアカウントのJSONをそのまま貼る
- `GOOGLE_SHEETS_ID`: スプレッドシートID（URLの `/d/` と `/edit` の間）

シートは全て読み取り可能である必要があります（サービスアカウントのメールを共有に追加）。

### 2) 手動トリガ（GitHub Actions）

- Actions タブ → 「Sync Tracks from Google Sheets」→ Run workflow
- 実行後、`src/content/tracks/**` の変更を含むPRが自動作成されます

### 3) ローカルでの同期（任意）

ローカルで試す場合は環境変数を設定して実行します:

```bash
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account", ... }'
export GOOGLE_SHEETS_ID='your-sheet-id'
npm run sync:tracks
```

既存ファイルがある場合、シート側 `body` が空なら本文は上書きしません。

### 4) スキーマ

`src/content/config.ts` の `tracks` コレクションのZodスキーマに沿って生成します。
