# PR0P0SE Website

PR0P0SE のオフィシャルサイト。楽曲・作品情報、ライブ情報、メンバーによるノート記事、インタラクティブな音楽ツールを提供する静的サイト。

**本番URL:** https://pr0p0se.com

---

## 技術スタック

| 用途 | 技術 |
|------|------|
| フレームワーク | [Astro](https://astro.build/) (静的出力) |
| コンテンツ | MDX (Markdown + コンポーネント) |
| CMS | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (`/admin`) |
| 画像ホスティング | Cloudinary |
| Notes いいね・コメント | Supabase |
| コンテンツ同期 | Google Sheets API |
| デプロイ | GitHub Actions → FTP (Lolipop) |

---

## ローカル開発

```bash
npm install
npm run dev       # http://localhost:4321
```

### 主なコマンド

| コマンド | 内容 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド → `dist/` |
| `npm run preview` | ビルド結果の確認 |
| `npm run sync:content` | Google Sheets から works / tracks を同期 |
| `npm run test:sheets` | Google Sheets 接続確認 |
| `npm run generate:music` | 音楽リストの手動再生成 |

> `dev` / `build` 実行前に `scripts/generate-music-list.mjs` が自動実行され、`src/data/musicList.generated.ts` が生成されます。このファイルは手動編集しないでください。

---

## ディレクトリ構成

```
src/
├── content/
│   ├── config.ts       # コレクションスキーマ定義
│   ├── notes/          # ノート記事 (MDX)
│   ├── tracks/         # 楽曲 (MDX)
│   ├── works/          # 作品・リリース (MDX)
│   ├── live/           # ライブ情報 (MDX)
│   └── member/         # メンバー情報 (MDX)
├── pages/              # ルーティング
├── layouts/            # ページレイアウト
├── components/         # UIコンポーネント
├── data/
│   └── musicList.generated.ts  # 自動生成（手編集禁止）
└── styles/

public/
├── admin/
│   └── config.yml      # Sveltia CMS 設定
└── images/

scripts/
├── generate-music-list.mjs         # 音楽リスト生成
├── sync-content-from-sheets.mjs    # Google Sheets 同期
├── test-sheets-access.mjs          # Sheets 接続確認
└── vite-notes-mdx-autolink.mjs     # ノート用 Vite プラグイン

supabase/
├── functions/post-comment/         # コメント投稿 Edge Function
└── migrations/                     # DBマイグレーション

.github/workflows/
├── deploy.yml              # ビルド＆FTPデプロイ（再利用可能）
├── push-deploy.yml         # main / develop push トリガー
├── sync-content.yml        # Google Sheets 同期（手動）
└── check-songlink.yml      # song.link API 死活監視（毎日）
```

---

## コンテンツ管理

### CMS (Sveltia)

- 管理画面: `/admin`
- GitHub バックエンド: `t332b/website` の `main` ブランチへ直接コミット
- 画像: Cloudinary（リポジトリへの直接アップロードは使わない設定）
- Notes の公開/非公開は `is_public` フィールドで管理

### コンテンツコレクション

| コレクション | 主なフィールド |
|-------------|---------------|
| `notes` | `title`, `date`, `author`（member ID）, `tags`, `image`（Cloudinary）, `is_public` |
| `works` | `title`, `release_type`, `release_date`, `cover_url_list`, 各種配信リンク |
| `tracks` | `title`, `works_id`, `track_number`, `duration`, `lyrics_by`, `music_by` |
| `live` | `title`, `startDate`, `venue`, `city`, `ticketUrl`, `flyer` |
| `member` | `id`, `name`, `bio`, `avatar` |

### Google Sheets 同期

`works` と `tracks` は Google Sheets を正とし、手動または CI から同期します。

```bash
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account", ...}'
export GOOGLE_SHEETS_ID='your-sheet-id'
npm run sync:content
```

対象シート: `Works`（必須カラム: `id`, `title`）、`Tracks`（必須カラム: `id`, `title`, `works_id`）

---

## Supabase（Notes いいね・コメント）

Notes ページのいいね・コメント機能で使用。

- いいね: `note_likes` テーブル（`slug`, `like_count`）※更新は RPC `note_like(slug, delta)` 経由
- コメント: `note_comments` テーブル / Edge Function `post-comment`
- いいね済み判定はブラウザの localStorage で管理（同じブラウザでは重複しない、シークレット窓では再度押せる）

マイグレーションは `supabase/migrations/` を Supabase ダッシュボードの SQL Editor で実行してください。

---

## デプロイ

### フロー

```
コード変更 / CMS編集
    ↓
GitHub push
    ↓
GitHub Actions (push-deploy.yml)
    ↓
npm run build → dist/
    ↓
FTP デプロイ (Lolipop)
```

### ブランチ別の挙動

| ブランチ | デプロイ先 | BASE_PATH |
|---------|-----------|-----------|
| `main` | 本番 (`FTP_REMOTE_DIR`) | `/` |
| `develop` | ステージング (`FTP_REMOTE_DIR/tetetest/`) | `/tetetest/` |

---

## GitHub Secrets

### デプロイ（必須）

| Secret | 内容 |
|--------|------|
| `FTP_HOST` | FTP ホスト名 |
| `FTP_USERNAME` | FTP ユーザー名 |
| `FTP_PASSWORD` | FTP パスワード |
| `FTP_REMOTE_DIR` | FTP リモートディレクトリ |

### Notes 機能（任意）

| Secret / 変数 | 内容 |
|--------------|------|
| `PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー |

### Google Sheets 同期（任意）

| Secret | 内容 |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT` | サービスアカウント JSON |
| `GOOGLE_SHEETS_ID` | 対象スプレッドシート ID |

### その他（任意）

| Secret | 内容 |
|--------|------|
| `PUBLIC_NOTE_MUSIC_LINK_REPORT_URL` | song.link 取得失敗時の通知 Webhook URL |

---

## GitHub Actions

| ワークフロー | トリガー | 内容 |
|------------|---------|------|
| `push-deploy.yml` | `main` / `develop` への push | ビルド＆FTPデプロイ |
| `sync-content.yml` | 手動 (workflow_dispatch) | Sheets 同期→デプロイ |
| `check-songlink.yml` | 毎日 cron / 手動 | song.link API 死活確認・Issue 通知 |

---

## トラブルシュート

**`astro: command not found`**
→ `npm install` を実行してください。

**ビルド時に `src/data/musicList.generated.ts` がない**
→ `npm run generate:music` で手動生成できます。

**CMS でログインできない**
→ GitHub OAuth の認可が必要です。`/admin` の設定（`public/admin/config.yml`）の `base_url` を確認してください。
