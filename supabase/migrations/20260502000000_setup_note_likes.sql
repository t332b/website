-- note_likes テーブルの作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS note_likes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug       text        NOT NULL,
  user_key   text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- slug でのカウントクエリを高速化
CREATE INDEX IF NOT EXISTS note_likes_slug_idx ON note_likes (slug);

-- 以前のバグで挿入された空スラグの行を削除
DELETE FROM note_likes WHERE slug = '' OR slug IS NULL;

-- RLS を有効化
ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;

-- anon がカウント取得のため SELECT できるポリシー
DROP POLICY IF EXISTS "anon can select note_likes" ON note_likes;
CREATE POLICY "anon can select note_likes"
  ON note_likes FOR SELECT
  TO anon
  USING (true);

-- anon がいいね登録のため INSERT できるポリシー
DROP POLICY IF EXISTS "anon can insert note_likes" ON note_likes;
CREATE POLICY "anon can insert note_likes"
  ON note_likes FOR INSERT
  TO anon
  WITH CHECK (slug <> '');
