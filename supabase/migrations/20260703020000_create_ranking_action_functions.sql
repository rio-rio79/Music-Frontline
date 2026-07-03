-- 再生、閲覧、いいね、コメントのランキングポイント関数を作成する。

-- 成立済みの楽曲再生に対して、ランキングポイントだけを付与する公開RPC。
-- 再生時間の判定とsongs.play_countの更新は、この関数の責務に含めない。
CREATE FUNCTION public.award_song_play_points(p_song_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_oshi_junior_id uuid;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_rule record;
    v_period_key date := (pg_catalog.now() AT TIME ZONE 'Asia/Tokyo')::date;
    v_event_id uuid := pg_catalog.gen_random_uuid();
    v_play_count integer := 0;
    v_junior_id uuid;
    v_applied_oshi_multiplier numeric(4, 2);
    v_points integer;
    v_affected_juniors integer := 0;
    v_total_points integer := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'guest'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.songs
        WHERE songs.id = p_song_id
    ) THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'song_not_found'
        );
    END IF;

    SELECT
        ranking_point_rules.base_points,
        ranking_point_rules.apply_plan_multiplier,
        ranking_point_rules.oshi_multiplier,
        ranking_point_rules.limit_count
    INTO v_rule
    FROM public.ranking_point_rules
    WHERE ranking_point_rules.action_type = 'play'
      AND ranking_point_rules.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active ranking rule for play was not found';
    END IF;

    SELECT
        profiles.oshi_junior_id,
        CASE
            WHEN v_rule.apply_plan_multiplier
                THEN COALESCE(plans.point_multiplier, 1.00)
            ELSE 1.00
        END
    INTO
        v_oshi_junior_id,
        v_plan_multiplier
    FROM public.profiles
    LEFT JOIN public.plans
        ON plans.id = profiles.plan_id
    WHERE profiles.id = v_user_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'profile_not_found'
        );
    END IF;

    -- 同じユーザー・楽曲・日付の同時実行を直列化し、20回を超える付与を防ぐ。
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            v_user_id::text || ':' || p_song_id::text || ':' || v_period_key::text,
            0
        )
    );

    SELECT COUNT(DISTINCT support_point_logs.event_id)
    INTO v_play_count
    FROM public.support_point_logs
    WHERE support_point_logs.user_id = v_user_id
      AND support_point_logs.action_type = 'play'
      AND support_point_logs.source_type = 'song'
      AND support_point_logs.source_id = p_song_id
      AND support_point_logs.period_key = v_period_key;

    IF v_rule.limit_count IS NOT NULL AND v_play_count >= v_rule.limit_count THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'daily_limit_reached',
            'awarded_play_count', v_play_count
        );
    END IF;

    FOR v_junior_id IN
        SELECT DISTINCT song_juniors.junior_id
        FROM public.song_juniors
        WHERE song_juniors.song_id = p_song_id
    LOOP
        v_applied_oshi_multiplier :=
            CASE
                WHEN v_junior_id = v_oshi_junior_id THEN v_rule.oshi_multiplier
                ELSE 1.00
            END;

        v_points := pg_catalog.round(
            v_rule.base_points
            * v_plan_multiplier
            * v_applied_oshi_multiplier
        )::integer;

        INSERT INTO public.support_point_logs (
            user_id,
            junior_id,
            action_type,
            source_type,
            source_id,
            points,
            event_id,
            period_key,
            base_points,
            plan_multiplier,
            oshi_multiplier
        )
        VALUES (
            v_user_id,
            v_junior_id,
            'play',
            'song',
            p_song_id,
            v_points,
            v_event_id,
            v_period_key,
            v_rule.base_points,
            v_plan_multiplier,
            v_applied_oshi_multiplier
        );

        PERFORM private.recalculate_ranking_score(v_junior_id);

        v_affected_juniors := v_affected_juniors + 1;
        v_total_points := v_total_points + v_points;
    END LOOP;

    IF v_affected_juniors = 0 THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'song_has_no_juniors'
        );
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'points_awarded', true,
        'reason', null,
        'event_id', v_event_id,
        'awarded_play_count', v_play_count + 1,
        'affected_juniors', v_affected_juniors,
        'total_points', v_total_points
    );
