-- ランキング機能のテーブル、既存テーブル拡張、権限設定をまとめて作成する。

-- Data APIへ公開しない内部処理用スキーマを用意する。
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

-- ランキングの配点・倍率適用・付与上限をDBで一元管理する。
CREATE TABLE public.ranking_point_rules (
    action_type text PRIMARY KEY,
    base_points integer NOT NULL,
    calculation_type text NOT NULL DEFAULT 'fixed',
    apply_plan_multiplier boolean NOT NULL DEFAULT true,
    oshi_multiplier numeric(4, 2) NOT NULL DEFAULT 1.00,
    limit_type text NOT NULL DEFAULT 'none',
    limit_count integer,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ranking_point_rules_base_points_check
        CHECK (base_points >= 0),
    CONSTRAINT ranking_point_rules_calculation_type_check
        CHECK (calculation_type IN ('fixed', 'amount')),
    CONSTRAINT ranking_point_rules_oshi_multiplier_check
        CHECK (oshi_multiplier > 0),
    CONSTRAINT ranking_point_rules_limit_type_check
        CHECK (limit_type IN ('none', 'daily', 'monthly', 'active_state')),
    CONSTRAINT ranking_point_rules_limit_count_check
        CHECK (
            (limit_type = 'none' AND limit_count IS NULL)
            OR
            (limit_type <> 'none' AND limit_count IS NOT NULL AND limit_count > 0)
        )
);

COMMENT ON TABLE public.ranking_point_rules IS
    'ランキング対象行動の基礎ポイント、倍率適用、付与上限を管理する';

COMMENT ON COLUMN public.ranking_point_rules.calculation_type IS
    'fixed: 基礎ポイントを付与、amount: 入力金額に基礎ポイントを乗算';

COMMENT ON COLUMN public.ranking_point_rules.limit_type IS
    'none: 上限なし、daily: 日次、monthly: 月次、active_state: 有効状態1件分';

-- updated_atをルール更新時に自動更新する。
CREATE FUNCTION public.set_ranking_point_rules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_ranking_point_rules_updated_at
BEFORE UPDATE ON public.ranking_point_rules
FOR EACH ROW
EXECUTE FUNCTION public.set_ranking_point_rules_updated_at();

INSERT INTO public.ranking_point_rules (
    action_type,
    base_points,
    calculation_type,
    apply_plan_multiplier,
    oshi_multiplier,
    limit_type,
    limit_count
)
VALUES
    ('play',       100,   'fixed',  true,  1.50, 'daily',       20),
    ('blog_view',  100,   'fixed',  true,  1.50, 'daily',        1),
    ('like',       300,   'fixed',  true,  1.50, 'active_state', 1),
    ('comment',    500,   'fixed',  true,  1.50, 'active_state', 1),
    ('follow',     100,   'fixed',  true,  1.00, 'monthly',      1),
    ('oshi',     10000,   'fixed',  true,  1.00, 'monthly',      1),
    ('payment',      1,   'amount', false, 1.00, 'none',      NULL);

-- 配点は公開情報として読み取り可能にするが、一般ユーザーからの変更は許可しない。
ALTER TABLE public.ranking_point_rules ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ranking_point_rules FROM anon, authenticated;
GRANT SELECT ON TABLE public.ranking_point_rules TO anon, authenticated;

CREATE POLICY "Ranking point rules are publicly readable"
ON public.ranking_point_rules
FOR SELECT
TO anon, authenticated
USING (true);

-- トリガー関数をData APIから直接実行させない。
REVOKE ALL ON FUNCTION public.set_ranking_point_rules_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_ranking_point_rules_updated_at() FROM anon, authenticated;

-- 1回の応援行動から複数ジュニアへ付与されたログをevent_idで関連付ける。
-- 既存ログとの互換性を保つため、追加カラムはNULLを許可する。
ALTER TABLE public.support_point_logs
    ADD COLUMN event_id uuid,
    ADD COLUMN period_key date,
    ADD COLUMN base_points integer,
    ADD COLUMN plan_multiplier numeric(4, 2),
    ADD COLUMN oshi_multiplier numeric(4, 2),
    ADD COLUMN reversal_of_log_id uuid;

