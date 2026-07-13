-- groups テーブルに解散判定フラグを追加する
ALTER TABLE public.groups ADD COLUMN is_disbanded boolean NOT NULL DEFAULT false;