END;
$$;

COMMENT ON FUNCTION public.award_song_play_points(uuid) IS
    '成立済みの楽曲再生について、ログインユーザーのランキングポイントだけを付与する';

REVOKE ALL ON FUNCTION public.award_song_play_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_song_play_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_song_play_points(uuid) TO authenticated;

-- 本文表示に成功したブログ閲覧に対して、ランキングポイントだけを付与する公開RPC。
-- 本文の権限制御とblog_posts.view_countの更新は、この関数の責務に含めない。
CREATE FUNCTION public.award_blog_view_points(p_blog_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_blog_junior_id uuid;
    v_oshi_junior_id uuid;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_monthly_price integer;
    v_rule record;
    v_period_key date := (pg_catalog.now() AT TIME ZONE 'Asia/Tokyo')::date;
    v_event_id uuid := pg_catalog.gen_random_uuid();
    v_view_count integer := 0;
    v_applied_oshi_multiplier numeric(4, 2);
    v_points integer;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'guest'
        );
    END IF;

    SELECT blog_posts.junior_id
    INTO v_blog_junior_id
    FROM public.blog_posts
    WHERE blog_posts.id = p_blog_post_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'blog_post_not_found'
        );
    END IF;

    SELECT
        ranking_point_rules.base_points,
        ranking_point_rules.apply_plan_multiplier,
        ranking_point_rules.oshi_multiplier,
        ranking_point_rules.limit_count
    INTO v_rule
    FROM public.ranking_point_rules
    WHERE ranking_point_rules.action_type = 'blog_view'
      AND ranking_point_rules.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active ranking rule for blog_view was not found';
    END IF;

    SELECT
        profiles.oshi_junior_id,
        plans.monthly_price,
        CASE
            WHEN v_rule.apply_plan_multiplier THEN plans.point_multiplier
            ELSE 1.00
        END
    INTO
        v_oshi_junior_id,
        v_monthly_price,
        v_plan_multiplier
    FROM public.profiles
    JOIN public.plans
        ON plans.id = profiles.plan_id
    WHERE profiles.id = v_user_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'profile_or_plan_not_found'
        );
    END IF;

    IF v_monthly_price <= 0 THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'paid_plan_required'
        );
    END IF;

    -- 同じユーザー・記事・日付の同時実行を直列化し、1日1回を超える付与を防ぐ。
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            v_user_id::text || ':' || p_blog_post_id::text || ':' || v_period_key::text,
            0
        )
    );

    SELECT COUNT(DISTINCT support_point_logs.event_id)
    INTO v_view_count
    FROM public.support_point_logs
    WHERE support_point_logs.user_id = v_user_id
      AND support_point_logs.action_type = 'blog_view'
      AND support_point_logs.source_type = 'blog_post'
      AND support_point_logs.source_id = p_blog_post_id
      AND support_point_logs.period_key = v_period_key;

    IF v_rule.limit_count IS NOT NULL AND v_view_count >= v_rule.limit_count THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_awarded', false,
            'reason', 'daily_limit_reached'
        );
    END IF;

    v_applied_oshi_multiplier :=
        CASE
            WHEN v_blog_junior_id = v_oshi_junior_id THEN v_rule.oshi_multiplier
            ELSE 1.00
        END;

    v_points := pg_catalog.round(
        v_rule.base_points
        * v_plan_multiplier
        * v_applied_oshi_multiplier
    )::integer;

    INSERT INTO public.support_point_logs (
        user_id,
        junior_id,
        action_type,
        source_type,
        source_id,
        points,
        event_id,
        period_key,
        base_points,
        plan_multiplier,
        oshi_multiplier
    )
    VALUES (
        v_user_id,
        v_blog_junior_id,
        'blog_view',
        'blog_post',
        p_blog_post_id,
        v_points,
        v_event_id,
        v_period_key,
        v_rule.base_points,
        v_plan_multiplier,
        v_applied_oshi_multiplier
    );

    PERFORM private.recalculate_ranking_score(v_blog_junior_id);

    RETURN pg_catalog.jsonb_build_object(
        'points_awarded', true,
        'reason', null,
        'event_id', v_event_id,
        'junior_id', v_blog_junior_id,
        'points', v_points
    );
