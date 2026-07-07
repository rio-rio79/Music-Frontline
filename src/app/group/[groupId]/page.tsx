import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import GroupDetailClient from "./GroupDetailClient";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function Page({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  if (!groupId) {
    notFound();
  }

  const supabase = await createSupabaseServer();

  // 1. グループ情報の取得
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, image_path, description")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    notFound();
  }

  // グループ画像URLの解決
  const groupImageUrl = group.image_path
    ? supabase.storage.from("images").getPublicUrl(group.image_path).data.publicUrl
    : null;

  // 2. 所属メンバー（ジュニア）の取得
  const { data: members, error: membersError } = await supabase
    .from("juniors")
    .select("id, name, name_en, image_path")
    .eq("group_id", groupId)
    .order("name");

  if (membersError) {
    throw new Error(membersError.message);
  }

  // メンバー画像URLの解決
  const formattedMembers = (members || []).map((m) => {
    const imageUrl = m.image_path
      ? supabase.storage.from("images").getPublicUrl(m.image_path).data.publicUrl
      : null;
    return {
      id: m.id,
      name: m.name,
      nameEn: m.name_en,
      imageUrl,
    };
  });

  // 3. グループに関連する楽曲情報の取得
  const { data: songGroups, error: songsError } = await supabase
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
    .eq("group_id", groupId);

  if (songsError) {
    throw new Error(songsError.message);
  }

  const rawSongs = (songGroups || [])
    .map((sg) => sg.songs)
    .filter(Boolean) as any[];

  // 重複排除（同じグループの複数メンバーが登録されている場合などで重複する可能性があるため）
  const uniqueSongsMap = new Map<string, any>();
  for (const song of rawSongs) {
    uniqueSongsMap.set(song.id, song);
  }
  const uniqueRawSongs = Array.from(uniqueSongsMap.values());

  // ログインユーザーの取得
  const { data: { user } } = await supabase.auth.getUser();

  // 各楽曲の詳細項目を解決
  const songs = await Promise.all(
    uniqueRawSongs.map(async (song) => {
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

      let songGroupsNames: string[] = [];
      let songJuniorsList: string[] = [];
      if (sjList) {
        songGroupsNames = Array.from(new Set(sjList.map((sj) => sj.groups?.name).filter(Boolean))) as string[];
        songJuniorsList = Array.from(new Set(sjList.map((sj) => sj.juniors?.name).filter(Boolean))) as string[];
      }
      const artistName = songGroupsNames.length > 0
        ? songGroupsNames.join(", ")
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
        groups: songGroupsNames,
        lyricist: song.lyricist,
        composer: song.composer,
        lyrics: song.lyrics,
        likesCount: likesCount || 0,
        isLiked,
      };
    })
  );

  const formattedGroup = {
    id: group.id,
    name: group.name,
    description: group.description,
    imageUrl: groupImageUrl,
    members: formattedMembers,
    songs,
  };

  return <GroupDetailClient group={formattedGroup} />;
}
