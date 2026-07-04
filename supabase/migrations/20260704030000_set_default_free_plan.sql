-- 新規ユーザーの初期プランをフリープランにし、
-- 既存プロフィールの未設定プランもフリープランへ揃える。
DO $$
DECLARE
    v_free_plan_id uuid;
    v_free_plan_count integer;
BEGIN
    SELECT pg_catalog.count(*)
    INTO v_free_plan_count
    FROM public.plans
    WHERE name = 'フリー'
      AND monthly_price = 0
      AND point_multiplier = 1.00;

    IF v_free_plan_count <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly one free plan, but found % rows',
            v_free_plan_count;
    END IF;

    SELECT id
    INTO v_free_plan_id
    FROM public.plans
    WHERE name = 'フリー'
      AND monthly_price = 0
      AND point_multiplier = 1.00;

    UPDATE public.profiles
    SET
        plan_id = v_free_plan_id,
        updated_at = pg_catalog.now()
    WHERE plan_id IS NULL;

    EXECUTE pg_catalog.format(
        'ALTER TABLE public.profiles ALTER COLUMN plan_id SET DEFAULT %L::uuid',
        v_free_plan_id
    );

    ALTER TABLE public.profiles
        ALTER COLUMN plan_id SET NOT NULL;
END;
$$;
