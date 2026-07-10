-- プロフィールに推しカラーを保存する。

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS color_code text NOT NULL DEFAULT '#F8BBD0';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_color_code_format_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_color_code_format_check
CHECK (color_code ~ '^#[0-9A-Fa-f]{6}$');
