-- MUSIC FRONTLINEのグループ用デモデータ。
-- 同じIDで再実行した場合は、既存行を最新の内容へ更新する。

INSERT INTO public.groups (
    id,
    name,
    description,
    image_path
)
VALUES
    (
        '8eaf6f2d-c09e-4a83-a55e-8f9a6bf0dc01',
        'ACEes',
        NULL,
        'ACEes.jpg'
    ),
    (
        '117a12e8-7e76-46f4-93ac-fcd68130dc02',
        'KEY TO LIT',
        NULL,
        'KEY TO LIT.jpg'
    ),
    (
        '68ac9c77-a673-45ba-9091-cef7e1c0dc03',
        'B&ZAI',
        NULL,
        'B&ZAI.jpg'
    ),
    (
        '99f30cd4-c9fc-445f-9567-b35875e0dc04',
        'AmBitious',
        NULL,
        'AmBitious.jpg'
    ),
    (
        'c15fa4b5-a109-424c-8810-552f9270dc05',
        'Boys be',
        NULL,
        'Boys be.jpg'
    )
ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_path = EXCLUDED.image_path,
    updated_at = now();
