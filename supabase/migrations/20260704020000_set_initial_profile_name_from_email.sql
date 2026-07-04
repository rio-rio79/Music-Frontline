-- 新規登録時に作成されたプロフィールの初期ユーザーネームを、
-- メールアドレスの @ より前へ揃える。
-- 既存ユーザーのうち、初期値の「ユーザー」から未変更の行も移行する。
UPDATE public.profiles AS profiles
SET
    name = pg_catalog.split_part(users.email, '@', 1),
    updated_at = pg_catalog.now()
FROM auth.users AS users
WHERE profiles.id = users.id
  AND profiles.name = 'ユーザー'
  AND users.email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_initial_profile_name_from_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
    UPDATE public.profiles
    SET
        name = pg_catalog.split_part(NEW.email, '@', 1),
        updated_at = pg_catalog.now()
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

-- PostgreSQLでは同じタイミングのトリガーは名前順で実行される。
-- 既存の on_auth_user_created でプロフィールが作成された後に実行する。
DROP TRIGGER IF EXISTS zz_set_initial_profile_name_from_email ON auth.users;

CREATE TRIGGER zz_set_initial_profile_name_from_email
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_initial_profile_name_from_email();
