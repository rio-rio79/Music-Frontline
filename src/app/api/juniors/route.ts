import { createSupabaseServer } from "@/lib/supabase-server";
import { formatJuniorAffiliation } from "@/lib/junior-affiliation";
import { compareGroupName, compareJuniorListItems } from "@/lib/junior-sort";

type GroupRelation = { name: string | null } | null;
type RankingScoreRelation = { score: number | null };

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Server error";
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim().toLowerCase() || "";
        const tab = searchParams.get("tab") || "personal";
        const sort = searchParams.get("sort") || "fifty";
        const prioritizeOshi = searchParams.get("prioritizeOshi") === "true";

        const supabase = await createSupabaseServer();

        if (tab === "personal") {
            const { data: { user } } = await supabase.auth.getUser();
            let oshiJuniorId: string | null = null;

            if (user && prioritizeOshi) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("oshi_junior_id")
                    .eq("id", user.id)
                    .maybeSingle();

                oshiJuniorId = profileData?.oshi_junior_id ?? null;
            }

            const { data: juniorsData, error } = await supabase
                .from("juniors")
                .select(`
                    id,
                    name,
                    name_kana,
                    image_path,
                    region,
                    birth_date,
                    join_date,
                    created_at,
                    group_id,
                    groups (
                        name
                    ),
                    song_juniors (
                        groups (
                            name
                        )
                    ),
                    ranking_scores (
                        score
                    )
                `);

            if (error) {
                return Response.json({ error: error.message }, { status: 500 });
            }

            // 画像の解決とデータ整形
            let juniors = juniorsData.map((junior) => {
                const imageUrl = junior.image_path
                    ? supabase.storage.from("images").getPublicUrl(junior.image_path).data.publicUrl
                    : null;

                const rankingScores = junior.ranking_scores as RankingScoreRelation[] | null;
                const group = junior.groups as GroupRelation;
                const score = rankingScores?.[0]?.score ?? 0;
                const groupName = group?.name ?? null;

                // 過去に歌ったグループ（所属履歴）を抽出して重複排除
                const songJuniors = junior.song_juniors as { groups: { name: string | null } | null }[] | null;
                const pastGroups = songJuniors
                    ? Array.from(new Set(songJuniors.map(sj => sj.groups?.name).filter(Boolean))) as string[]
                    : [];

                return {
                    id: junior.id,
                    name: junior.name,
                    nameKana: junior.name_kana,
                    imageUrl,
                    createdAt: junior.created_at,
                    birthDate: junior.birth_date,
                    joinDate: junior.join_date,
                    score,
                    groupName,
                    region: junior.region,
                    affiliation: formatJuniorAffiliation(groupName, junior.region),
                    isOshi: junior.id === oshiJuniorId,
                    pastGroups,
                };
            });

            // 検索フィルタリング（名前、グループ名、所属表示、過去の所属グループ名のいずれか）
            if (q) {
                juniors = juniors.filter(
                    (j) => j.name.toLowerCase().includes(q)
                        || j.nameKana.toLowerCase().includes(q)
                        || (j.groupName && j.groupName.toLowerCase().includes(q))
                        || j.affiliation.toLowerCase().includes(q)
                        || j.pastGroups.some(name => name.toLowerCase().includes(q))
                );
            }

            // ソート
            juniors.sort((a, b) => compareJuniorListItems(a, b, sort));

            if (prioritizeOshi && oshiJuniorId) {
                juniors.sort((a, b) => Number(b.isOshi) - Number(a.isOshi));
            }

            return Response.json({ juniors });
        } else {
            // グループタブ
            const { data: groupsData, error } = await supabase
                .from("groups")
                .select("id, name, image_path, description, created_at, is_disbanded");

            if (error) {
                return Response.json({ error: error.message }, { status: 500 });
            }

            let groups = groupsData.map((group) => {
                const imageUrl = group.image_path
                    ? supabase.storage.from("images").getPublicUrl(group.image_path).data.publicUrl
                    : null;

                return {
                    id: group.id,
                    name: group.name,
                    imageUrl,
                    description: group.description,
                    createdAt: group.created_at,
                    isDisbanded: group.is_disbanded
                };
            });

            // 検索フィルタリング
            if (q) {
                groups = groups.filter((g) => g.name.toLowerCase().includes(q));
            }

            groups.sort(compareGroupName);

            return Response.json({ groups });
        }
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
