-- 推し登録ポイントは会員プラン倍率の対象外にする。
-- 既存の推し登録ログも基礎点へ補正し、ランキング集計に差分が残らないようにする。

UPDATE public.ranking_point_rules
SET
    apply_plan_multiplier = false,
    updated_at = pg_catalog.now()
WHERE action_type = 'oshi';

COMMENT ON COLUMN public.plans.point_multiplier IS
    '応援課金・推し登録を除くランキング対象行動へ適用する会員プラン倍率';

DO $$
DECLARE
    v_junior_id uuid;
BEGIN
    CREATE TEMP TABLE pg_temp.affected_oshi_point_juniors (
        junior_id uuid PRIMARY KEY
    ) ON COMMIT DROP;

    INSERT INTO pg_temp.affected_oshi_point_juniors (junior_id)
    SELECT DISTINCT support_point_logs.junior_id
    FROM public.support_point_logs
    WHERE support_point_logs.action_type = 'oshi'
      AND support_point_logs.base_points IS NOT NULL
      AND support_point_logs.junior_id IS NOT NULL
      AND (
          support_point_logs.points <> support_point_logs.base_points
          OR support_point_logs.plan_multiplier IS DISTINCT FROM 1.00
      );

    UPDATE public.support_point_logs AS reversal_log
    SET
        points = -original_log.base_points,
        base_points = original_log.base_points,
        plan_multiplier = 1.00
    FROM public.support_point_logs AS original_log
    WHERE reversal_log.reversal_of_log_id = original_log.id
      AND reversal_log.action_type = 'oshi'
      AND original_log.action_type = 'oshi'
      AND original_log.base_points IS NOT NULL
      AND (
          reversal_log.points <> -original_log.base_points
          OR reversal_log.plan_multiplier IS DISTINCT FROM 1.00
      );

    UPDATE public.support_point_logs
    SET
        points = base_points,
        plan_multiplier = 1.00
    WHERE action_type = 'oshi'
      AND reversal_of_log_id IS NULL
      AND base_points IS NOT NULL
      AND (
          points <> base_points
          OR plan_multiplier IS DISTINCT FROM 1.00
      );

    FOR v_junior_id IN
        SELECT affected_oshi_point_juniors.junior_id
        FROM pg_temp.affected_oshi_point_juniors
    LOOP
        PERFORM private.recalculate_ranking_score(v_junior_id);
    END LOOP;
END;
$$;
