-- ファンレターの保存、ポイント付与、ランキング更新を同一トランザクションで行う。

-- 既存行を変更せず、今後の追加・更新には最新仕様の制約を適用する。
ALTER TABLE public.support_payments
    DROP CONSTRAINT IF EXISTS support_payments_amount_range_check,
    DROP CONSTRAINT IF EXISTS support_payments_message_length_check;

ALTER TABLE public.support_payments
    ADD CONSTRAINT support_payments_amount_range_check
        CHECK (amount BETWEEN 100 AND 50000) NOT VALID,
    ADD CONSTRAINT support_payments_message_length_check
        CHECK (
            message IS NOT NULL
            AND char_length(message) BETWEEN 1 AND 300
            AND message ~ '[^[:space:]]'
        ) NOT VALID;

-- 一般ユーザーは自分の送信履歴だけを参照し、追加は専用RPCに限定する。
ALTER TABLE public.support_payments ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.support_payments FROM anon, authenticated;
GRANT SELECT ON TABLE public.support_payments TO authenticated;

DROP POLICY IF EXISTS "Users can read their own support payments"
ON public.support_payments;

CREATE POLICY "Users can read their own support payments"
ON public.support_payments
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS support_payments_user_created_at_idx
ON public.support_payments (user_id, created_at DESC);

CREATE FUNCTION public.send_fan_letter(
    p_junior_id uuid,
    p_amount integer,
    p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_message text := btrim(p_message);
    v_payment_id uuid;
    v_created_at timestamptz;
    v_base_points integer;
    v_calculation_type text;
    v_rule_active boolean;
    v_points integer;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication is required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.juniors
        WHERE juniors.id = p_junior_id
    ) THEN
        RAISE EXCEPTION 'Junior % does not exist', p_junior_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF p_amount IS NULL OR p_amount < 100 OR p_amount > 50000 THEN
        RAISE EXCEPTION 'Amount must be between 100 and 50000'
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_message IS NULL OR v_message !~ '[^[:space:]]' THEN
        RAISE EXCEPTION 'Message is required'
            USING ERRCODE = 'check_violation';
    END IF;

    IF char_length(v_message) > 300 THEN
        RAISE EXCEPTION 'Message must be 300 characters or fewer'
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT
        ranking_point_rules.base_points,
        ranking_point_rules.calculation_type,
        ranking_point_rules.is_active
    INTO
        v_base_points,
        v_calculation_type,
        v_rule_active
    FROM public.ranking_point_rules
    WHERE ranking_point_rules.action_type = 'payment';

    IF NOT FOUND OR NOT v_rule_active OR v_calculation_type <> 'amount' THEN
        RAISE EXCEPTION 'Payment point rule is not available'
            USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;

    v_points := p_amount * v_base_points;

    INSERT INTO public.support_payments (
        user_id,
        junior_id,
        amount,
        message
    )
    VALUES (
        v_user_id,
        p_junior_id,
        p_amount,
        v_message
    )
    RETURNING id, created_at
    INTO v_payment_id, v_created_at;

    INSERT INTO public.support_point_logs (
        user_id,
        junior_id,
        action_type,
        points,
        source_type,
        source_id,
        event_id,
        base_points,
        plan_multiplier,
        oshi_multiplier
    )
    VALUES (
        v_user_id,
        p_junior_id,
        'payment',
        v_points,
        'support_payment',
        v_payment_id,
        v_payment_id,
        v_base_points,
        1.00,
        1.00
    );

    PERFORM private.recalculate_ranking_score(p_junior_id);

    RETURN jsonb_build_object(
        'id', v_payment_id,
        'junior_id', p_junior_id,
        'amount', p_amount,
        'message', v_message,
        'points', v_points,
        'created_at', v_created_at
    );
END;
$$;

COMMENT ON FUNCTION public.send_fan_letter(uuid, integer, text) IS
    'ファンレターを保存し、金額と同数の応援ポイントを付与してランキングを更新する';

REVOKE ALL ON FUNCTION public.send_fan_letter(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_fan_letter(uuid, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_fan_letter(uuid, integer, text) TO authenticated;