END;
$$;

COMMENT ON FUNCTION public.award_blog_view_points(uuid) IS
    '本文表示に成功した有料プランユーザーのブログ閲覧へランキングポイントを付与する';

REVOKE ALL ON FUNCTION public.award_blog_view_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_blog_view_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_blog_view_points(uuid) TO authenticated;

-- 楽曲いいねの現在状態へランキングポイントを同期する公開RPC。
-- song_likes自体の追加・削除は、この関数の責務に含めない。
CREATE FUNCTION public.sync_song_like_points(p_song_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_liked boolean;
    v_has_active_points boolean;
    v_oshi_junior_id uuid;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_rule record;
    v_event_id uuid := pg_catalog.gen_random_uuid();
    v_junior_id uuid;
    v_applied_oshi_multiplier numeric(4, 2);
    v_points integer;
    v_affected_juniors integer := 0;
    v_original_log public.support_point_logs%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'guest'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.songs
        WHERE songs.id = p_song_id
    ) THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'song_not_found'
        );
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'song_like:' || v_user_id::text || ':' || p_song_id::text,
            0
        )
    );

    SELECT EXISTS (
        SELECT 1
        FROM public.song_likes
        WHERE song_likes.user_id = v_user_id
          AND song_likes.song_id = p_song_id
    )
    INTO v_is_liked;

    SELECT EXISTS (
        SELECT 1
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = v_user_id
          AND original_log.action_type = 'like'
          AND original_log.source_type = 'song'
          AND original_log.source_id = p_song_id
          AND original_log.points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
    )
    INTO v_has_active_points;

    IF v_is_liked = v_has_active_points THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'already_synchronized',
            'liked', v_is_liked
        );
    END IF;

    IF v_is_liked THEN
        SELECT
            ranking_point_rules.base_points,
            ranking_point_rules.apply_plan_multiplier,
            ranking_point_rules.oshi_multiplier
        INTO v_rule
        FROM public.ranking_point_rules
        WHERE ranking_point_rules.action_type = 'like'
          AND ranking_point_rules.is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Active ranking rule for like was not found';
        END IF;

        SELECT
            profiles.oshi_junior_id,
            CASE
                WHEN v_rule.apply_plan_multiplier
                    THEN COALESCE(plans.point_multiplier, 1.00)
                ELSE 1.00
            END
        INTO
            v_oshi_junior_id,
            v_plan_multiplier
        FROM public.profiles
        LEFT JOIN public.plans
            ON plans.id = profiles.plan_id
        WHERE profiles.id = v_user_id;

        IF NOT FOUND THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'profile_not_found'
            );
        END IF;

        FOR v_junior_id IN
            SELECT DISTINCT song_juniors.junior_id
            FROM public.song_juniors
            WHERE song_juniors.song_id = p_song_id
        LOOP
            v_applied_oshi_multiplier :=
                CASE
                    WHEN v_junior_id = v_oshi_junior_id THEN v_rule.oshi_multiplier
                    ELSE 1.00
                END;

            v_points := pg_catalog.round(
                v_rule.base_points
                * v_plan_multiplier
                * v_applied_oshi_multiplier
            )::integer;

            INSERT INTO public.support_point_logs (
                user_id,
                junior_id,
                action_type,
                source_type,
                source_id,
                points,
                event_id,
                base_points,
                plan_multiplier,
                oshi_multiplier
            )
            VALUES (
                v_user_id,
                v_junior_id,
                'like',
                'song',
                p_song_id,
                v_points,
                v_event_id,
                v_rule.base_points,
                v_plan_multiplier,
                v_applied_oshi_multiplier
            );

            PERFORM private.recalculate_ranking_score(v_junior_id);
            v_affected_juniors := v_affected_juniors + 1;
        END LOOP;

        IF v_affected_juniors = 0 THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'song_has_no_juniors'
            );
        END IF;

        RETURN pg_catalog.jsonb_build_object(
            'points_changed', true,
            'reason', 'awarded',
            'liked', true,
            'event_id', v_event_id,
            'affected_juniors', v_affected_juniors
        );
    END IF;

    FOR v_original_log IN
        SELECT original_log.*
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = v_user_id
          AND original_log.action_type = 'like'
          AND original_log.source_type = 'song'
          AND original_log.source_id = p_song_id
          AND original_log.points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
        ORDER BY original_log.created_at, original_log.id
    LOOP
        INSERT INTO public.support_point_logs (
            user_id,
            junior_id,
            action_type,
            source_type,
            source_id,
            points,
            event_id,
            base_points,
            plan_multiplier,
            oshi_multiplier,
            reversal_of_log_id
        )
        VALUES (
            v_user_id,
            v_original_log.junior_id,
            'like',
            'song',
            p_song_id,
            -v_original_log.points,
            v_event_id,
            v_original_log.base_points,
            v_original_log.plan_multiplier,
            v_original_log.oshi_multiplier,
            v_original_log.id
        );

        PERFORM private.recalculate_ranking_score(v_original_log.junior_id);
        v_affected_juniors := v_affected_juniors + 1;
    END LOOP;

    RETURN pg_catalog.jsonb_build_object(
        'points_changed', v_affected_juniors > 0,
        'reason', 'reversed',
        'liked', false,
        'event_id', v_event_id,
        'affected_juniors', v_affected_juniors
    );
