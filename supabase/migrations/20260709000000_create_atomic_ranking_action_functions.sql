-- いいね、ブログ閲覧、ブログコメントの操作とランキングポイント同期を
-- 同一トランザクションで実行する公開RPCを作成する。

-- ブログの有料プラン限定操作に共通する認可チェック。
CREATE FUNCTION private.require_paid_blog_access(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        JOIN public.plans
            ON plans.id = profiles.plan_id
        WHERE profiles.id = p_user_id
          AND plans.monthly_price > 0
    ) THEN
        RAISE EXCEPTION 'Paid plan required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
END;
$$;

COMMENT ON FUNCTION private.require_paid_blog_access(uuid) IS
    'ブログの有料プラン限定操作を実行できるユーザーか検証する';

REVOKE ALL ON FUNCTION private.require_paid_blog_access(uuid)
FROM PUBLIC, anon, authenticated;

-- 楽曲いいねの登録・解除とポイント同期を一括実行する。
CREATE FUNCTION public.toggle_song_like_with_points(p_song_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_like_id uuid;
    v_liked boolean;
    v_point_sync jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.songs
        WHERE songs.id = p_song_id
    ) THEN
        RAISE EXCEPTION 'Song not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Profile not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'song_like:' || v_user_id::text || ':' || p_song_id::text,
            0
        )
    );

    SELECT song_likes.id
    INTO v_like_id
    FROM public.song_likes
    WHERE song_likes.user_id = v_user_id
      AND song_likes.song_id = p_song_id;

    IF FOUND THEN
        DELETE FROM public.song_likes
        WHERE song_likes.id = v_like_id
          AND song_likes.user_id = v_user_id;

        v_liked := false;
    ELSE
        INSERT INTO public.song_likes (user_id, song_id)
        VALUES (v_user_id, p_song_id);

        v_liked := true;
    END IF;

    v_point_sync := public.sync_song_like_points(p_song_id);

    RETURN pg_catalog.jsonb_build_object(
        'liked', v_liked,
        'point_sync', v_point_sync
    );
END;
$$;

COMMENT ON FUNCTION public.toggle_song_like_with_points(uuid) IS
    '楽曲いいねの登録・解除とランキングポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.toggle_song_like_with_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_song_like_with_points(uuid) TO authenticated;

-- ブログいいねの登録・解除とポイント同期を一括実行する。
CREATE FUNCTION public.toggle_blog_like_with_points(p_blog_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_like_id uuid;
    v_liked boolean;
    v_like_count bigint;
    v_point_sync jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.blog_posts
        WHERE blog_posts.id = p_blog_post_id
    ) THEN
        RAISE EXCEPTION 'Blog post not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    PERFORM private.require_paid_blog_access(v_user_id);

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'blog_like:' || v_user_id::text || ':' || p_blog_post_id::text,
            0
        )
    );

    SELECT blog_likes.id
    INTO v_like_id
    FROM public.blog_likes
    WHERE blog_likes.user_id = v_user_id
      AND blog_likes.blog_posts_id = p_blog_post_id;

    IF FOUND THEN
        DELETE FROM public.blog_likes
        WHERE blog_likes.id = v_like_id
          AND blog_likes.user_id = v_user_id;

        v_liked := false;
    ELSE
        INSERT INTO public.blog_likes (user_id, blog_posts_id)
        VALUES (v_user_id, p_blog_post_id);

        v_liked := true;
    END IF;

    v_point_sync := public.sync_blog_like_points(p_blog_post_id);

    SELECT COUNT(*)
    INTO v_like_count
    FROM public.blog_likes
    WHERE blog_likes.blog_posts_id = p_blog_post_id;

    RETURN pg_catalog.jsonb_build_object(
        'liked', v_liked,
        'like_count', v_like_count,
        'point_sync', v_point_sync
    );
END;
$$;

COMMENT ON FUNCTION public.toggle_blog_like_with_points(uuid) IS
    'ブログいいねの登録・解除とランキングポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.toggle_blog_like_with_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_blog_like_with_points(uuid) TO authenticated;

