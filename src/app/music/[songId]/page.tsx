import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import MusicDetailClient from "./MusicDetailClient";

type MusicDetailPageProps = {
  params: Promise<{ songId: string }>;
};

type SongJuniorRow = {
  junior_id: string | null;
  juniors: { name: string | null } | null;
  group_id: string | null;
  groups: { name: string | null } | null;
};

type SongRow = {
  id: string;
  title: string;
  audio_path: string | null;
  image_path: string | null;
  play_count: number | null;
  published_at: string | null;
  lyricist: string | null;
  composer: string | null;
  lyrics: string | null;
  song_juniors: SongJuniorRow[] | null;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { name: string | null } | null;
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

  // 総いいね数の取得
  const { count: likesCount } = await supabase
    .from("song_likes")
    .select("*", { count: "exact", head: true })
    .eq("song_id", songId);

  // すべての楽曲データのフェッチ
  const { data: allSongsRaw, error: allSongsError } = await supabase
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
    `);

  if (allSongsError) {
    throw new Error(allSongsError.message);
  }

  // 楽曲解決用のヘルパー関数
  const formatSong = (s: SongRow) => {
    let songGroups: string[] = [];
    let songJuniors: string[] = [];
    let groupsDetail: { id: string; name: string }[] = [];
    let juniorsDetail: { id: string; name: string }[] = [];

    if (s.song_juniors && s.song_juniors.length > 0) {
      const groupMap = new Map<string, string>();
      const juniorMap = new Map<string, string>();

      s.song_juniors.forEach((sj) => {
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
    let audioFilePath = s.audio_path || "";
    if (audioFilePath && !audioFilePath.startsWith("http") && !audioFilePath.startsWith("/")) {
      const { data } = supabase.storage.from("audio").getPublicUrl(audioFilePath);
      audioFilePath = data.publicUrl;
    }

    // image_path の解決
    let imagePath = s.image_path || "/music_cover_img.png";
    if (imagePath && !imagePath.startsWith("http") && !imagePath.startsWith("/")) {
      const { data } = supabase.storage.from("images").getPublicUrl(imagePath);
      imagePath = data.publicUrl;
    }

    return {
      id: s.id,
      title: s.title,
      audioFilePath,
      imagePath,
      artistName,
      playCount: s.play_count ?? undefined,
      publishedAt: s.published_at ?? undefined,
      juniors: songJuniors,
      groups: songGroups,
      lyricist: s.lyricist,
      composer: s.composer,
      lyrics: s.lyrics,
      groupsDetail,
      juniorsDetail,
    };
  };

  const mainSongFormatted = formatSong(song as SongRow);
  const formattedSong = {
    ...mainSongFormatted,
    likesCount: likesCount || 0,
    isLiked,
  };

  const formattedAllSongs = ((allSongsRaw || []) as SongRow[]).map((s) => {
    const formatted = formatSong(s);
    return {
      id: formatted.id,
      title: formatted.title,
      audioFilePath: formatted.audioFilePath,
      imagePath: formatted.imagePath,
      artistName: formatted.artistName,
      playCount: formatted.playCount,
      publishedAt: formatted.publishedAt,
      juniors: formatted.juniors,
      groups: formatted.groups,
      lyricist: formatted.lyricist,
      composer: formatted.composer,
      lyrics: formatted.lyrics,
    };
  });

  const formattedComments = ((comments || []) as CommentRow[]).map((c) => ({
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
      allSongs={formattedAllSongs}
      initialComments={formattedComments}
      groupsDetail={mainSongFormatted.groupsDetail}
      juniorsDetail={mainSongFormatted.juniorsDetail}
    />
  );
}
