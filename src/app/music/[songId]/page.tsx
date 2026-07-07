import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import MusicDetailClient from "./MusicDetailClient";

type MusicDetailPageProps = {
  params: Promise<{ songId: string }>;
};

export default async function MusicDetailPage({
  params,
}: MusicDetailPageProps) {
  const { songId } = await params;
  if (!songId) {
    notFound();
  }

  const supabase = await createSupabaseServer();

  // 1. 楽曲データのフェッチ
  const { data: song, error: songError } = await supabase
    .from("songs")
    .select(`
        id,
        title,
        audio_path,
        image_path,
        play_count,
        published_at,
        lyricist,
        composer,
        lyrics,
        song_juniors (
            junior_id,
            juniors (
                name
            ),
            group_id,
            groups (
                name
            )
        )
    `)
    .eq("id", songId)
    .single();

  if (songError || !song) {
    notFound();
  }

  // 2. コメントデータのフェッチ
  const { data: comments, error: commentsError } = await supabase
    .from("song_comments")
    .select(`
        id,
        body,
        created_at,
        user_id,
        profiles (
            name
        )
    `)
    .eq("song_id", songId)
    .order("created_at", { ascending: false });

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  // 3. ログインユーザーの取得
  const { data: { user } } = await supabase.auth.getUser();

  let isLiked = false;
  if (user) {
    const { data: existingLike } = await supabase
      .from("song_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .maybeSingle();
    if (existingLike) {
      isLiked = true;
    }
  }

  // グループ情報とジュニア情報の解決
  let songGroups: string[] = [];
  let songJuniors: string[] = [];
  let groupsDetail: { id: string; name: string }[] = [];
  let juniorsDetail: { id: string; name: string }[] = [];

  if (song.song_juniors && song.song_juniors.length > 0) {
    const groupMap = new Map<string, string>();
    const juniorMap = new Map<string, string>();

    song.song_juniors.forEach((sj) => {
      if (sj.group_id && sj.groups?.name) {
        groupMap.set(sj.group_id, sj.groups.name);
      }
      if (sj.junior_id && sj.juniors?.name) {
        juniorMap.set(sj.junior_id, sj.juniors.name);
      }
    });

    groupsDetail = Array.from(groupMap.entries()).map(([id, name]) => ({ id, name }));
    juniorsDetail = Array.from(juniorMap.entries()).map(([id, name]) => ({ id, name }));

    songGroups = groupsDetail.map((g) => g.name);
    songJuniors = juniorsDetail.map((j) => j.name);
  }

  const artistName = songGroups.length > 0 ? songGroups.join(", ") : (songJuniors.length > 0 ? songJuniors.join(", ") : "アーティスト名");

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
    .eq("song_id", songId);

  const formattedSong = {
    id: song.id,
    title: song.title,
    audioFilePath,
    imagePath,
    artistName,
    playCount: song.play_count,
    publishedAt: song.published_at,
    juniors: songJuniors,
    groups: songGroups,
    lyricist: song.lyricist,
    composer: song.composer,
    lyrics: song.lyrics,
    likesCount: likesCount || 0,
    isLiked,
  };

  const formattedComments = (comments || []).map((c: any) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    userId: c.user_id,
    userName: c.profiles?.name || "ユーザー",
    canDelete: user ? c.user_id === user.id : false,
  }));

  return (
    <MusicDetailClient
      key={songId}
      song={formattedSong}
      initialComments={formattedComments}
      currentUserId={user ? user.id : null}
      groupsDetail={groupsDetail}
      juniorsDetail={juniorsDetail}
    />
  );
}
