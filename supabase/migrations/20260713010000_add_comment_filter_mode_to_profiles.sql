ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS comment_filter_mode text NOT NULL DEFAULT 'all';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_comment_filter_mode_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_comment_filter_mode_check
CHECK (comment_filter_mode IN ('all', 'hide_same_oshi', 'self_only'));
