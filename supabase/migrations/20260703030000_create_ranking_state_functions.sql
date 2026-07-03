-- フォロー、推し、月次処理のランキングポイント同期関数を作成する。

-- 指定ユーザー・ジュニア・対象月のフォローポイントを同期する内部関数。
CREATE FUNCTION private.sync_follow_points(
    p_user_id uuid,
    p_junior_id uuid,
    p_period_key date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_is_following boolean;
    v_oshi_junior_id uuid;
    v_should_have_points boolean;
    v_has_active_points boolean;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_rule record;
    v_event_id uuid := pg_catalog.gen_random_uuid();
    v_points integer;
    v_original_log public.support_point_logs%ROWTYPE;
BEGIN
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'follow:' || p_user_id::text || ':' || p_junior_id::text || ':' || p_period_key::text,
            0
        )
    );

    SELECT profiles.oshi_junior_id
    INTO v_oshi_junior_id
    FROM public.profiles
    WHERE profiles.id = p_user_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'profile_not_found'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.follow_juniors
        WHERE follow_juniors.user_id = p_user_id
          AND follow_juniors.junior_id = p_junior_id
    )
    INTO v_is_following;

    v_should_have_points :=
        v_is_following
        AND v_oshi_junior_id IS DISTINCT FROM p_junior_id;

    SELECT EXISTS (
        SELECT 1
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = p_user_id
          AND original_log.junior_id = p_junior_id
          AND original_log.action_type = 'follow'
          AND original_log.source_type = 'junior'
          AND original_log.source_id = p_junior_id
          AND original_log.period_key = p_period_key
          AND original_log.points > 0
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
    )
    INTO v_has_active_points;

    IF v_should_have_points = v_has_active_points THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'already_synchronized',
            'following', v_is_following,
            'is_oshi', v_oshi_junior_id IS NOT DISTINCT FROM p_junior_id,
            'period_key', p_period_key
        );
    END IF;

    IF v_should_have_points THEN
        SELECT
            ranking_point_rules.base_points,
            ranking_point_rules.apply_plan_multiplier
        INTO v_rule
        FROM public.ranking_point_rules
        WHERE ranking_point_rules.action_type = 'follow'
          AND ranking_point_rules.is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Active ranking rule for follow was not found';
        END IF;

        IF v_rule.apply_plan_multiplier THEN
            SELECT COALESCE(plans.point_multiplier, 1.00)
            INTO v_plan_multiplier
            FROM public.profiles
            LEFT JOIN public.plans
                ON plans.id = profiles.plan_id
            WHERE profiles.id = p_user_id;
        END IF;

        v_points := pg_catalog.round(
            v_rule.base_points * v_plan_multiplier
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
            p_user_id,
            p_junior_id,
            'follow',
            'junior',
            p_junior_id,
            v_points,
            v_event_id,
            p_period_key,
            v_rule.base_points,
            v_plan_multiplier,
            1.00
        );

        PERFORM private.recalculate_ranking_score(p_junior_id);

        RETURN pg_catalog.jsonb_build_object(
            'points_changed', true,
            'reason', 'awarded',
            'following', true,
            'is_oshi', false,
            'event_id', v_event_id,
            'period_key', p_period_key,
            'points', v_points
        );
    END IF;

    SELECT original_log.*
    INTO v_original_log
    FROM public.support_point_logs AS original_log
    WHERE original_log.user_id = p_user_id
      AND original_log.junior_id = p_junior_id
      AND original_log.action_type = 'follow'
      AND original_log.source_type = 'junior'
      AND original_log.source_id = p_junior_id
      AND original_log.period_key = p_period_key
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
            'following', v_is_following,
            'is_oshi', v_oshi_junior_id IS NOT DISTINCT FROM p_junior_id,
            'period_key', p_period_key
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
        period_key,
        base_points,
        plan_multiplier,
        oshi_multiplier,
        reversal_of_log_id
    )
    VALUES (
        p_user_id,
        p_junior_id,
        'follow',
        'junior',
        p_junior_id,
        -v_original_log.points,
        v_event_id,
        p_period_key,
        v_original_log.base_points,
        v_original_log.plan_multiplier,
        v_original_log.oshi_multiplier,
        v_original_log.id
    );

    PERFORM private.recalculate_ranking_score(p_junior_id);

    RETURN pg_catalog.jsonb_build_object(
        'points_changed', true,
        'reason', 'reversed',
        'following', v_is_following,
        'is_oshi', v_oshi_junior_id IS NOT DISTINCT FROM p_junior_id,
        'event_id', v_event_id,
        'period_key', p_period_key,
        'points', -v_original_log.points
    );
END;
$$;

COMMENT ON FUNCTION private.sync_follow_points(uuid, uuid, date) IS
    '指定ユーザー・ジュニア・対象月のフォロー状態へランキングポイントを同期する';

