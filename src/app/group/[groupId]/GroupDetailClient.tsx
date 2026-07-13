"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import styles from "./GroupDetail.module.css";
import Image from "next/image";
import { type Song, usePlayerStore } from "@/stores/playerStore";
import { useLikeStore } from "@/stores/likeStore";
import { Heart } from "@/components/Svgs";

interface Member {
  id: string;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  members: Member[];
  songs: Song[];
  isDisbanded: boolean;
}

interface GroupDetailClientProps {
  group: GroupDetail;
}

const gradients = [
  "linear-gradient(160deg,#7c6fd6 0%,#e79fc4 55%,#f6c9d9 100%)",
  "linear-gradient(160deg,#8b7fe0 0%,#d98fc0 55%,#f3c6cf 100%)",
  "linear-gradient(160deg,#6f8fd6 0%,#c79fd6 55%,#f0cfe0 100%)",
  "linear-gradient(160deg,#9a7bd0 0%,#e08aa8 55%,#f7c9c9 100%)",
  "linear-gradient(160deg,#5f7fce 0%,#a888d6 55%,#e7b9d6 100%)",
  "linear-gradient(160deg,#7c6fd6 0%,#d67ca0 55%,#f6b9c9 100%)",
];

const getGradientIndex = (id: string, length: number) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % length;
};

const personIconSvg = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.6 0-9.8 2.4-9.8 6.9v1.6h19.6v-1.6c0-4.5-6.2-6.9-9.8-6.9z" />
  </svg>
);

export default function GroupDetailClient({ group }: GroupDetailClientProps) {
  const router = useRouter();

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const toggleLike = useLikeStore((state) => state.toggleLike);
  const likedSongIds = useLikeStore((state) => state.likedSongIds);
  const fetchLikes = useLikeStore((state) => state.fetchLikes);

  // 初回マウント時にお気に入り情報を取得
  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    playSong(song, group.songs);
  };

  const handleLike = async (songId: string) => {
    const result = await toggleLike(songId);
    if (result === null) {
      if (confirm("いいねをするにはログインが必要です。ログインページへ移動しますか？")) {
        router.push("/login");
      }
    }
  };

  // グループ全体のグラデーション背景
  const groupGradIndex = getGradientIndex(group.id, gradients.length);
  const groupGradientStyle = {
    background: gradients[groupGradIndex],
  };

  return (
    <PageShell className={styles.page}>
      {/* Group photo and Title */}
      <h1 className={`${styles.sectionTitle} ${styles.groupTitle}`}>
        {group.name}
        {group.isDisbanded && (
          <span className={styles.disbandedBadge}>解散済</span>
        )}
      </h1>
      <div className={styles.sectionTitleUnderline}></div>

      <div className={styles.groupPhoto} style={group.imageUrl ? { position: "relative" } : groupGradientStyle}>
        {group.imageUrl ? (
          <Image src={group.imageUrl} alt={group.name} fill className={styles.groupPhotoImg} style={{ objectFit: 'cover' }} />
        ) : (
          <div className={styles.groupPhotoPlaceholder}>
            {personIconSvg}
          </div>
        )}
      </div>

      {group.description && (
        <p className={styles.groupDescription}>{group.description}</p>
      )}

      {/* Members */}
      <h2 className={styles.sectionTitle}>MEMBERS</h2>
      <div className={styles.sectionTitleUnderline}></div>

      <div className={styles.memberGrid}>
        {group.members && group.members.length > 0 ? (
          group.members.map((m) => {
            const gradIndex = getGradientIndex(m.id, gradients.length);
            const gradientStyle = {
              background: gradients[gradIndex],
            };

            return (
              <Link href={`/junior/${m.id}`} key={m.id} className={styles.memberCard}>
                <div className={styles.mAvatar} style={m.imageUrl ? { position: "relative" } : gradientStyle}>
                  {m.imageUrl ? (
                    <Image src={m.imageUrl} alt={m.name} fill className={styles.avatarImg} style={{ objectFit: "cover" }} />
                  ) : (
                    personIconSvg
                  )}
                </div>
                <div className={styles.mInfo}>
                  <div className={styles.mName}>{m.name}</div>
                  <div className={styles.mRomaji}>{m.nameEn || ""}</div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className={styles.noMembers}>所属メンバーが登録されていません。</p>
        )}
      </div>

      {/* Music */}
      <h2 className={styles.sectionTitle}>MUSIC</h2>
      <div className={styles.sectionTitleUnderline}></div>

      <div className={styles.trackList}>
        {group.songs && group.songs.length > 0 ? (
          group.songs.map((song, index) => {
            const isCurrentSong = currentSong?.id === song.id;
            const isCurrentPlaying = isCurrentSong && isPlaying;
            const isLiked = likedSongIds.includes(song.id);

            // アートワークプレースホルダー用のグラデーションクラス
            const artClass = styles[`art${(index % 4) + 1}`];

            return (
              <div className={styles.track} key={song.id}>
                {song.imagePath ? (
                  <Image src={song.imagePath} alt={song.title} width={64} height={64} className={styles.trackArt} style={{ objectFit: "cover" }} />
                ) : (
                  <div className={`${styles.trackArt} ${artClass}`} />
                )}
                <div className={styles.trackMeta}>
                  <Link href={`/music/${song.id}`} className={styles.trackLink}>
                    <div className={styles.trackTitle}>{song.title}</div>
                  </Link>
                  <div className={styles.trackArtist}>{song.artistName}</div>
                </div>
                <div className={styles.trackActions}>
                  <button
                    className={styles.likeBtn}
                    onClick={() => handleLike(song.id)}
                    aria-label={isLiked ? "お気に入りから削除" : "お気に入りに追加"}
                  >
                    <Heart filled={isLiked} />
                  </button>
                  <button
                    className={styles.playBtn}
                    onClick={() => handlePlay(song)}
                    aria-label={isCurrentPlaying ? "一時停止" : "再生"}
                  >
                    {isCurrentPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className={styles.playIcon} fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className={styles.noMusic}>楽曲情報が登録されていません。</p>
        )}
      </div>
    </PageShell>
  );
}
