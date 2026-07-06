"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Song, usePlayerStore } from "../../../stores/playerStore";
import { useLikeStore } from "../../../stores/likeStore";
import "../../globals.css";

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

type JuniorDetailPageProps = {
  params: Promise<{ juniorId: string }>;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "不明";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

export default function Page({ params }: JuniorDetailPageProps) {
  const { juniorId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [junior, setJunior] = useState<JuniorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プレイヤー関連のストア
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  // いいね関連のストア
  const toggleLike = useLikeStore((state) => state.toggleLike);
  const likedSongIds = useLikeStore((state) => state.likedSongIds);
  const fetchLikes = useLikeStore((state) => state.fetchLikes);

  useEffect(() => {
    const fetchJuniorDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/juniors/${juniorId}`);
        if (!res.ok) {
          throw new Error("ジュニア情報の取得に失敗しました。");
        }
        const data = await res.json();
        setJunior(data.junior);
        setError(null);
      } catch (err: any) {
        setError(err.message || "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchJuniorDetail();
    fetchLikes();
  }, [juniorId, fetchLikes]);

  const handlePlay = (song: Song) => {
    if (!junior) return;
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", fontSize: "20px", color: "#aaa" }}>
        読み込み中...
      </div>
    );
  }

  if (error || !junior) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", fontSize: "20px", color: "red" }}>
        {error || "ジュニアが見つかりません。"}
      </div>
    );
  }

  return (
    <>
      <main className="idol-detail-page">
        {/* タブ */}
        <section className="idol-tab">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            プロフィール
          </button>

          <button
            className={activeTab === "blog" ? "active" : ""}
            onClick={() => setActiveTab("blog")}
          >
            ブログ
          </button>
        </section>

        {activeTab === "profile" && (
          <>
            {/* プロフィール */}
            <section className="idol-profile-card">
              <div className="idol-image">
                {junior.imageUrl ? (
                  <img src={junior.imageUrl} alt={junior.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ececec", fontSize: "48px", color: "#aaa" }}>👤</div>
                )}
              </div>

              <div className="idol-info">
                <h1>{junior.name}</h1>
                <p className="idol-english-name">{junior.nameEn || ""}</p>

                <div className="idol-detail-list">
                  <p>
                    <span>入所日</span>
                    {formatDate(junior.joinDate)}
                  </p>

                  <p>
                    <span>誕生日</span>
                    {formatDate(junior.birthDate)}
                  </p>

                  <p>
                    <span>身長</span>
                    {junior.height ? `${junior.height}cm` : "未登録"}
                    <span className="second-label">出身地</span>
                    {junior.birthplace || "不明"}
                  </p>

                  <p>
                    <span>所属</span>
                    {junior.groupName || "無所属"}
                  </p>

                  {junior.catchphrase && (
                    <p>
                      <span>キャッチフレーズ</span>
                      {junior.catchphrase}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* MUSIC */}
            <section className="music-section">
              <h2>MUSIC</h2>

              <div className="music-list">
                {junior.songs && junior.songs.length > 0 ? (
                  junior.songs.map((song) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    const isCurrentPlaying = isCurrentSong && isPlaying;
                    const isLiked = likedSongIds.includes(song.id);

                    return (
                      <div className="music-card" key={song.id}>
                        <div className="music-thumbnail">
                          {song.imagePath ? (
                            <img src={song.imagePath} alt={song.title} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ececec", fontSize: "24px" }}>🎵</div>
                          )}
                        </div>

                        <div className="music-text">
                          <Link href={`/music/${song.id}`}>
                            <h3>{song.title}</h3>
                          </Link>
                          <p>{song.artistName}</p>
                        </div>

                        <div className="music-actions" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                          <button 
                            className="like-button"
                            onClick={() => handleLike(song.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: isLiked ? "#E8447A" : "#ccc" }}
                            aria-label={isLiked ? "お気に入りから削除" : "お気に入りに追加"}
                          >
                            ♥
                          </button>
                          <button 
                            className="play-button"
                            onClick={() => handlePlay(song)}
                            aria-label={`${song.title}を${isCurrentPlaying ? "一時停止" : "再生"}`}
                          >
                            {isCurrentPlaying ? "⏸" : "▶"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: "center", fontSize: "18px", color: "#888", marginTop: "20px" }}>楽曲情報が登録されていません。</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "blog" && (
          <section className="blog-section">
            <h2 className="blog-title">BLOG</h2>

            <p style={{ fontSize: "20px", color: "#888", textAlign: "center", margin: "40px 0" }}>
              ブログは準備中です。
            </p>
          </section>
        )}
      </main>

      <style jsx>{`
.idol-detail-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px 100px;
}

.idol-tab {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.idol-tab button {
  width: 360px;
  height: 56px;
  border: none;
  border-bottom: 2px solid #d9d9d9;
  background: transparent;
  font-size: 40px;
  cursor: pointer;
}

.idol-tab button.active {
  border-bottom: 2px solid #000;
}

.idol-profile-card {
  border: 1px solid #222;
  padding: 40px;
  display: flex;
  gap: 50px;
  margin-bottom: 80px;
  background: white;
}

.idol-image {
  width: 350px;
  height: 500px;
  flex-shrink: 0;
  overflow: hidden;
  background: #ececec;
}

.idol-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.idol-info {
  flex: 1;
}

.idol-info h1 {
  font-size: 54px;
  margin-bottom: 10px;
  font-weight: 500;
}

.idol-english-name {
  font-size: 20px;
  margin-bottom: 40px;
}

.idol-detail-list p {
  font-size: 22px;
  margin-bottom: 15px;
  line-height: 1.7;
}

.idol-detail-list span {
  display: inline-block;
  width: 180px;
  font-weight: 500;
}

.second-label {
  width: auto !important;
  margin-left: 50px;
  margin-right: 20px;
}

.music-section h2 {
  text-align: center;
  font-size: 56px;
  font-weight: 500;
  margin-bottom: 40px;
}

.music-list {
  max-width: 900px;
  margin: 0 auto;
}

.music-card {
  display: flex;
  align-items: center;
  border: 1px solid #222;
  min-height: 140px;
  padding: 20px;
  margin-bottom: 15px;
}

.music-thumbnail {
  width: 120px;
  height: 120px;
  border-radius: 18px;
  overflow: hidden;
  background: #ececec;
  flex-shrink: 0;
}

.music-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-text {
  margin-left: 30px;
  flex: 1;
}

.music-text h3 {
  font-size: 28px;
  margin-bottom: 10px;
  font-weight: 500;
}

.music-text p {
  font-size: 22px;
}

.play-button {
  width: 70px;
  height: 70px;
  border: none;
  background: transparent;
  font-size: 40px;
  color: #d9d9d9;
  cursor: pointer;
}

.play-button:hover {
  color: #e8447a;
}

.blog-section {
  text-align: center;
  margin-bottom: 40px;
}

.blog-title {
  text-align: center;
  font-size: 40px;
  font-weight: 500;
  margin-bottom: 35px;
}

@media (max-width: 768px) {
  .idol-profile-card {
    flex-direction: column;
    align-items: center;
  }

  .idol-image {
    width: 220px;
    height: 300px;
  }

  .idol-info h1 {
    font-size: 38px;
  }

  .idol-tab button {
    font-size: 28px;
    width: 50%;
  }

  .music-section h2 {
    font-size: 40px;
  }

  .music-text h3 {
    font-size: 22px;
  }

  .music-text p {
    font-size: 18px;
  }
}
`}</style>
    </>
  );
}