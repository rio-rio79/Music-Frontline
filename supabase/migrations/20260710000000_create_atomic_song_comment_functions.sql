-- 楽曲コメントの投稿・削除とランキングポイント同期を
-- 同一トランザクションで実行する公開RPCを作成する。

CREATE FUNCTION public.create_song_comment_with_points(
    p_song_id uuid,
    p_body text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_body text := pg_catalog.btrim(p_body);
    v_comment_id uuid;
    v_created_at timestamptz;
    v_author_name text;
    v_point_sync jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF v_body IS NULL OR v_body = '' THEN
        RAISE EXCEPTION 'Comment body is required'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.songs
        WHERE songs.id = p_song_id
    ) THEN
        RAISE EXCEPTION 'Song not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    INSERT INTO public.song_comments (
        song_id,
        user_id,
        body
    )
    VALUES (
        p_song_id,
        v_user_id,
        v_body
    )
    RETURNING
        song_comments.id,
        song_comments.created_at
    INTO
        v_comment_id,
        v_created_at;

    v_point_sync := public.sync_song_comment_points(p_song_id);

    SELECT profiles.name
    INTO v_author_name
    FROM public.profiles
    WHERE profiles.id = v_user_id;

    RETURN pg_catalog.jsonb_build_object(
        'comment_id', v_comment_id,
        'body', v_body,
        'created_at', v_created_at,
        'user_id', v_user_id,
        'author_name', COALESCE(v_author_name, 'ユーザー'),
        'point_sync', v_point_sync
    );
END;
$$;

COMMENT ON FUNCTION public.create_song_comment_with_points(uuid, text) IS
    '楽曲コメント投稿とランキングポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.create_song_comment_with_points(uuid, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_song_comment_with_points(uuid, text)
TO authenticated;

CREATE FUNCTION public.delete_song_comment_with_points(
    p_song_id uuid,
    p_comment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_deleted_id uuid;
    v_point_sync jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    DELETE FROM public.song_comments
    WHERE song_comments.id = p_comment_id
      AND song_comments.song_id = p_song_id
      AND song_comments.user_id = v_user_id
    RETURNING song_comments.id
    INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found or permission denied'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    v_point_sync := public.sync_song_comment_points(p_song_id);

    RETURN pg_catalog.jsonb_build_object(
        'comment_id', v_deleted_id,
        'point_sync', v_point_sync
    );
END;
$$;

COMMENT ON FUNCTION public.delete_song_comment_with_points(uuid, uuid) IS
    '本人の楽曲コメント削除とランキングポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.delete_song_comment_with_points(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_song_comment_with_points(uuid, uuid)
TO authenticated;
