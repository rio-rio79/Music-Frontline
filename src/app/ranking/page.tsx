import { createSupabaseServer } from "@/lib/supabase-server";
import RankingClient, { type RankingItem } from "./RankingClient";

function resolvePublicImageUrl(path: string | null, fallback: string, getPublicUrl: (path: string) => string) {
  if (!path) return fallback;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return getPublicUrl(path);
}

export default async function RankingPage() {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("ranking_leaderboard")
    .select(`
      ranking_position,
      category,
      junior_id,
      junior_name,
      junior_image_path,
      group_name,
      score
    `)
    .order("category", { ascending: true })
    .order("ranking_position", { ascending: true })
    .order("junior_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const getImageUrl = (path: string) => supabase.storage.from("images").getPublicUrl(path).data.publicUrl;

  const rankings: RankingItem[] = (data ?? [])
    .filter((row) => row.junior_id && row.junior_name)
    .map((row) => ({
      rank: row.ranking_position ?? 0,
      category: row.category === "independent" ? "independent" : "group_affiliated",
      juniorId: row.junior_id as string,
      name: row.junior_name as string,
      imageUrl: resolvePublicImageUrl(row.junior_image_path, "/music_cover_img.png", getImageUrl),
      affiliation: row.group_name ?? "無所属",
      totalPoints: row.score ?? 0,
    }));

  return <RankingClient rankings={rankings} />;
}
