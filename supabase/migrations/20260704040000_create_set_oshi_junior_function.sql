-- 推し登録、未フォロー時の自動フォロー、当月ポイント同期を
-- 同一トランザクションで実行する公開RPC。
CREATE FUNCTION public.set_oshi_junior(p_junior_id uuid)
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
    v_updated_profiles integer;
    v_created_follows integer;
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

    UPDATE public.profiles
    SET
        oshi_junior_id = p_junior_id,
        updated_at = pg_catalog.now()
    WHERE id = v_user_id;

    GET DIAGNOSTICS v_updated_profiles = ROW_COUNT;

    IF v_updated_profiles <> 1 THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    INSERT INTO public.follow_juniors (user_id, junior_id)
    VALUES (v_user_id, p_junior_id)
    ON CONFLICT (user_id, junior_id) DO NOTHING;

    GET DIAGNOSTICS v_created_follows = ROW_COUNT;

    v_sync_result := private.sync_oshi_points(
        v_user_id,
        v_period_key
    );

    RETURN pg_catalog.jsonb_build_object(
        'registered', true,
        'oshi_junior_id', p_junior_id,
        'follow_created', v_created_follows = 1,
        'point_sync', v_sync_result
    );
END;
$$;

COMMENT ON FUNCTION public.set_oshi_junior(uuid) IS
    'ログインユーザーの推し登録、自動フォロー、当月ポイント同期を一括実行する';

REVOKE ALL ON FUNCTION public.set_oshi_junior(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_oshi_junior(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_oshi_junior(uuid) TO authenticated;