ALTER TABLE public.support_point_logs
    ADD CONSTRAINT support_point_logs_base_points_check
        CHECK (base_points IS NULL OR base_points >= 0),
    ADD CONSTRAINT support_point_logs_plan_multiplier_check
        CHECK (plan_multiplier IS NULL OR plan_multiplier > 0),
    ADD CONSTRAINT support_point_logs_oshi_multiplier_check
        CHECK (oshi_multiplier IS NULL OR oshi_multiplier > 0),
    ADD CONSTRAINT support_point_logs_reversal_not_self_check
        CHECK (reversal_of_log_id IS NULL OR reversal_of_log_id <> id),
    ADD CONSTRAINT support_point_logs_reversal_of_log_id_fkey
        FOREIGN KEY (reversal_of_log_id)
        REFERENCES public.support_point_logs (id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT support_point_logs_action_type_fkey
        FOREIGN KEY (action_type)
        REFERENCES public.ranking_point_rules (action_type)
        ON DELETE RESTRICT;

COMMENT ON COLUMN public.support_point_logs.event_id IS
    '同じ応援行動から作成されたジュニア別ポイントログをまとめるUUID';

COMMENT ON COLUMN public.support_point_logs.period_key IS
    '日本時間の日次・月次上限を判定する期間キー。月次では対象月の1日を保存する';

COMMENT ON COLUMN public.support_point_logs.base_points IS
    'ポイント付与時点の基礎ポイント';

COMMENT ON COLUMN public.support_point_logs.plan_multiplier IS
    'ポイント付与時点に適用した会員プラン倍率';

COMMENT ON COLUMN public.support_point_logs.oshi_multiplier IS
    'ポイント付与時点に適用した推し倍率';

COMMENT ON COLUMN public.support_point_logs.reversal_of_log_id IS
    '取消対象となった元ポイントログのID';

-- 1回の応援行動から同じジュニアへ重複してポイントを付与しない。
CREATE UNIQUE INDEX support_point_logs_event_junior_unique
ON public.support_point_logs (event_id, junior_id)
WHERE event_id IS NOT NULL;

-- 同じポイントログを複数回取り消さない。
CREATE UNIQUE INDEX support_point_logs_reversal_unique
ON public.support_point_logs (reversal_of_log_id)
WHERE reversal_of_log_id IS NOT NULL;

-- 日次・月次上限の判定と、イベント単位の集計に使用する。
CREATE INDEX support_point_logs_period_lookup_idx
ON public.support_point_logs (
    user_id,
    action_type,
    source_type,
    source_id,
    period_key,
    event_id
);

-- ランキング集計結果へフォローポイントを追加する。
ALTER TABLE public.ranking_scores
    ADD COLUMN follow_points integer NOT NULL DEFAULT 0;

ALTER TABLE public.ranking_scores
    ADD CONSTRAINT ranking_scores_follow_points_check
        CHECK (follow_points >= 0),
    ADD CONSTRAINT ranking_scores_category_check
        CHECK (category IN ('group_affiliated', 'independent'));

COMMENT ON COLUMN public.ranking_scores.follow_points IS
    '有効なフォロー行動から獲得した累積ポイント';

COMMENT ON COLUMN public.ranking_scores.category IS
    '現在の所属状況。group_affiliated: グループ所属、independent: 無所属';

-- ranking_scoresは履歴ではなく現在の集計結果を保持するため、1ジュニアにつき1行とする。
CREATE UNIQUE INDEX ranking_scores_junior_unique
ON public.ranking_scores (junior_id);

-- ユーザーと、現在フォロー中のジュニアとの関係を管理する。
CREATE TABLE public.follow_juniors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    junior_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT follow_juniors_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles (id)
        ON DELETE CASCADE,
    CONSTRAINT follow_juniors_junior_id_fkey
        FOREIGN KEY (junior_id)
        REFERENCES public.juniors (id)
        ON DELETE CASCADE,
    CONSTRAINT follow_juniors_user_junior_unique
        UNIQUE (user_id, junior_id)
);

COMMENT ON TABLE public.follow_juniors IS
    'ユーザーが現在フォローしているジュニアを管理する';

COMMENT ON COLUMN public.follow_juniors.created_at IS
    '現在のフォロー状態が開始した日時。再フォロー時は新しい日時になる';

-- 月次処理やジュニア別のフォロー集計に使用する。
CREATE INDEX follow_juniors_junior_id_idx
ON public.follow_juniors (junior_id);

ALTER TABLE public.follow_juniors ENABLE ROW LEVEL SECURITY;

-- 一般ユーザーは自分のフォロー状態だけを読み取れる。
-- 追加・解除は、ポイント処理と同じトランザクションで実行する専用RPCに限定する。
REVOKE ALL ON TABLE public.follow_juniors FROM anon, authenticated;
GRANT SELECT ON TABLE public.follow_juniors TO authenticated;

CREATE POLICY "Users can read their own follows"
ON public.follow_juniors
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 会員プラン倍率は推しポイント以外の応援行動にも使うため、役割に合う名前へ変更する。
ALTER TABLE public.plans
    RENAME COLUMN oshi_point_multiplier TO point_multiplier;

ALTER TABLE public.plans
    ADD CONSTRAINT plans_point_multiplier_check
        CHECK (point_multiplier > 0);

COMMENT ON COLUMN public.plans.point_multiplier IS
    '応援課金を除くランキング対象行動へ適用する会員プラン倍率';