-- ブログ閲覧数加算と、日次上限を考慮したポイント付与を一括実行する。
CREATE FUNCTION public.record_blog_view_with_points(p_blog_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_view_count integer;
    v_point_result jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.blog_posts
        WHERE blog_posts.id = p_blog_post_id
    ) THEN
        RAISE EXCEPTION 'Blog post not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    PERFORM private.require_paid_blog_access(v_user_id);
    UPDATE public.blog_posts AS target_post
    SET view_count = target_post.view_count + 1
    WHERE target_post.id = p_blog_post_id
    RETURNING target_post.view_count INTO v_view_count;

    v_point_result := public.award_blog_view_points(p_blog_post_id);

    RETURN pg_catalog.jsonb_build_object(
        'view_count', v_view_count,
        'point_result', v_point_result
    );
END;
$$;

COMMENT ON FUNCTION public.record_blog_view_with_points(uuid) IS
    'ブログ閲覧数加算とランキングポイント付与を一括実行する';

REVOKE ALL ON FUNCTION public.record_blog_view_with_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_blog_view_with_points(uuid) TO authenticated;

-- ブログコメント投稿とポイント同期を一括実行する。
CREATE FUNCTION public.create_blog_comment_with_points(
    p_blog_post_id uuid,
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
    v_comment_count bigint;
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

    IF pg_catalog.char_length(v_body) > 300 THEN
        RAISE EXCEPTION 'Comment must be 300 characters or fewer'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.blog_posts
        WHERE blog_posts.id = p_blog_post_id
    ) THEN
        RAISE EXCEPTION 'Blog post not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    PERFORM private.require_paid_blog_access(v_user_id);

    INSERT INTO public.blog_comments (
        blog_posts_id,
        user_id,
        body
    )
    VALUES (
        p_blog_post_id,
        v_user_id,
        v_body
    )
    RETURNING
        blog_comments.id,
        blog_comments.created_at
    INTO
        v_comment_id,
        v_created_at;

    v_point_sync := public.sync_blog_comment_points(p_blog_post_id);

    SELECT profiles.name
    INTO v_author_name
    FROM public.profiles
    WHERE profiles.id = v_user_id;

    SELECT COUNT(*)
    INTO v_comment_count
    FROM public.blog_comments
    WHERE blog_comments.blog_posts_id = p_blog_post_id;

    RETURN pg_catalog.jsonb_build_object(
        'comment_id', v_comment_id,
        'body', v_body,
        'created_at', v_created_at,
        'author_name', COALESCE(v_author_name, 'あなた'),
        'comment_count', v_comment_count,
        'point_sync', v_point_sync
    );
END;
$$;

COMMENT ON FUNCTION public.create_blog_comment_with_points(uuid, text) IS
    'ブログコメント投稿とランキングポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.create_blog_comment_with_points(uuid, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_blog_comment_with_points(uuid, text)
TO authenticated;

-- 本人のブログコメント削除とポイント同期を一括実行する。
CREATE FUNCTION public.delete_blog_comment_with_points(
    p_blog_post_id uuid,
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
    v_comment_count bigint;
    v_point_sync jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    DELETE FROM public.blog_comments
    WHERE blog_comments.id = p_comment_id
      AND blog_comments.blog_posts_id = p_blog_post_id
      AND blog_comments.user_id = v_user_id
    RETURNING blog_comments.id
    INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found or permission denied'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    v_point_sync := public.sync_blog_comment_points(p_blog_post_id);

    SELECT COUNT(*)
    INTO v_comment_count
    FROM public.blog_comments
    WHERE blog_comments.blog_posts_id = p_blog_post_id;

    RETURN pg_catalog.jsonb_build_object(
        'comment_id', v_deleted_id,
        'comment_count', v_comment_count,
        'point_sync', v_point_sync
    );
END;
$$;

COMMENT ON FUNCTION public.delete_blog_comment_with_points(uuid, uuid) IS
    '本人のブログコメント削除とランキングポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.delete_blog_comment_with_points(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_blog_comment_with_points(uuid, uuid)
TO authenticated;
