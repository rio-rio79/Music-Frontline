-- 無所属ジュニアのプロフィールに、関東・関西の区分を表示できるようにする。
ALTER TABLE public.juniors
ADD COLUMN IF NOT EXISTS region text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'juniors_region_check'
          AND conrelid = 'public.juniors'::regclass
    ) THEN
        ALTER TABLE public.juniors
        ADD CONSTRAINT juniors_region_check
        CHECK (region IN ('kanto', 'kansai'));
    END IF;
END;
$$;

COMMENT ON COLUMN public.juniors.region IS
    '無所属ジュニアの活動地域。kanto: 関東ジュニア、kansai: 関西ジュニア。;