REVOKE ALL ON FUNCTION private.sync_follow_points(uuid, uuid, date)
FROM PUBLIC, anon, authenticated;

-- ログインユーザーの当月フォローポイントを同期する公開RPC。
-- follow_juniors自体の追加・削除は、この関数の責務に含めない。
CREATE FUNCTION public.sync_follow_points(p_junior_id uuid)
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
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'guest'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.juniors
        WHERE juniors.id = p_junior_id
    ) THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'junior_not_found'
        );
    END IF;

    RETURN private.sync_follow_points(
        v_user_id,
        p_junior_id,
        v_period_key
    );
END;
$$;

COMMENT ON FUNCTION public.sync_follow_points(uuid) IS
    'ログインユーザーの現在のフォロー状態へ当月ランキングポイントを同期する';

REVOKE ALL ON FUNCTION public.sync_follow_points(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_follow_points(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_follow_points(uuid) TO authenticated;

-- 指定ユーザー・対象月の推しポイントを現在の推し状態へ同期する内部関数。
CREATE FUNCTION private.sync_oshi_points(
    p_user_id uuid,
    p_period_key date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_current_oshi_junior_id uuid;
    v_has_current_points boolean := false;
    v_plan_multiplier numeric(4, 2) := 1.00;
    v_rule record;
    v_event_id uuid;
    v_points integer;
    v_original_log public.support_point_logs%ROWTYPE;
    v_follow_result jsonb;
    v_points_changed boolean := false;
    v_follow_points_changed boolean := false;
    v_reversed_juniors integer := 0;
BEGIN
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'oshi:' || p_user_id::text || ':' || p_period_key::text,
            0
        )
    );

    SELECT profiles.oshi_junior_id
    INTO v_current_oshi_junior_id
    FROM public.profiles
    WHERE profiles.id = p_user_id;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'profile_not_found'
        );
    END IF;

    -- 現在の推し以外に残っている当月推しポイントを取り消す。
    FOR v_original_log IN
        SELECT original_log.*
        FROM public.support_point_logs AS original_log
        WHERE original_log.user_id = p_user_id
          AND original_log.action_type = 'oshi'
          AND original_log.source_type = 'junior'
          AND original_log.period_key = p_period_key
          AND original_log.points > 0
          AND original_log.junior_id IS DISTINCT FROM v_current_oshi_junior_id
          AND NOT EXISTS (
              SELECT 1
              FROM public.support_point_logs AS reversal_log
              WHERE reversal_log.reversal_of_log_id = original_log.id
          )
        ORDER BY original_log.created_at, original_log.id
    LOOP
        v_event_id := pg_catalog.gen_random_uuid();

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
            oshi_multiplier,
            reversal_of_log_id
        )
        VALUES (
            p_user_id,
            v_original_log.junior_id,
            'oshi',
            'junior',
            v_original_log.junior_id,
            -v_original_log.points,
            v_event_id,
            p_period_key,
            v_original_log.base_points,
            v_original_log.plan_multiplier,
            v_original_log.oshi_multiplier,
            v_original_log.id
        );

        PERFORM private.recalculate_ranking_score(v_original_log.junior_id);

        -- 以前の推しを引き続きフォローしていれば、当月フォローポイントの対象に戻す。
        v_follow_result := private.sync_follow_points(
            p_user_id,
            v_original_log.junior_id,
            p_period_key
        );

        v_follow_points_changed :=
            v_follow_points_changed
            OR COALESCE((v_follow_result ->> 'points_changed')::boolean, false);
        v_points_changed := true;
        v_reversed_juniors := v_reversed_juniors + 1;
    END LOOP;

    IF v_current_oshi_junior_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.support_point_logs AS original_log
            WHERE original_log.user_id = p_user_id
              AND original_log.junior_id = v_current_oshi_junior_id
              AND original_log.action_type = 'oshi'
              AND original_log.source_type = 'junior'
              AND original_log.source_id = v_current_oshi_junior_id
              AND original_log.period_key = p_period_key
              AND original_log.points > 0
              AND NOT EXISTS (
                  SELECT 1
                  FROM public.support_point_logs AS reversal_log
                  WHERE reversal_log.reversal_of_log_id = original_log.id
              )
        )
        INTO v_has_current_points;

        IF NOT v_has_current_points THEN
            SELECT
                ranking_point_rules.base_points,
                ranking_point_rules.apply_plan_multiplier
            INTO v_rule
            FROM public.ranking_point_rules
            WHERE ranking_point_rules.action_type = 'oshi'
              AND ranking_point_rules.is_active = true;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Active ranking rule for oshi was not found';
            END IF;

            IF v_rule.apply_plan_multiplier THEN
                SELECT COALESCE(plans.point_multiplier, 1.00)
                INTO v_plan_multiplier
                FROM public.profiles
                LEFT JOIN public.plans
                    ON plans.id = profiles.plan_id
                WHERE profiles.id = p_user_id;
            END IF;

            v_points := pg_catalog.round(
                v_rule.base_points * v_plan_multiplier
            )::integer;
            v_event_id := pg_catalog.gen_random_uuid();

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
                p_user_id,
                v_current_oshi_junior_id,
                'oshi',
                'junior',
                v_current_oshi_junior_id,
                v_points,
                v_event_id,
                p_period_key,
                v_rule.base_points,
                v_plan_multiplier,
                1.00
            );

            PERFORM private.recalculate_ranking_score(v_current_oshi_junior_id);
            v_points_changed := true;
        END IF;

        -- 現在の推しと重複する当月フォローポイントがあれば取り消す。
        v_follow_result := private.sync_follow_points(
            p_user_id,
            v_current_oshi_junior_id,
            p_period_key
        );

        v_follow_points_changed :=
            v_follow_points_changed
            OR COALESCE((v_follow_result ->> 'points_changed')::boolean, false);
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'points_changed', v_points_changed OR v_follow_points_changed,
        'oshi_points_changed', v_points_changed,
        'follow_points_changed', v_follow_points_changed,
        'reason', 'synchronized',
        'oshi_junior_id', v_current_oshi_junior_id,
        'period_key', p_period_key,
        'reversed_juniors', v_reversed_juniors
    );
