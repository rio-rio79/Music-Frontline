-- 確定した会員プラン仕様に合わせ、ランキングポイント倍率を修正する。
DO $$
DECLARE
    v_updated_rows integer;
BEGIN
    UPDATE public.plans
    SET
        point_multiplier = 1.20,
        updated_at = now()
    WHERE name = 'スタンダード'
      AND monthly_price = 500;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    IF v_updated_rows <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly one standard plan, but updated % rows',
            v_updated_rows;
    END IF;

    UPDATE public.plans
    SET
        point_multiplier = 1.50,
        updated_at = now()
    WHERE name = 'プレミアム'
      AND monthly_price = 1000;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    IF v_updated_rows <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly one premium plan, but updated % rows',
            v_updated_rows;
    END IF;
END;
$$;
