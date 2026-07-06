-- ログインユーザーのジュニアフォロー登録・解除、およびポイント同期を行うRPC。
CREATE FUNCTION public.toggle_follow_junior(p_junior_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_period_key date := pg_catalog.date_trunc(
        'month',
        pg_catalog.now() AT TIME ZONE 'Asia/Tokyo'
    )::date;
    v_is_following boolean;
    v_sync_result jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_junior_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.juniors
        WHERE juniors.id = p_junior_id
    ) THEN
        RAISE EXCEPTION 'Junior not found';
    END IF;

    -- 現在フォローしているか確認
    SELECT EXISTS (
        SELECT 1
        FROM public.follow_juniors
        WHERE follow_juniors.user_id = v_user_id
          AND follow_juniors.junior_id = p_junior_id
    ) INTO v_is_following;

    IF v_is_following THEN
        -- フォロー解除
        DELETE FROM public.follow_juniors
        WHERE user_id = v_user_id
          AND junior_id = p_junior_id;

        -- ポイント同期
        v_sync_result := private.sync_follow_points(
            v_user_id,
            p_junior_id,
            v_period_key
        );

        RETURN pg_catalog.jsonb_build_object(
            'followed', false,
            'point_sync', v_sync_result
        );
    ELSE
        -- フォロー登録
        INSERT INTO public.follow_juniors (user_id, junior_id)
        VALUES (v_user_id, p_junior_id)
        ON CONFLICT (user_id, junior_id) DO NOTHING;

        -- ポイント同期
        v_sync_result := private.sync_follow_points(
            v_user_id,
            p_junior_id,
            v_period_key
        );

        RETURN pg_catalog.jsonb_build_object(
            'followed', true,
            'point_sync', v_sync_result
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION public.toggle_follow_junior(uuid) IS
    'ログインユーザーの指定ジュニアへのフォロー登録・解除をトグルし、当月のポイントを同期する';

REVOKE ALL ON FUNCTION public.toggle_follow_junior(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_follow_junior(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_follow_junior(uuid) TO authenticated;
