-- note_likes を「1記事=1レコード（like_count）」へ移行する
-- 旧仕様（1いいね=1レコード）は note_like_events に退避して保持する

-- 1) 既存 note_likes を退避（すでに退避済みならスキップ）
DO $$
BEGIN
  IF to_regclass('public.note_like_events') IS NULL AND to_regclass('public.note_likes') IS NOT NULL THEN
    ALTER TABLE public.note_likes RENAME TO note_like_events;
  END IF;
END $$;

-- 2) 新しい note_likes（カウント保持）を作成
CREATE TABLE IF NOT EXISTS public.note_likes (
  slug        text        PRIMARY KEY,
  like_count  bigint      NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3) 旧イベントから集計して初期値を投入（再実行しても同じ結果になる）
INSERT INTO public.note_likes (slug, like_count, updated_at)
SELECT
  e.slug,
  COUNT(*)::bigint AS like_count,
  now() AS updated_at
FROM public.note_like_events e
WHERE e.slug <> '' AND e.slug IS NOT NULL
GROUP BY e.slug
ON CONFLICT (slug)
DO UPDATE SET
  like_count = EXCLUDED.like_count,
  updated_at = EXCLUDED.updated_at;

-- 4) RLS
ALTER TABLE public.note_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can select note_likes" ON public.note_likes;
CREATE POLICY "anon can select note_likes"
  ON public.note_likes FOR SELECT
  TO anon
  USING (true);

-- 5) いいね増減用 RPC（PostgREST /rpc）
-- anon から直接 UPDATE を許可すると like_count を任意に書き換えられるため、関数経由にする
CREATE OR REPLACE FUNCTION public.note_like(slug text, delta integer)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d integer;
  new_count bigint;
BEGIN
  IF slug IS NULL OR slug = '' THEN
    RAISE EXCEPTION 'slug must not be empty';
  END IF;

  -- クライアントからの過大な delta を防ぐ（+1 / -1 / 0 のみ）
  d := CASE
    WHEN delta > 0 THEN 1
    WHEN delta < 0 THEN -1
    ELSE 0
  END;

  INSERT INTO public.note_likes (slug, like_count, updated_at)
  VALUES (slug, GREATEST(0, d)::bigint, now())
  ON CONFLICT (slug)
  DO UPDATE SET
    like_count = GREATEST(0, public.note_likes.like_count + d),
    updated_at = now()
  RETURNING like_count INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.note_like(text, integer) TO anon;

