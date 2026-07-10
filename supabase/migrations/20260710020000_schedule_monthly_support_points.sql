-- 月次の推し・フォローポイント同期をSupabase Cronから起動する。
--
-- pg_cronのスケジュールはUTC基準で扱うため、毎日15:00 UTCに起動し、
-- 日本時間で毎月1日になった場合だけ当月分を同期する。

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION private.run_monthly_support_points_if_due(
    p_run_at timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_jst_timestamp timestamp;
    v_period_key date;
    v_result jsonb;
BEGIN
    v_jst_timestamp := p_run_at AT TIME ZONE 'Asia/Tokyo';

    IF EXTRACT(day FROM v_jst_timestamp)::integer <> 1 THEN
        RETURN pg_catalog.jsonb_build_object(
            'ran', false,
            'reason', 'not_first_day_jst',
            'run_at', p_run_at,
            'jst_date', v_jst_timestamp::date
        );
    END IF;

    v_period_key := pg_catalog.date_trunc('month', v_jst_timestamp)::date;

    v_result := private.sync_monthly_support_points(v_period_key);

    RETURN pg_catalog.jsonb_build_object(
        'ran', true,
        'period_key', v_period_key,
        'result', v_result
    );
END;
$$;

COMMENT ON FUNCTION private.run_monthly_support_points_if_due(timestamptz) IS
    '日本時間で毎月1日の場合だけ、当月分の推し・フォローポイント同期を実行するCron用内部関数';

REVOKE ALL ON FUNCTION private.run_monthly_support_points_if_due(timestamptz)
FROM PUBLIC, anon, authenticated;

DO $do$
DECLARE
    v_job record;
BEGIN
    FOR v_job IN
        SELECT cron.job.jobid
        FROM cron.job
        WHERE cron.job.jobname = 'music_frontline_monthly_support_points'
    LOOP
        PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
        'music_frontline_monthly_support_points',
        '0 15 * * *',
        $cmd$SELECT private.run_monthly_support_points_if_due();$cmd$
    );
END;
$do$;