END;
$$;

COMMENT ON FUNCTION public.sync_song_like_points(uuid) IS
    '現在の楽曲いいね状態へランキングポイントを同期する';

REVOKE ALL ON FUNCTION public.sync_song_like_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_song_like_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_song_like_points(uuid) TO authenticated;

-- ブログいいねの現在状態へランキングポイントを同期する公開RPC。
-- blog_likes自体の追加・削除は、この関数の責務に含めない。
CREATE FUNCTION public.sync_blog_like_points(p_blog_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_blog_junior_id uuid;
    v_is_liked boolean;
    v_has_active_points boolean;
    v_oshi_junior_id uuid;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_monthly_price integer;
    v_rule record;
    v_event_id uuid := pg_catalog.gen_random_uuid();
    v_applied_oshi_multiplier numeric(4, 2);
    v_points integer;
    v_original_log public.support_point_logs%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'guest'
        );
    END IF;

    SELECT blog_posts.junior_id
    INTO v_blog_junior_id
    FROM public.blog_posts
    WHERE blog_posts.id = p_blog_post_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'blog_post_not_found'
        );
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'blog_like:' || v_user_id::text || ':' || p_blog_post_id::text,
            0
        )
    );

    SELECT EXISTS (
        SELECT 1
        FROM public.blog_likes
        WHERE blog_likes.user_id = v_user_id
          AND blog_likes.blog_posts_id = p_blog_post_id
    )
    INTO v_is_liked;

    SELECT EXISTS (
        SELECT 1
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = v_user_id
          AND original_log.action_type = 'like'
          AND original_log.source_type = 'blog_post'
          AND original_log.source_id = p_blog_post_id
          AND original_log.points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
    )
    INTO v_has_active_points;

    IF v_is_liked = v_has_active_points THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'already_synchronized',
            'liked', v_is_liked
        );
    END IF;

    IF v_is_liked THEN
        SELECT
            ranking_point_rules.base_points,
            ranking_point_rules.apply_plan_multiplier,
            ranking_point_rules.oshi_multiplier
        INTO v_rule
        FROM public.ranking_point_rules
        WHERE ranking_point_rules.action_type = 'like'
          AND ranking_point_rules.is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Active ranking rule for like was not found';
        END IF;

        SELECT
            profiles.oshi_junior_id,
            plans.monthly_price,
            CASE
                WHEN v_rule.apply_plan_multiplier THEN plans.point_multiplier
                ELSE 1.00
            END
        INTO
            v_oshi_junior_id,
            v_monthly_price,
            v_plan_multiplier
        FROM public.profiles
        JOIN public.plans
            ON plans.id = profiles.plan_id
        WHERE profiles.id = v_user_id;

        IF NOT FOUND THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'profile_or_plan_not_found'
            );
        END IF;

        IF v_monthly_price <= 0 THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'paid_plan_required'
            );
        END IF;

        v_applied_oshi_multiplier :=
            CASE
                WHEN v_blog_junior_id = v_oshi_junior_id THEN v_rule.oshi_multiplier
                ELSE 1.00
            END;

        v_points := pg_catalog.round(
            v_rule.base_points
            * v_plan_multiplier
            * v_applied_oshi_multiplier
        )::integer;

        INSERT INTO public.support_point_logs (
            user_id,
            junior_id,
            action_type,
            source_type,
            source_id,
            points,
            event_id,
            base_points,
            plan_multiplier,
            oshi_multiplier
        )
        VALUES (
            v_user_id,
            v_blog_junior_id,
            'like',
            'blog_post',
            p_blog_post_id,
            v_points,
            v_event_id,
            v_rule.base_points,
            v_plan_multiplier,
            v_applied_oshi_multiplier
        );

        PERFORM private.recalculate_ranking_score(v_blog_junior_id);

        RETURN pg_catalog.jsonb_build_object(
            'points_changed', true,
            'reason', 'awarded',
            'liked', true,
            'event_id', v_event_id,
            'junior_id', v_blog_junior_id,
            'points', v_points
        );
    END IF;

    SELECT original_log.*
    INTO v_original_log
    FROM public.support_point_logs AS original_log
    WHERE original_log.user_id = v_user_id
      AND original_log.action_type = 'like'
      AND original_log.source_type = 'blog_post'
      AND original_log.source_id = p_blog_post_id
      AND original_log.points > 0
      AND NOT EXISTS (
          SELECT 1
          FROM public.support_point_logs AS reversal_log
          WHERE reversal_log.reversal_of_log_id = original_log.id
      )
    ORDER BY original_log.created_at DESC, original_log.id DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'already_synchronized',
            'liked', false
        );
    END IF;

    INSERT INTO public.support_point_logs (
        user_id,
        junior_id,
        action_type,
        source_type,
        source_id,
        points,
        event_id,
        base_points,
        plan_multiplier,
        oshi_multiplier,
        reversal_of_log_id
    )
    VALUES (
        v_user_id,
        v_original_log.junior_id,
        'like',
        'blog_post',
        p_blog_post_id,
        -v_original_log.points,
        v_event_id,
        v_original_log.base_points,
        v_original_log.plan_multiplier,
        v_original_log.oshi_multiplier,
        v_original_log.id
    );

    PERFORM private.recalculate_ranking_score(v_original_log.junior_id);

    RETURN pg_catalog.jsonb_build_object(
        'points_changed', true,
        'reason', 'reversed',
        'liked', false,
        'event_id', v_event_id,
        'junior_id', v_original_log.junior_id,
        'points', -v_original_log.points
    );
