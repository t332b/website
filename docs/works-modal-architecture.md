# works モーダル構成：現状 vs 理想

## 1. デザイン・スクリプトの共有（[slug] とモーダル）

| 項目 | 理想 | 現状 |
|------|------|------|
| 見た目・挙動 | [slug].astro を開いた時とモーダルを開いた時で同じ。デザインを変えれば両方変わる | **共有されている**。`ReleaseDetail.astro` と `release-detail.css` を [slug].astro と フラグメント（モーダル用）の両方で使用。モーダルは fetch した HTML を同じスタイルで表示 |

- **[slug].astro**: サーバーで `ReleaseDetail` を描画し、`.release-overlay` でラップ。閉じる・前後ナビは return URL や `/works?filter=xxx` に遷移。
- **モーダル**: Base の `#global-release-detail-slot` に、`/works/fragments/[slug]` を fetch した HTML（ReleaseDetail の出力）を注入。同じ CSS が効く。

→ **現状でも「1 箇所変えれば両方変わる」構成になっている。**

---

## 2. オーディオプレーヤー用モーダルの事前作成

| 項目 | 理想 | 現状 |
|------|------|------|
| 発火 | ページ表示時 | なし |
| 対象 | プレーヤーに含まれるリリースの**ユニーク一覧** | なし |
| やること | その一覧分だけモーダル（中身）をあらかじめ作成しておく | **モーダル DOM は 1 つだけ**。開くたびに `loadReleaseFragment(slug)` で `/works/fragments/[slug]` を **fetch して slot に差し替え** |

- プレーヤーは `musicList.generated.ts` の `musicItems`（各 `releaseSlug`）を使っている。
- 曲名クリック時は `openReleaseModal(slug)` を呼び、その時点で初めて fetch が走る。
- **「プレーヤー用にユニークなリリース一覧を取って、その分だけモーダルを事前に作る」処理はしていない。**

---

## 3. works ページでのモーダル作成

| 項目 | 理想 | 現状 |
|------|------|------|
| 発火 | 対象リリースのカードが**少しでも画面に入ったら** | なし（モーダル DOM の「作成」という概念がない） |
| やること | そのリリース用のモーダルを作る。すでにプレーヤー用に作ってあれば**流用** | **モーダルは 1 つ**。カードクリックで `openReleaseModal(slug)` → その都度 fetch して slot を上書き |
| 一括作成 | しない（重くなるから） | そもそも「複数モーダル」を持たないので該当なし |

- works のカードは `data-slug` を持ち、クリックで `openReleaseModal(slug, { prevNextSlugs })` を実行。
- 毎回 `loadReleaseFragment(slug)` が呼ばれ、1 つの `#global-release-detail-slot` の内容が差し替わるだけ。

---

## 4. 現在の技術的な流れ（まとめ）

```
Base.astro
  └ 1 個の #global-release-modal
      └ #global-release-detail-slot（空）

openReleaseModal(slug) が呼ばれたとき:
  1. モーダルを display: flex で表示
  2. slot に「読み込み中…」を表示
  3. fetch(`/works/fragments/${slug}`) で HTML 取得
  4. 返ってきた HTML から #fragment-content の内側を取得
  5. slot.innerHTML = その HTML
  6. 前後ナビ用に globalReleaseSlugs を更新
```

- **モーダル DOM は常に 1 つ。中身は「今開いている slug の 1 件」だけ。**
- プレーヤー用の事前作成・works 用の viewport 発火・「作ったモーダルの流用」は**いずれも未実装**。

---

## 5. 理想に近づける場合の方向性

1. **プレーヤー用の事前作成**
   - ページロード時（または Base の script）で `musicItems` から `releaseSlug` をユニークに集める。
   - その slug リストに対して、あらかじめ `/works/fragments/[slug]` を fetch（または SSR で HTML を埋め込み）し、`slug → HTML 文字列` のキャッシュを持つ。
   - `openReleaseModal(slug)` 時に、キャッシュにあれば slot にその HTML を注入（fetch しない）。キャッシュになければ従来どおり fetch。

2. **works の viewport 発火**
   - 各カードに `data-slug` を付けたまま、Intersection Observer で「カードが少しでも表示されたら」発火。
   - 発火時: その slug のモーダル用 HTML がまだなければ fetch してキャッシュに追加（プレーヤー用キャッシュと共通）。すでにあれば何もしない。
   - 表示時は引き続き 1 つのモーダルで、`openReleaseModal(slug)` でキャッシュ or fetch した内容を slot に表示。

3. **「モーダルを複数 DOM として持つ」案**
   - プレーヤー用は事前に DOM を生成して非表示で持っておく。works は viewport に入ったら DOM を 1 つずつ追加。開くときは該当 DOM を表示する。
   - 実装量・メモリ・アクセシビリティ（フォーカス・aria-hidden の切り替え）の考慮が必要。

現状は「1 モーダル + 都度 fetch」なので、理想に合わせるなら「キャッシュ＋事前取得・viewport 発火」を上記のように足していく形になる。
