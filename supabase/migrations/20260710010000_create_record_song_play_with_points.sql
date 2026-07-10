-- 楽曲再生回数加算とランキングポイント付与を
-- 同一トランザクションで実行する公開RPCを作成する。

CREATE FUNCTION public.record_song_play_with_points(p_song_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_play_count integer;
    v_point_result jsonb;
BEGIN
    UPDATE public.songs AS target_song
    SET play_count = target_song.play_count + 1
    WHERE target_song.id = p_song_id
    RETURNING target_song.play_count
    INTO v_play_count;

    IF v_play_count IS NULL THEN
        RAISE EXCEPTION 'Song not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'play_count', v_play_count,
            'play_count_incremented', true,
            'points_awarded', false,
            'reason', 'guest_user',
            'points', pg_catalog.jsonb_build_object(
                'points_awarded', false,
                'reason', 'guest'
            )
        );
    END IF;

    v_point_result := public.award_song_play_points(p_song_id);

    RETURN pg_catalog.jsonb_build_object(
        'play_count', v_play_count,
        'play_count_incremented', true,
        'points_awarded', COALESCE((v_point_result ->> 'points_awarded')::boolean, false),
        'reason', v_point_result ->> 'reason',
        'points', v_point_result
    );
END;
$$;

COMMENT ON FUNCTION public.record_song_play_with_points(uuid) IS
    '成立済みの楽曲再生について、再生回数加算とログインユーザーのランキングポイント付与を一括実行する';

REVOKE ALL ON FUNCTION public.record_song_play_with_points(uuid)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_song_play_with_points(uuid)
TO anon, authenticated;
