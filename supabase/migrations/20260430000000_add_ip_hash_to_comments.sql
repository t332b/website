ALTER TABLE note_comments ADD COLUMN IF NOT EXISTS ip_hash text;

-- レート制限クエリ用インデックス
CREATE INDEX IF NOT EXISTS note_comments_ip_hash_created_at_idx
  ON note_comments (ip_hash, created_at);
