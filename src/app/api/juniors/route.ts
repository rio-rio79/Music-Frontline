import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim().toLowerCase() || "";
        const tab = searchParams.get("tab") || "personal";
        const sort = searchParams.get("sort") || "new";

        const supabase = await createSupabaseServer();

        if (tab === "personal") {
            const { data: juniorsData, error } = await supabase
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
                `);

            if (error) {
                return Response.json({ error: error.message }, { status: 500 });
            }

            // 画像の解決とデータ整形
            let juniors = juniorsData.map((junior) => {
                const imageUrl = junior.image_path
                    ? supabase.storage.from("images").getPublicUrl(junior.image_path).data.publicUrl
                    : null;

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

            // 検索フィルタリング（名前またはグループ名）
            if (q) {
                juniors = juniors.filter(
                    (j) => j.name.toLowerCase().includes(q) || (j.groupName && j.groupName.toLowerCase().includes(q))
                );
            }

            // ソート
            if (sort === "fifty") {
                juniors.sort((a, b) => a.name.localeCompare(b.name, "ja"));
            } else if (sort === "popular") {
                juniors.sort((a, b) => b.score - a.score);
            } else if (sort === "new") {
                juniors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }

            return Response.json({ juniors });
        } else {
            // グループタブ
            const { data: groupsData, error } = await supabase
                .from("groups")
                .select("id, name, image_path, description, created_at");

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
                    createdAt: group.created_at
                };
            });

            // 検索フィルタリング
            if (q) {
                groups = groups.filter((g) => g.name.toLowerCase().includes(q));
            }

            // ソート
            if (sort === "fifty") {
                groups.sort((a, b) => a.name.localeCompare(b.name, "ja"));
            } else {
                groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }

            return Response.json({ groups });
        }
    } catch (e: any) {
        return Response.json({ error: e.message || "Server error" }, { status: 500 });
    }
}
