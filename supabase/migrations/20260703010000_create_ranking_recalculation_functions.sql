-- ランキングスコアの内部再集計関数を作成する。

-- 指定したジュニアのポイントログを再集計し、現在のランキングスコアへ反映する。
CREATE FUNCTION private.recalculate_ranking_score(p_junior_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_category text;
    v_play_points bigint;
    v_blog_view_points bigint;
    v_like_points bigint;
    v_comment_points bigint;
    v_follow_points bigint;
    v_oshi_points bigint;
    v_payment_points bigint;
    v_score bigint;
BEGIN
    SELECT
        CASE
            WHEN juniors.group_id IS NULL THEN 'independent'
            ELSE 'group_affiliated'
        END
    INTO v_category
    FROM public.juniors
    WHERE juniors.id = p_junior_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Junior % does not exist', p_junior_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT
        COALESCE(SUM(points) FILTER (WHERE action_type = 'play'), 0),
        COALESCE(SUM(points) FILTER (WHERE action_type = 'blog_view'), 0),
        COALESCE(SUM(points) FILTER (WHERE action_type = 'like'), 0),
        COALESCE(SUM(points) FILTER (WHERE action_type = 'comment'), 0),
        COALESCE(SUM(points) FILTER (WHERE action_type = 'follow'), 0),
        COALESCE(SUM(points) FILTER (WHERE action_type = 'oshi'), 0),
        COALESCE(SUM(points) FILTER (WHERE action_type = 'payment'), 0)
    INTO
        v_play_points,
        v_blog_view_points,
        v_like_points,
        v_comment_points,
        v_follow_points,
        v_oshi_points,
        v_payment_points
    FROM public.support_point_logs
    WHERE junior_id = p_junior_id;

    v_score :=
        v_play_points
        + v_blog_view_points
        + v_like_points
        + v_comment_points
        + v_follow_points
        + v_oshi_points
        + v_payment_points;

    INSERT INTO public.ranking_scores (
        junior_id,
        category,
        play_points,
        blog_view_points,
        like_points,
        comment_points,
        follow_points,
        oshi_points,
        payment_points,
        score,
        calculated_at,
        updated_at
    )
    VALUES (
        p_junior_id,
        v_category,
        v_play_points,
        v_blog_view_points,
        v_like_points,
        v_comment_points,
        v_follow_points,
        v_oshi_points,
        v_payment_points,
        v_score,
        now(),
        now()
    )
    ON CONFLICT (junior_id)
    DO UPDATE SET
        category = EXCLUDED.category,
        play_points = EXCLUDED.play_points,
        blog_view_points = EXCLUDED.blog_view_points,
        like_points = EXCLUDED.like_points,
        comment_points = EXCLUDED.comment_points,
        follow_points = EXCLUDED.follow_points,
        oshi_points = EXCLUDED.oshi_points,
        payment_points = EXCLUDED.payment_points,
        score = EXCLUDED.score,
        calculated_at = EXCLUDED.calculated_at,
        updated_at = EXCLUDED.updated_at;
END;
$$;

COMMENT ON FUNCTION private.recalculate_ranking_score(uuid) IS
    '指定したジュニアのポイントログを集計し、現在のランキングスコアを更新する';

-- 全ジュニアを再集計する。データ修復や全件再計算時だけ使用する。
CREATE FUNCTION private.recalculate_all_ranking_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_junior_id uuid;
BEGIN
    FOR v_junior_id IN
        SELECT juniors.id
        FROM public.juniors
    LOOP
        PERFORM private.recalculate_ranking_score(v_junior_id);
    END LOOP;
END;
$$;

COMMENT ON FUNCTION private.recalculate_all_ranking_scores() IS
    '全ジュニアのポイントログを再集計し、現在のランキングスコアを更新する';

-- 内部関数は一般ユーザーやData APIから直接実行させない。
REVOKE ALL ON FUNCTION private.recalculate_ranking_score(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_ranking_score(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION private.recalculate_all_ranking_scores() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.recalculate_all_ranking_scores() FROM anon, authenticated;
