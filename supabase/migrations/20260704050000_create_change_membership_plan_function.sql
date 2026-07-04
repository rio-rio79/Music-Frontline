-- ログインユーザー本人の会員プランを即時変更する公開RPC。
-- 過去のポイントは再計算せず、変更後の応援行動から新しい倍率を使用する。
CREATE FUNCTION public.change_membership_plan(p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_plan public.plans%ROWTYPE;
    v_updated_profiles integer;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT plans.*
    INTO v_plan
    FROM public.plans
    WHERE plans.id = p_plan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found';
    END IF;

    UPDATE public.profiles
    SET
        plan_id = v_plan.id,
        updated_at = pg_catalog.now()
    WHERE id = v_user_id;

    GET DIAGNOSTICS v_updated_profiles = ROW_COUNT;

    IF v_updated_profiles <> 1 THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'changed', true,
        'plan_id', v_plan.id,
        'plan_name', v_plan.name,
        'monthly_price', v_plan.monthly_price,
        'point_multiplier', v_plan.point_multiplier
    );
END;
$$;

COMMENT ON FUNCTION public.change_membership_plan(uuid) IS
    'ログインユーザー本人の会員プランを変更し、過去ポイントは再計算しない';

REVOKE ALL ON FUNCTION public.change_membership_plan(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.change_membership_plan(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.change_membership_plan(uuid) TO authenticated;
