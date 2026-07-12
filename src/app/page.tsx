import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveMusicCoverUrl } from "@/lib/music-assets";
import TopPageClient, {
  type FeaturedItem,
  type FeaturedTabKey,
} from "./TopPageClient";

type RelatedGroup = {
  name: string | null;
};

type RelatedJunior = {
  name: string | null;
  image_path?: string | null;
};

type SongRow = {
  id: string;
  title: string;
  image_path: string | null;
  published_at: string;
  play_count: number;
  song_juniors: {
    juniors: RelatedJunior | null;
    groups: RelatedGroup | null;
  }[] | null;
};

type BlogRow = {
  id: string;
  title: string;
  published_at: string;
  juniors: {
    name: string | null;
    image_path: string | null;
    region: string | null;
    groups: RelatedGroup | null;
  } | null;
};

type RankingRow = {
  junior_id: string | null;
  junior_name: string | null;
  junior_image_path: string | null;
  group_name: string | null;
  score: number | null;
};

type ProfileRow = {
  oshi_junior_id: string | null;
  plan: {
    monthly_price: number;
  } | null;
};

const PLACEHOLDER_IMAGE = null;

function resolvePublicImageUrl(
  path: string | null | undefined,
  getPublicUrl: (path: string) => string,
) {
  if (!path) return PLACEHOLDER_IMAGE;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return getPublicUrl(path);
}

function formatFeaturedDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function formatSongSubtitle(song: SongRow) {
  const groupNames = Array.from(
    new Set(
      (song.song_juniors ?? [])
        .map((item) => item.groups?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );
  if (groupNames.length > 0) return groupNames.join(" / ");

  const juniorNames = Array.from(
    new Set(
      (song.song_juniors ?? [])
        .map((item) => item.juniors?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );
  return juniorNames.length > 0 ? juniorNames.join(" / ") : "参加ジュニア未設定";
}

function formatBlogAffiliation(blog: BlogRow) {
  if (blog.juniors?.groups?.name) return blog.juniors.groups.name;
  if (blog.juniors?.region === "kanto") return "関東ジュニア";
  if (blog.juniors?.region === "kansai") return "関西ジュニア";
  return "無所属";
}

function createEmptyFeaturedState(): Record<FeaturedTabKey, FeaturedItem[]> {
  return {
    music: [],
    blog: [],
    ranking: [],
  };
}

export default async function TopPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const getImageUrl = (path: string) =>
    supabase.storage.from("images").getPublicUrl(path).data.publicUrl;

  const [
    profileResult,
    songsResult,
    blogsResult,
    rankingResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("oshi_junior_id, plan:plans(monthly_price)")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("songs")
      .select(`
        id,
        title,
        image_path,
        published_at,
        play_count,
        song_juniors (
          juniors (
            name
          ),
          groups (
            name
          )
        )
      `)
      .order("play_count", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        published_at,
        juniors (
          name,
          image_path,
          region,
          groups (
            name
          )
        )
      `)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("ranking_leaderboard")
      .select(`
        junior_id,
        junior_name,
        junior_image_path,
        group_name,
        score
      `)
      .order("score", { ascending: false })
      .order("junior_name", { ascending: true })
      .limit(3),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
  if (songsResult.error) {
    throw new Error(songsResult.error.message);
  }
  if (blogsResult.error) {
    throw new Error(blogsResult.error.message);
  }
  if (rankingResult.error) {
    throw new Error(rankingResult.error.message);
  }

  const profile = profileResult.data as unknown as ProfileRow | null;
  const songs = (songsResult.data ?? []) as unknown as SongRow[];
  const blogs = (blogsResult.data ?? []) as unknown as BlogRow[];
  const rankings = (rankingResult.data ?? []) as unknown as RankingRow[];

  const featuredItems = createEmptyFeaturedState();

  featuredItems.music = songs.map((song, index) => ({
    id: song.id,
    title: song.title,
    sub: formatSongSubtitle(song),
    meta: `${song.play_count.toLocaleString("ja-JP")} 再生`,
    href: `/music/${song.id}`,
    imageUrl: resolveMusicCoverUrl(song.image_path, getImageUrl),
    imageLabel: "MUSIC",
    badge: String(index + 1),
    rank: index + 1,
  }));

  featuredItems.blog = blogs.flatMap((blog): FeaturedItem[] => {
    if (!blog.juniors) return [];
    return [
      {
        id: blog.id,
        title: blog.title,
        sub: `${blog.juniors.name ?? "ジュニア"} / ${formatBlogAffiliation(blog)}`,
        meta: `${formatFeaturedDate(blog.published_at)} 投稿`,
        href: `/blog/${blog.id}`,
        imageUrl: resolvePublicImageUrl(blog.juniors.image_path, getImageUrl),
        imageLabel: "BLOG",
        badge: "NEW",
      },
    ];
  });

  featuredItems.ranking = rankings.flatMap((ranking, index): FeaturedItem[] => {
    if (!ranking.junior_id || !ranking.junior_name) return [];
    return [
      {
        id: ranking.junior_id,
        title: ranking.junior_name,
        sub: ranking.group_name ?? "無所属",
        meta: `${(ranking.score ?? 0).toLocaleString("ja-JP")} pt`,
        href: `/junior/${ranking.junior_id}`,
        imageUrl: resolvePublicImageUrl(ranking.junior_image_path, getImageUrl),
        imageLabel: "RANK",
        badge: String(index + 1),
        rank: index + 1,
      },
    ];
  });

  const showOshiCard = !profile?.oshi_junior_id;
  const monthlyPrice = profile?.plan?.monthly_price ?? 0;
  const showPlanCard = monthlyPrice < 1000;
  const isStandardPlan = monthlyPrice > 0 && monthlyPrice < 1000;

  return (
    <TopPageClient
      featuredItems={featuredItems}
      showOshiCard={showOshiCard}
      showPlanCard={showPlanCard}
      showLimitedBlogBenefit={!isStandardPlan}
      planCtaLabel={isStandardPlan ? "プランを変更する" : "プランを確認する"}
    />
  );
}
