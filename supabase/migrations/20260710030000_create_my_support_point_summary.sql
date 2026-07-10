-- マイページ用に、ログインユーザー本人の応援ポイント集計を返すRPCを作成する。

CREATE OR REPLACE FUNCTION public.get_my_support_point_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_oshi_junior_id uuid;
    v_oshi_name text;
    v_all_breakdown jsonb;
    v_oshi_breakdown jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    SELECT
        profiles.oshi_junior_id,
        juniors.name
    INTO
        v_oshi_junior_id,
        v_oshi_name
    FROM public.profiles
    LEFT JOIN public.juniors
        ON juniors.id = profiles.oshi_junior_id
    WHERE profiles.id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    WITH category_totals AS (
        SELECT
            CASE
                WHEN support_point_logs.action_type IN ('play', 'blog_view') THEN 'watch'
                WHEN support_point_logs.action_type = 'like' THEN 'like'
                WHEN support_point_logs.action_type = 'comment' THEN 'comment'
                WHEN support_point_logs.action_type = 'payment' THEN 'fanLetter'
                WHEN support_point_logs.action_type IN ('oshi', 'follow') THEN 'continued'
                ELSE NULL
            END AS category_key,
            COALESCE(SUM(support_point_logs.points), 0)::integer AS points
        FROM public.support_point_logs
        WHERE support_point_logs.user_id = v_user_id
        GROUP BY category_key
    )
    SELECT pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('key', 'watch', 'label', '見る・聴く', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'watch'), 0), 'color', '#6ec3ff'),
        pg_catalog.jsonb_build_object('key', 'like', 'label', 'いいね', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'like'), 0), 'color', '#ffd66e'),
        pg_catalog.jsonb_build_object('key', 'comment', 'label', 'コメント', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'comment'), 0), 'color', '#8ee69b'),
        pg_catalog.jsonb_build_object('key', 'fanLetter', 'label', 'ファンレター', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'fanLetter'), 0), 'color', '#b58cff'),
        pg_catalog.jsonb_build_object('key', 'continued', 'label', '継続応援', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'continued'), 0), 'color', '#ff9f7a')
    )
    INTO v_all_breakdown
    FROM category_totals;

    WITH category_totals AS (
        SELECT
            CASE
                WHEN support_point_logs.action_type IN ('play', 'blog_view') THEN 'watch'
                WHEN support_point_logs.action_type = 'like' THEN 'like'
                WHEN support_point_logs.action_type = 'comment' THEN 'comment'
                WHEN support_point_logs.action_type = 'payment' THEN 'fanLetter'
                WHEN support_point_logs.action_type IN ('oshi', 'follow') THEN 'continued'
                ELSE NULL
            END AS category_key,
            COALESCE(SUM(support_point_logs.points), 0)::integer AS points
        FROM public.support_point_logs
        WHERE support_point_logs.user_id = v_user_id
          AND support_point_logs.junior_id = v_oshi_junior_id
        GROUP BY category_key
    )
    SELECT pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('key', 'watch', 'label', '見る・聴く', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'watch'), 0), 'color', '#6ec3ff'),
        pg_catalog.jsonb_build_object('key', 'like', 'label', 'いいね', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'like'), 0), 'color', '#ffd66e'),
        pg_catalog.jsonb_build_object('key', 'comment', 'label', 'コメント', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'comment'), 0), 'color', '#8ee69b'),
        pg_catalog.jsonb_build_object('key', 'fanLetter', 'label', 'ファンレター', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'fanLetter'), 0), 'color', '#b58cff'),
        pg_catalog.jsonb_build_object('key', 'continued', 'label', '継続応援', 'value', COALESCE(SUM(points) FILTER (WHERE category_key = 'continued'), 0), 'color', '#ff9f7a')
    )
    INTO v_oshi_breakdown
    FROM category_totals;

    RETURN pg_catalog.jsonb_build_object(
        'oshiJuniorId', v_oshi_junior_id,
        'oshiName', v_oshi_name,
        'summaries', pg_catalog.jsonb_build_array(
            pg_catalog.jsonb_build_object(
                'key', 'oshi',
                'label', '推し',
                'targetLabel', COALESCE(v_oshi_name, '推し'),
                'breakdown', v_oshi_breakdown
            ),
            pg_catalog.jsonb_build_object(
                'key', 'all',
                'label', 'すべて',
                'targetLabel', 'すべて',
                'breakdown', v_all_breakdown
            )
        )
    );
END;
$$;

COMMENT ON FUNCTION public.get_my_support_point_summary() IS
    'ログインユーザー本人のマイページ用応援ポイント集計を返す';

REVOKE ALL ON FUNCTION public.get_my_support_point_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_support_point_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_support_point_summary() TO authenticated;
