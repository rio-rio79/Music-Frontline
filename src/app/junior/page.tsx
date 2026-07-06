import { createSupabaseServer } from "@/lib/supabase-server";
import JuniorListClient, { type JuniorItem, type GroupItem } from "./JuniorListClient";

export default async function JuniorTop() {
    const supabase = await createSupabaseServer();

    // ジュニアデータと所属グループ名、ランキングスコアを取得
    const [juniorsResult, groupsResult] = await Promise.all([
        supabase
            .from("juniors")
            .select(`
                id,
                name,
                image_path,
                created_at,
                group_id,
                groups (
                    name
                ),
                ranking_scores (
                    score
                )
            `),
        supabase
            .from("groups")
            .select("id, name, image_path, description, created_at")
            .order("name")
    ]);

    const juniorsData = juniorsResult.data ?? [];
    const groupsData = groupsResult.data ?? [];

    // ジュニアの画像 URL 解決と型変換
    const juniors: JuniorItem[] = juniorsData.map((junior) => {
        const imageUrl = junior.image_path
            ? supabase.storage.from("images").getPublicUrl(junior.image_path).data.publicUrl
            : null;

        // score は ranking_scores 配列から取得（無ければ0）
        const score = (junior.ranking_scores as any)?.[0]?.score ?? 0;
        const groupName = (junior.groups as any)?.name ?? null;

        return {
            id: junior.id,
            name: junior.name,
            imageUrl,
            createdAt: junior.created_at,
            score,
            groupName
        };
    });

    // グループの画像 URL 解決と型変換
    const groups: GroupItem[] = groupsData.map((group) => {
        const imageUrl = group.image_path
            ? supabase.storage.from("images").getPublicUrl(group.image_path).data.publicUrl
            : null;

        return {
            id: group.id,
            name: group.name,
            imageUrl,
            description: group.description,
            createdAt: group.created_at
        };
    });

    return (
        <section style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
            <JuniorListClient initialJuniors={juniors} initialGroups={groups} />
        </section>
    );
}
