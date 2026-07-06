"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./JuniorDetail.module.css";
import { type Song, usePlayerStore } from "@/stores/playerStore";
import { useLikeStore } from "@/stores/likeStore";
import { Heart } from "@/components/Svgs";

interface JuniorDetail {
  id: string;
  name: string;
  nameEn: string | null;
  profile: string | null;
  birthDate: string | null;
  joinDate: string | null;
  birthplace: string | null;
  height: number | null;
  region: string | null;
  catchphrase: string | null;
  imageUrl: string | null;
  groupName: string | null;
  songs: Song[];
}

interface JuniorDetailClientProps {
  junior: JuniorDetail;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "不明";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

const calculateAge = (birthDateStr: string | null) => {
  if (!birthDateStr) return "不明";
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return "不明";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age}歳`;
};

export default function JuniorDetailClient({ junior }: JuniorDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "blog">("profile");

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
    playSong(song, junior.songs);
  };

  const handleLike = async (songId: string) => {
    const result = await toggleLike(songId);
    if (result === null) {
      if (confirm("いいねをするにはログインが必要です。ログインページへ移動しますか？")) {
        router.push("/login");
      }
    }
  };

  return (
    <div className={styles.page}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "profile" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          プロフィール
        </button>
        <button
          className={`${styles.tab} ${activeTab === "blog" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("blog")}
        >
          ブログ
        </button>
      </div>

      {activeTab === "profile" && (
        <>
          {/* Profile card */}
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {junior.imageUrl ? (
                <img src={junior.imageUrl} alt={junior.name} className={styles.avatarImg} />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.5c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
                </svg>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1>{junior.name}</h1>
              <p className={styles.romaji}>{junior.nameEn || ""}</p>
              <dl className={styles.infoTable}>
                <dt>入社日</dt>
                <dd>{formatDate(junior.joinDate)}</dd>
                <dt>誕生日</dt>
                <dd>{formatDate(junior.birthDate)}</dd>
                <dt>年齢</dt>
                <dd>{calculateAge(junior.birthDate)}</dd>
                <dt>身長</dt>
                <dd>{junior.height ? `${junior.height}cm` : "不明"}</dd>
                <dt>出身地</dt>
                <dd>{junior.birthplace || "不明"}</dd>
                <dt>所属</dt>
                <dd>{junior.groupName || "無所属"}</dd>
              </dl>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>MUSIC</h2>
          <div className={styles.sectionTitleUnderline}></div>

          <div className={styles.trackList}>
            {junior.songs && junior.songs.length > 0 ? (
              junior.songs.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id;
                const isCurrentPlaying = isCurrentSong && isPlaying;
                const isLiked = likedSongIds.includes(song.id);
                
                // profile 1.html の track-art グラデーションを再現するためのクラス指定
                const artClass = styles[`art${(index % 4) + 1}`];

                return (
                  <div className={styles.track} key={song.id}>
                    {song.imagePath ? (
                      <img src={song.imagePath} alt={song.title} className={styles.trackArt} />
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
        </>
      )}

      {activeTab === "blog" && (
        <div className={styles.blogSection}>
          <h2 className={styles.sectionTitle}>BLOG</h2>
          <div className={styles.sectionTitleUnderline}></div>
          <p className={styles.blogPlaceholder}>ブログは準備中です。</p>
        </div>
      )}
    </div>
  );
}
