"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTabs from "@/components/PageTabs";
import styles from "./JuniorDetail.module.css";
import Image from "next/image";
import { type Song, usePlayerStore } from "@/stores/playerStore";
import { useLikeStore } from "@/stores/likeStore";
import { Heart, TwoPersonIcon } from "@/components/Svgs";
import BlogPostList from "@/app/blog/BlogPostList";
import { type BlogListItem } from "@/lib/blog-data";
import { formatJuniorAffiliation } from "@/lib/junior-affiliation";

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
  blogPosts: BlogListItem[];
}

interface JuniorDetailClientProps {
  junior: JuniorDetail;
}

const JUNIOR_DETAIL_TABS = [
  { key: "music", label: "Music" },
  { key: "blog", label: "Blog" },
] as const;

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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"music" | "blog">(
    searchParams.get("tab") === "blog" ? "blog" : "music",
  );
  const [followPending, setFollowPending] = useState(false);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const toggleLike = useLikeStore((state) => state.toggleLike);
  const likedSongIds = useLikeStore((state) => state.likedSongIds);
  const fetchLikes = useLikeStore((state) => state.fetchLikes);
  const fetchJuniorLikes = useLikeStore((state) => state.fetchJuniorLikes);
  const toggleJuniorLike = useLikeStore((state) => state.toggleJuniorLike);
  const likedJuniorIds = useLikeStore((state) => state.likedJuniorIds);
  const isFollowed = likedJuniorIds.includes(junior.id);
  const backHref = searchParams.get("from") === "ranking" ? "/ranking" : "/junior";
  const backLabel = searchParams.get("from") === "ranking" ? "ランキングに戻る" : "ジュニア一覧に戻る";

  // 初回マウント時にお気に入り情報を取得
  useEffect(() => {
    fetchLikes();
    fetchJuniorLikes();
  }, [fetchJuniorLikes, fetchLikes]);

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

  const handleFollow = async () => {
    if (followPending) return;
    setFollowPending(true);
    try {
      const result = await toggleJuniorLike(junior.id);
      if (result === null) {
        if (confirm("フォローするにはログインが必要です。ログインページへ移動しますか？")) {
          router.push("/login");
        }
      }
    } finally {
      setFollowPending(false);
    }
  };

  return (
    <PageShell className={styles.page}>
      <Link href={backHref} className={styles.backLink}>
        <span aria-hidden="true">‹</span>
        {backLabel}
      </Link>

      <div className={styles.profileCard}>
        <div className={styles.avatar} style={{ position: "relative" }}>
          {junior.imageUrl ? (
            <Image src={junior.imageUrl} alt={junior.name} className={styles.avatarImg} fill style={{ objectFit: "cover" }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.5c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          )}
        </div>
        <div className={styles.profileInfo}>
          <h1>{junior.name}</h1>
          <p className={styles.romaji}>{junior.nameEn || ""}</p>
          <button
            type="button"
            className={`${styles.followButton} ${isFollowed ? styles.followButtonActive : ""}`}
            onClick={handleFollow}
            disabled={followPending}
            aria-pressed={isFollowed}
          >
            <TwoPersonIcon />
            <span>{isFollowed ? "フォロー解除" : "フォローする"}</span>
          </button>
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
            <dd>{formatJuniorAffiliation(junior.groupName, junior.region)}</dd>
          </dl>
        </div>
      </div>

      <PageTabs
        items={JUNIOR_DETAIL_TABS}
        activeKey={activeTab}
        ariaLabel="ジュニア詳細メニュー"
        onChange={setActiveTab}
      />

      {activeTab === "music" && (
        <div role="tabpanel">
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
              <p className={styles.noMusic}>楽曲が見つかりません</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "blog" && (
        <div className={styles.blogSection} role="tabpanel">
          <BlogPostList
            posts={junior.blogPosts}
            emptyMessage={<p className={styles.blogPlaceholder}>ブログが見つかりません</p>}
            detailSource={`/junior/${junior.id}`}
          />
        </div>
      )}
    </PageShell>
  );
}
