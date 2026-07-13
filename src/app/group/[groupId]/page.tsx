import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveMusicCoverUrl } from "@/lib/music-assets";
import { notFound } from "next/navigation";
import GroupDetailClient from "./GroupDetailClient";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
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
};

export default async function Page({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  if (!groupId) {
    notFound();
  }

  const supabase = await createSupabaseServer();
  const getMusicCoverUrl = (path: string) =>
    supabase.storage.from("images").getPublicUrl(path).data.publicUrl;

  // 1. グループ情報の取得
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, image_path, description, is_disbanded")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    notFound();
  }

  // グループ画像URLの解決
  const groupImageUrl = group.image_path
    ? supabase.storage.from("images").getPublicUrl(group.image_path).data.publicUrl
    : null;

  // 2. 所属メンバー（ジュニア）の取得（通常所属、または song_juniors からの逆引き）
  // 稼働中グループの場合は group_id から直接取得し、解散済みグループの場合は楽曲の歌唱履歴から逆引きする
  let uniqueRawMembers = [];

  if (group.is_disbanded) {
    const { data: songJuniorsData, error: membersError } = await supabase
      .from("song_juniors")
      .select(`
          juniors (
              id,
              name,
              name_en,
              image_path
          )
      `)
      .eq("group_id", groupId);

    if (membersError) {
      throw new Error(membersError.message);
    }

    const rawMembers = (songJuniorsData || [])
      .map((sj) => sj.juniors)
      .filter(Boolean) as { id: string; name: string; name_en: string | null; image_path: string | null }[];

    const uniqueMembersMap = new Map<string, typeof rawMembers[0]>();
    for (const member of rawMembers) {
      uniqueMembersMap.set(member.id, member);
    }
    uniqueRawMembers = Array.from(uniqueMembersMap.values());
    uniqueRawMembers.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  } else {
    const { data: members, error: membersError } = await supabase
      .from("juniors")
      .select("id, name, name_en, image_path")
      .eq("group_id", groupId)
      .order("name");

    if (membersError) {
      throw new Error(membersError.message);
    }
    uniqueRawMembers = members || [];
  }

  // メンバー画像URLの解決
  const formattedMembers = uniqueRawMembers.map((m) => {
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
    .filter(Boolean) as SongRow[];

  // 重複排除（同じグループの複数メンバーが登録されている場合などで重複する可能性があるため）
  const uniqueSongsMap = new Map<string, SongRow>();
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
      const imagePath = resolveMusicCoverUrl(song.image_path, getMusicCoverUrl);

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
        playCount: song.play_count ?? undefined,
        publishedAt: song.published_at ?? undefined,
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
    isDisbanded: group.is_disbanded,
  };

  return <GroupDetailClient group={formattedGroup} />;
}
