import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import JuniorDetailClient from "./JuniorDetailClient";
import { getBlogListPage } from "@/lib/blog-data";

type JuniorDetailPageProps = {
  params: Promise<{ juniorId: string }>;
};

export default async function Page({ params }: JuniorDetailPageProps) {
  const { juniorId } = await params;
  if (!juniorId) {
    notFound();
  }

  const supabase = await createSupabaseServer();

  // 1. ジュニア情報の取得
  const { data: junior, error: juniorError } = await supabase
    .from("juniors")
    .select(`
        id,
        name,
        name_en,
        profile,
        birth_date,
        join_date,
        birthplace,
        height,
        region,
        catchphrase,
        image_path,
        group_id,
        groups (
            name
        )
    `)
    .eq("id", juniorId)
    .single();

  if (juniorError || !junior) {
    notFound();
  }

  // ジュニア画像URLの解決
  const juniorImageUrl = junior.image_path
    ? supabase.storage.from("images").getPublicUrl(junior.image_path).data.publicUrl
    : null;

  // 2. ジュニアに関連する楽曲情報の取得
  const { data: songJuniors, error: songsError } = await supabase
    .from("song_juniors")
    .select(`
        song_id,
        songs (
            id,
            title,
            audio_path,
            image_path,
            play_count,
            published_at,
            lyricist,
            composer,
            lyrics
        )
    `)
    .eq("junior_id", juniorId);

  if (songsError) {
    throw new Error(songsError.message);
  }

  const rawSongs = (songJuniors || [])
    .map((sj) => sj.songs)
    .filter(Boolean) as any[];

  // ログインユーザーの取得
  const { data: { user } } = await supabase.auth.getUser();

  // 各楽曲の詳細項目を解決
  const songs = await Promise.all(
    rawSongs.map(async (song) => {
      // audio_path の解決
      let audioFilePath = song.audio_path || "";
      if (audioFilePath && !audioFilePath.startsWith("http") && !audioFilePath.startsWith("/")) {
        const { data } = supabase.storage.from("audio").getPublicUrl(audioFilePath);
        audioFilePath = data.publicUrl;
      }

      // image_path の解決
      let imagePath = song.image_path || "/music_cover_img.png";
      if (imagePath && !imagePath.startsWith("http") && !imagePath.startsWith("/")) {
        const { data } = supabase.storage.from("images").getPublicUrl(imagePath);
        imagePath = data.publicUrl;
      }

      // 総いいね数の取得
      const { count: likesCount } = await supabase
        .from("song_likes")
        .select("*", { count: "exact", head: true })
        .eq("song_id", song.id);

      // ログインユーザーのいいね状態
      let isLiked = false;
      if (user) {
        const { data: existingLike } = await supabase
          .from("song_likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("song_id", song.id)
          .maybeSingle();
        if (existingLike) {
          isLiked = true;
        }
      }

      // アーティスト名の解決
      const { data: sjList } = await supabase
        .from("song_juniors")
        .select(`
            juniors ( name ),
            groups ( name )
        `)
        .eq("song_id", song.id);

      let songGroups: string[] = [];
      let songJuniorsList: string[] = [];
      if (sjList) {
        songGroups = Array.from(new Set(sjList.map((sj) => sj.groups?.name).filter(Boolean))) as string[];
        songJuniorsList = Array.from(new Set(sjList.map((sj) => sj.juniors?.name).filter(Boolean))) as string[];
      }
      const artistName = songGroups.length > 0
        ? songGroups.join(", ")
        : (songJuniorsList.length > 0 ? songJuniorsList.join(", ") : "アーティスト名");

      return {
        id: song.id,
        title: song.title,
        audioFilePath,
        imagePath,
        artistName,
        playCount: song.play_count,
        publishedAt: song.published_at,
        juniors: songJuniorsList,
        groups: songGroups,
        lyricist: song.lyricist,
        composer: song.composer,
        lyrics: song.lyrics,
        likesCount: likesCount || 0,
        isLiked,
      };
    })
  );

  // 3. ジュニアのブログ記事の取得
  const { posts: blogPosts } = await getBlogListPage({
    page: 1,
    pageSize: 10,
    tab: "all",
    authorId: juniorId,
  });

  const formattedJunior = {
    id: junior.id,
    name: junior.name,
    nameEn: junior.name_en,
    profile: junior.profile,
    birthDate: junior.birth_date,
    joinDate: junior.join_date,
    birthplace: junior.birthplace,
    height: junior.height,
    region: junior.region,
    catchphrase: junior.catchphrase,
    imageUrl: juniorImageUrl,
    groupName: (junior.groups as any)?.name ?? null,
    songs,
    blogPosts,
  };

  return <JuniorDetailClient junior={formattedJunior} />;
}