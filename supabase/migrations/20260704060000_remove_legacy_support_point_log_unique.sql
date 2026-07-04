-- 旧制約は、同じ対象に対する取消ログや月次ログも重複扱いするため削除する。
-- 現在の重複防止は以下の専用インデックスで行う。
--   support_point_logs_event_junior_unique: 1イベント内の重複付与防止
--   support_point_logs_reversal_unique: 同じ元ログの二重取消防止
ALTER TABLE public.support_point_logs
    DROP CONSTRAINT IF EXISTS support_point_logs_source_type_source_id_junior_id_key;
