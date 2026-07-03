-- ランキングの読み取り権限と表示用ビューを作成する。

-- ランキング集計結果は全ユーザーが読み取れるが、一般ユーザーからは更新させない。
ALTER TABLE public.ranking_scores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ranking_scores FROM anon, authenticated;
GRANT SELECT ON TABLE public.ranking_scores TO anon, authenticated;

CREATE POLICY "Ranking scores are publicly readable"
ON public.ranking_scores
FOR SELECT
TO anon, authenticated
USING (true);

-- 2カテゴリそれぞれで同順位を許容し、次順位を飛ばすランキング表示用ビュー。
CREATE VIEW public.ranking_leaderboard
WITH (security_invoker = true)
AS
WITH leaderboard_source AS (
    SELECT
        CASE
            WHEN juniors.group_id IS NULL THEN 'independent'
            ELSE 'group_affiliated'
        END AS current_category,
        ranking_scores.junior_id,
        juniors.name AS junior_name,
        juniors.image_path AS junior_image_path,
        juniors.group_id,
        groups.name AS group_name,
        ranking_scores.score,
        ranking_scores.play_points,
        ranking_scores.blog_view_points,
        ranking_scores.like_points,
        ranking_scores.comment_points,
        ranking_scores.follow_points,
        ranking_scores.oshi_points,
        ranking_scores.payment_points,
        ranking_scores.calculated_at
    FROM public.ranking_scores
    JOIN public.juniors
        ON juniors.id = ranking_scores.junior_id
    LEFT JOIN public.groups
        ON groups.id = juniors.group_id
)
SELECT
    pg_catalog.rank() OVER (
        PARTITION BY leaderboard_source.current_category
        ORDER BY leaderboard_source.score DESC
    ) AS ranking_position,
    leaderboard_source.current_category AS category,
    leaderboard_source.junior_id,
    leaderboard_source.junior_name,
    leaderboard_source.junior_image_path,
    leaderboard_source.group_id,
    leaderboard_source.group_name,
    leaderboard_source.score,
    leaderboard_source.play_points,
    leaderboard_source.blog_view_points,
    leaderboard_source.like_points,
    leaderboard_source.comment_points,
    leaderboard_source.follow_points,
    leaderboard_source.oshi_points,
    leaderboard_source.payment_points,
    leaderboard_source.calculated_at
FROM leaderboard_source;

COMMENT ON VIEW public.ranking_leaderboard IS
    'グループ所属組・無所属組ごとに現在順位と行動別ポイントを返す公開ビュー';

REVOKE ALL ON TABLE public.ranking_leaderboard FROM anon, authenticated;
GRANT SELECT ON TABLE public.ranking_leaderboard TO anon, authenticated;
