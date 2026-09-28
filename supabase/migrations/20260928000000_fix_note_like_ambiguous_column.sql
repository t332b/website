-- note_like(slug, delta) が「column reference "slug" is ambiguous」で常に失敗する不具合を修正
-- 原因: 関数引数 slug がテーブル note_likes のカラム slug と同名のため、
--       INSERT ... VALUES (slug, ...) の slug がPL/pgSQL変数かカラムか解決できなかった。
-- 対応: 引数名・シグネチャ（PostgREST/クライアントからの呼び出し互換性のため）はそのままに、
--       関数内部でのみ別名のローカル変数に詰め替えて曖昧さを解消する。

CREATE OR REPLACE FUNCTION public.note_like(slug text, delta integer)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text := slug;
  d integer;
  new_count bigint;
BEGIN
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'slug must not be empty';
  END IF;

  -- クライアントからの過大な delta を防ぐ（+1 / -1 / 0 のみ）
  d := CASE
    WHEN delta > 0 THEN 1
    WHEN delta < 0 THEN -1
    ELSE 0
  END;

  INSERT INTO public.note_likes (slug, like_count, updated_at)
  VALUES (v_slug, GREATEST(0, d)::bigint, now())
  ON CONFLICT (slug)
  DO UPDATE SET
    like_count = GREATEST(0, public.note_likes.like_count + d),
    updated_at = now()
  RETURNING like_count INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.note_like(text, integer) TO anon;