END;
$$;

COMMENT ON FUNCTION public.sync_blog_like_points(uuid) IS
    '現在のブログいいね状態へランキングポイントを同期する';

REVOKE ALL ON FUNCTION public.sync_blog_like_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_blog_like_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_blog_like_points(uuid) TO authenticated;

-- コメント有無とコメントポイントを同期する内部共通関数。
CREATE FUNCTION private.sync_comment_points(
    p_user_id uuid,
    p_source_type text,
    p_source_id uuid,
    p_junior_ids uuid[],
    p_has_comments boolean,
    p_require_paid_plan boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_has_active_points boolean;
    v_oshi_junior_id uuid;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_monthly_price integer;
    v_rule record;
    v_event_id uuid := pg_catalog.gen_random_uuid();
    v_junior_id uuid;
    v_applied_oshi_multiplier numeric(4, 2);
    v_points integer;
    v_affected_juniors integer := 0;
    v_original_log public.support_point_logs%ROWTYPE;
BEGIN
    IF p_source_type NOT IN ('song', 'blog_post') THEN
        RAISE EXCEPTION 'Unsupported comment source type: %', p_source_type;
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'comment:' || p_source_type || ':' || p_user_id::text || ':' || p_source_id::text,
            0
        )
    );

    SELECT EXISTS (
        SELECT 1
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = p_user_id
          AND original_log.action_type = 'comment'
          AND original_log.source_type = p_source_type
          AND original_log.source_id = p_source_id
          AND original_log.points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
    )
    INTO v_has_active_points;

    IF p_has_comments = v_has_active_points THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'already_synchronized',
            'has_comments', p_has_comments
        );
    END IF;

    IF p_has_comments THEN
        IF COALESCE(pg_catalog.array_length(p_junior_ids, 1), 0) = 0 THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'source_has_no_juniors'
            );
        END IF;

        SELECT
            ranking_point_rules.base_points,
            ranking_point_rules.apply_plan_multiplier,
            ranking_point_rules.oshi_multiplier
        INTO v_rule
        FROM public.ranking_point_rules
        WHERE ranking_point_rules.action_type = 'comment'
          AND ranking_point_rules.is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Active ranking rule for comment was not found';
        END IF;

        SELECT
            profiles.oshi_junior_id,
            plans.monthly_price,
            CASE
                WHEN v_rule.apply_plan_multiplier
                    THEN COALESCE(plans.point_multiplier, 1.00)
                ELSE 1.00
            END
        INTO
            v_oshi_junior_id,
            v_monthly_price,
            v_plan_multiplier
        FROM public.profiles
        LEFT JOIN public.plans
            ON plans.id = profiles.plan_id
        WHERE profiles.id = p_user_id;

        IF NOT FOUND THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'profile_not_found'
            );
        END IF;

        IF p_require_paid_plan AND COALESCE(v_monthly_price, 0) <= 0 THEN
            RETURN pg_catalog.jsonb_build_object(
                'points_changed', false,
                'reason', 'paid_plan_required'
            );
        END IF;

        FOREACH v_junior_id IN ARRAY p_junior_ids
        LOOP
            v_applied_oshi_multiplier :=
                CASE
                    WHEN v_junior_id = v_oshi_junior_id THEN v_rule.oshi_multiplier
                    ELSE 1.00
                END;

            v_points := pg_catalog.round(
                v_rule.base_points
                * v_plan_multiplier
                * v_applied_oshi_multiplier
            )::integer;

            INSERT INTO public.support_point_logs (
                user_id,
                junior_id,
                action_type,
                source_type,
                source_id,
                points,
                event_id,
                base_points,
                plan_multiplier,
                oshi_multiplier
            )
            VALUES (
                p_user_id,
                v_junior_id,
                'comment',
                p_source_type,
                p_source_id,
                v_points,
                v_event_id,
                v_rule.base_points,
                v_plan_multiplier,
                v_applied_oshi_multiplier
            );

            PERFORM private.recalculate_ranking_score(v_junior_id);
            v_affected_juniors := v_affected_juniors + 1;
        END LOOP;

        RETURN pg_catalog.jsonb_build_object(
            'points_changed', true,
            'reason', 'awarded',
            'has_comments', true,
            'event_id', v_event_id,
            'affected_juniors', v_affected_juniors
        );
    END IF;

    FOR v_original_log IN
        SELECT original_log.*
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = p_user_id
          AND original_log.action_type = 'comment'
          AND original_log.source_type = p_source_type
          AND original_log.source_id = p_source_id
          AND original_log.points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
        ORDER BY original_log.created_at, original_log.id
    LOOP
        INSERT INTO public.support_point_logs (
            user_id,
            junior_id,
            action_type,
            source_type,
            source_id,
            points,
            event_id,
            base_points,
            plan_multiplier,
            oshi_multiplier,
            reversal_of_log_id
        )
        VALUES (
            p_user_id,
            v_original_log.junior_id,
            'comment',
            p_source_type,
            p_source_id,
            -v_original_log.points,
            v_event_id,
            v_original_log.base_points,
            v_original_log.plan_multiplier,
            v_original_log.oshi_multiplier,
            v_original_log.id
        );

        PERFORM private.recalculate_ranking_score(v_original_log.junior_id);
        v_affected_juniors := v_affected_juniors + 1;
    END LOOP;

    RETURN pg_catalog.jsonb_build_object(
        'points_changed', v_affected_juniors > 0,
        'reason', 'reversed',
        'has_comments', false,
        'event_id', v_event_id,
        'affected_juniors', v_affected_juniors
    );
