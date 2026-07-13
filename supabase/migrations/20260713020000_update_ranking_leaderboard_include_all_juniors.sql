-- ranking_leaderboardをjuniors起点に変更し、0ptのジュニアも表示対象にする。

CREATE OR REPLACE VIEW public.ranking_leaderboard
WITH (security_invoker = true)
AS
WITH leaderboard_source AS (
    SELECT
        CASE
            WHEN juniors.group_id IS NULL THEN 'independent'
            ELSE 'group_affiliated'
        END AS current_category,
        juniors.id AS junior_id,
        juniors.name AS junior_name,
        juniors.image_path AS junior_image_path,
        juniors.group_id,
        groups.name AS group_name,
        COALESCE(ranking_scores.score, 0) AS score,
        COALESCE(ranking_scores.play_points, 0) AS play_points,
        COALESCE(ranking_scores.blog_view_points, 0) AS blog_view_points,
        COALESCE(ranking_scores.like_points, 0) AS like_points,
        COALESCE(ranking_scores.comment_points, 0) AS comment_points,
        COALESCE(ranking_scores.follow_points, 0) AS follow_points,
        COALESCE(ranking_scores.oshi_points, 0) AS oshi_points,
        COALESCE(ranking_scores.payment_points, 0) AS payment_points,
        ranking_scores.calculated_at
    FROM public.juniors
    LEFT JOIN public.ranking_scores
        ON ranking_scores.junior_id = juniors.id
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
    'グループ所属組・無所属組ごとに現在順位と行動別ポイントを返す公開ビュー。未集計ジュニアは0ptとして返す。';

REVOKE ALL ON TABLE public.ranking_leaderboard FROM anon, authenticated;
GRANT SELECT ON TABLE public.ranking_leaderboard TO anon, authenticated;
