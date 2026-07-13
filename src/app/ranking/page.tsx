import { createSupabaseServer } from "@/lib/supabase-server";
import { formatJuniorAffiliation } from "@/lib/junior-affiliation";
import RankingClient, { type RankingItem } from "./RankingClient";

function resolvePublicImageUrl(path: string | null, fallback: string, getPublicUrl: (path: string) => string) {
  if (!path) return fallback;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return getPublicUrl(path);
}

export default async function RankingPage() {
  const supabase = await createSupabaseServer();

  // ログインユーザーの推しジュニアIDを取得
  const { data: { user } } = await supabase.auth.getUser();
  let oshiJuniorId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("oshi_junior_id")
      .eq("id", user.id)
      .maybeSingle();
    oshiJuniorId = profile?.oshi_junior_id ?? null;
  }

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
  const juniorIds = (data ?? [])
    .map((row) => row.junior_id)
    .filter((id): id is string => Boolean(id));
  const { data: juniorRegions, error: juniorRegionsError } = juniorIds.length > 0
    ? await supabase
        .from("juniors")
        .select("id, region")
        .in("id", juniorIds)
    : { data: [], error: null };

  if (juniorRegionsError) {
    throw new Error(juniorRegionsError.message);
  }

  const regionByJuniorId = new Map(
    (juniorRegions ?? []).map((junior) => [junior.id, junior.region]),
  );

  const rankings: RankingItem[] = (data ?? [])
    .filter((row) => row.junior_id && row.junior_name)
    .map((row) => ({
      rank: row.ranking_position ?? 0,
      category: row.category === "independent" ? "independent" : "group_affiliated",
      juniorId: row.junior_id as string,
      name: row.junior_name as string,
      imageUrl: resolvePublicImageUrl(row.junior_image_path, "/music_cover_img.png", getImageUrl),
      affiliation: formatJuniorAffiliation(row.group_name, regionByJuniorId.get(row.junior_id as string)),
      totalPoints: row.score ?? 0,
      isOshi: row.junior_id === oshiJuniorId,
    }));

  return <RankingClient rankings={rankings} />;
}