END;
$$;

COMMENT ON FUNCTION private.sync_comment_points(uuid, text, uuid, uuid[], boolean, boolean) IS
    'コメント有無に応じてランキングポイントを付与または取り消す内部共通関数';

REVOKE ALL ON FUNCTION private.sync_comment_points(uuid, text, uuid, uuid[], boolean, boolean)
FROM PUBLIC, anon, authenticated;

-- 楽曲コメントの現在状態へランキングポイントを同期する公開RPC。
CREATE FUNCTION public.sync_song_comment_points(p_song_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_has_comments boolean;
    v_junior_ids uuid[];
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'guest'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.songs
        WHERE songs.id = p_song_id
    ) THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'song_not_found'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.song_comments
        WHERE song_comments.user_id = v_user_id
          AND song_comments.song_id = p_song_id
    )
    INTO v_has_comments;

    SELECT pg_catalog.array_agg(DISTINCT song_juniors.junior_id)
    INTO v_junior_ids
    FROM public.song_juniors
    WHERE song_juniors.song_id = p_song_id;

    RETURN private.sync_comment_points(
        v_user_id,
        'song',
        p_song_id,
        v_junior_ids,
        v_has_comments,
        false
    );
END;
$$;

COMMENT ON FUNCTION public.sync_song_comment_points(uuid) IS
    '現在の楽曲コメント有無へランキングポイントを同期する';

REVOKE ALL ON FUNCTION public.sync_song_comment_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_song_comment_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_song_comment_points(uuid) TO authenticated;

-- ブログコメントの現在状態へランキングポイントを同期する公開RPC。
CREATE FUNCTION public.sync_blog_comment_points(p_blog_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_blog_junior_id uuid;
    v_has_comments boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'guest'
        );
    END IF;

    SELECT blog_posts.junior_id
    INTO v_blog_junior_id
    FROM public.blog_posts
    WHERE blog_posts.id = p_blog_post_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'blog_post_not_found'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.blog_comments
        WHERE blog_comments.user_id = v_user_id
          AND blog_comments.blog_posts_id = p_blog_post_id
    )
    INTO v_has_comments;

    RETURN private.sync_comment_points(
        v_user_id,
        'blog_post',
        p_blog_post_id,
        ARRAY[v_blog_junior_id],
        v_has_comments,
        true
    );
END;
$$;

COMMENT ON FUNCTION public.sync_blog_comment_points(uuid) IS
    '現在のブログコメント有無へランキングポイントを同期する';

REVOKE ALL ON FUNCTION public.sync_blog_comment_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_blog_comment_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_blog_comment_points(uuid) TO authenticated;