END;
$$;

COMMENT ON FUNCTION private.sync_oshi_points(uuid, date) IS
    '指定ユーザー・対象月の推し状態へ推しポイントと重複フォローポイントを同期する';

REVOKE ALL ON FUNCTION private.sync_oshi_points(uuid, date)
FROM PUBLIC, anon, authenticated;

-- ログインユーザーの当月推しポイントを同期する公開RPC。
-- profiles.oshi_junior_idとfollow_juniors自体は変更しない。
CREATE FUNCTION public.sync_oshi_points()
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
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'points_changed', false,
            'reason', 'guest'
        );
    END IF;

    RETURN private.sync_oshi_points(
        v_user_id,
        v_period_key
    );
END;
$$;

COMMENT ON FUNCTION public.sync_oshi_points() IS
    'ログインユーザーの現在の推し状態へ当月ランキングポイントを同期する';

REVOKE ALL ON FUNCTION public.sync_oshi_points() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_oshi_points() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_oshi_points() TO authenticated;

-- 指定月の推し・フォローポイントを全ユーザー分同期する内部関数。
-- Cron設定は別工程とし、この関数は安全に再実行できる同期処理だけを担当する。
CREATE FUNCTION private.sync_monthly_support_points(p_period_key date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid;
    v_junior_id uuid;
    v_result jsonb;
    v_profiles_processed integer := 0;
    v_follows_processed integer := 0;
    v_changes integer := 0;
BEGIN
    IF p_period_key IS NULL
       OR p_period_key <> pg_catalog.date_trunc('month', p_period_key)::date THEN
        RAISE EXCEPTION 'period_key must be the first day of a month: %', p_period_key;
    END IF;

    -- 同じ対象月の全件同期を同時に複数実行しない。
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            'monthly_support_points:' || p_period_key::text,
            0
        )
    );

    -- 推しポイントを先に同期し、推しとフォローの重複を調整する。
    FOR v_user_id IN
        SELECT profiles.id
        FROM public.profiles
        ORDER BY profiles.id
    LOOP
        v_result := private.sync_oshi_points(
            v_user_id,
            p_period_key
        );

        v_profiles_processed := v_profiles_processed + 1;

        IF COALESCE((v_result ->> 'points_changed')::boolean, false) THEN
            v_changes := v_changes + 1;
        END IF;
    END LOOP;

    -- 現在フォロー中の全組み合わせへ、推しと重複しない当月分を同期する。
    FOR v_user_id, v_junior_id IN
        SELECT
            follow_juniors.user_id,
            follow_juniors.junior_id
        FROM public.follow_juniors
        ORDER BY follow_juniors.user_id, follow_juniors.junior_id
    LOOP
        v_result := private.sync_follow_points(
            v_user_id,
            v_junior_id,
            p_period_key
        );

        v_follows_processed := v_follows_processed + 1;

        IF COALESCE((v_result ->> 'points_changed')::boolean, false) THEN
            v_changes := v_changes + 1;
        END IF;
    END LOOP;

    RETURN pg_catalog.jsonb_build_object(
        'period_key', p_period_key,
        'profiles_processed', v_profiles_processed,
        'follows_processed', v_follows_processed,
        'changes', v_changes
    );
END;
$$;

COMMENT ON FUNCTION private.sync_monthly_support_points(date) IS
    '指定月の推し・フォローポイントを全ユーザー分同期する再実行可能な内部関数';

REVOKE ALL ON FUNCTION private.sync_monthly_support_points(date)
FROM PUBLIC, anon, authenticated;
