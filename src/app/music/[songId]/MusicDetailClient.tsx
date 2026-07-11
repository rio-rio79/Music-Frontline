"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { type Song, usePlayerStore } from "../../../stores/playerStore";
import { useLikeStore } from "../../../stores/likeStore";
import { GraySmallHeart, ThmbSvg, GraySmallPlayMusic, StartMusic, StopMusic } from "@/components/Svgs";

type CommentType = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userName: string;
  canDelete: boolean;
};

type GroupDetail = {
  id: string;
  name: string;
};

type JuniorDetail = {
  id: string;
  name: string;
};

type MusicDetailClientProps = {
  song: Song;
  allSongs: Song[];
  initialComments: CommentType[];
  groupsDetail: GroupDetail[];
  juniorsDetail: JuniorDetail[];
};

type TabType = "info" | "comments";

export default function MusicDetailClient({
  song,
  allSongs,
  initialComments,
  groupsDetail,
  juniorsDetail,
}: MusicDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("comments");
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(song.likesCount || 0);
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playSong = usePlayerStore((state) => state.playSong);

  const likedSongIds = useLikeStore((state) => state.likedSongIds);
  const toggleLikeStore = useLikeStore((state) => state.toggleLike);
  const fetchLikes = useLikeStore((state) => state.fetchLikes);
  const isLoggedIn = useLikeStore((state) => state.isLoggedIn);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  // 再生曲が切り替わった際のURL自動追従
  const prevCurrentSongIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentSong && prevCurrentSongIdRef.current === song.id && currentSong.id !== song.id) {
      router.replace(`/music/${currentSong.id}`);
    }
    prevCurrentSongIdRef.current = currentSong?.id ?? null;
  }, [currentSong, song.id, router]);

  const isLiked = likedSongIds.includes(song.id);

  const handleLikeToggle = async () => {
    if (!isLoggedIn) {
      alert("いいねするにはログインが必要です。");
      return;
    }
    const newLiked = await toggleLikeStore(song.id);
    if (newLiked !== null) {
      setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isLoggedIn) {
      alert("コメントするにはログインが必要です。");
      return;
    }
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/songs/${song.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: newComment }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "コメントの送信に失敗しました。");
      }
      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "コメントの送信に失敗しました。");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("本当にこのコメントを削除しますか？")) return;
    try {
      const res = await fetch(`/api/songs/${song.id}/comments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "コメントの削除に失敗しました。");
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "コメントの削除に失敗しました。");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
  };

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentPlaying = isCurrentSong && isPlaying;

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
      return;
    }
    // 別の曲を再生する場合、または未再生から再生を開始する場合、キューとして全曲リストを渡す
    playSong(song, allSongs);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />

      <div className="bodyWrapper">
        <div className="content">

          {/* Main Player Card */}
          <div className="mainCard">
            <button className="lyricBtn" onClick={() => setShowLyricsModal(true)}>歌詞表示</button>

            <div className="topRow">
              <div className="musicImg">
                {song.imagePath ? (
                  <Image src={song.imagePath} alt={song.title} width={130} height={130} style={{ objectFit: "cover", borderRadius: "10px" }} />
                ) : (
                  <ThmbSvg />
                )}
              </div>

              <div className="trackInfo">
                <div className="trackTitle">{song.title}</div>
                <div className="trackArtist">{song.artistName}</div>
                <div className="trackMeta">
                  <div className="metaItem">
                    <GraySmallPlayMusic />
                    {song.playCount?.toLocaleString() || 0}
                  </div>
                  <button
                    className="metaItem"
                    onClick={handleLikeToggle}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    aria-label="いいね"
                  >
                    <GraySmallHeart color={isLiked ? "#E8447A" : "#888"} filled={isLiked} />
                    {likesCount.toLocaleString()}
                  </button>
                </div>
              </div>
            </div>

            {/* コントロール */}
            <div className="controls">
              <button
                type="button"
                className="playBtn"
                onClick={handlePlay}
                aria-label={`${song.title}を${isCurrentPlaying ? "一時停止" : "再生"}`}
              >
                {isCurrentPlaying ? <StopMusic color="white" /> : <StartMusic color="white" />}
              </button>
            </div>

            {/* タブ */}
            <div className="tabs">
              <div
                className={`tab ${activeTab === "info" ? "active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                楽曲情報
              </div>
              <div
                className={`tab ${activeTab === "comments" ? "active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                コメント
              </div>
            </div>
          </div>

          {/* 楽曲情報タブ */}
          {activeTab === "info" && (
            <div className="infoCard">
              <div className="infoRow">
                <div className="infoLbl">作詞者</div>
                <div className="infoVal">{song.lyricist || "不明"}</div>
              </div>
              <div className="infoRow">
                <div className="infoLbl">作曲者</div>
                <div className="infoVal">{song.composer || "不明"}</div>
              </div>
              <div className="infoRow">
                <div className="infoLbl">グループ / メンバー</div>
                <div className="genreTags">
                  {groupsDetail?.map((g) => (
                    <Link href={`/group/${g.id}`} key={g.id} className="groupTag">
                      {g.name}
                    </Link>
                  ))}
                  {juniorsDetail?.map((j) => (
                    <Link href={`/junior/${j.id}`} key={j.id} className="genreTag">
                      {j.name}
                    </Link>
                  ))}
                  {(!groupsDetail?.length && !juniorsDetail?.length) && (
                    <span className="genreTag">情報なし</span>
                  )}
                </div>
              </div>
              <div className="infoRow">
                <div className="infoLbl">初公開</div>
                <div className="infoVal">
                  {song.publishedAt ? (() => {
                    const d = new Date(song.publishedAt);
                    return isNaN(d.getTime()) ? song.publishedAt : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
                  })() : "不明"}
                </div>
              </div>
              <div className="infoRow">
                <div className="infoLbl">再生回数</div>
                <div className="infoVal">{song.playCount?.toLocaleString() || 0}回</div>
              </div>
            </div>
          )}

          {/* コメントタブ */}
          {activeTab === "comments" && (
            <div className="commentContainer">

              {/* コメント入力フォーム */}
              <div className="commentForm">
                <form onSubmit={handleCommentSubmit} className="inputWrapper">
                  <input
                    type="text"
                    placeholder={isLoggedIn ? "コメントを入力..." : "コメントするにはログインが必要です"}
                    className="commentInput"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!isLoggedIn || submittingComment}
                  />
                  <button
                    type="submit"
                    className="sendButton"
                    disabled={!isLoggedIn || submittingComment || !newComment.trim()}
                  >
                    {submittingComment ? "送信中" : "送信"}
                  </button>
                </form>
              </div>

              {/* コメント一覧 */}
              <div className="commentList">
                {comments.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#888", fontSize: "13px", padding: "20px 0" }}>
                    コメントはまだありません。
                  </div>
                ) : (
                  comments.map((c) => (
                    <div className="commentItem" key={c.id}>
                      <div className="commentUserRow">
                        <span className="commentUser">{c.userName}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="commentTime">{formatTimeAgo(c.createdAt)}</span>
                          {c.canDelete && (
                            <button
                              className="commentDeleteBtn"
                              onClick={() => handleCommentDelete(c.id)}
                              aria-label="コメントを削除"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="commentText">
                        {c.body}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 歌詞モーダル */}
      {showLyricsModal && song && (
        <div className="modalOverlay" onClick={() => setShowLyricsModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div className="modalHeader">
              <h3>{song.title} - 歌詞</h3>
              <button className="closeModalBtn" onClick={() => setShowLyricsModal(false)}>✕</button>
            </div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", textAlign: "center", padding: "10px 0", color: "#333", fontSize: "15px", flex: 1, overflowY: "auto" }}>
              {song.lyrics || "歌詞データが登録されていません。"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const cssStyles = `
.notFoundSection {
  padding: 20px;
  text-align: center;
}

.bodyWrapper {
  font-family: -apple-system, "Hiragino Sans", "Yu Gothic", sans-serif;
  color: #1a1a2e;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
}

.content {
  padding: 0 14px 24px;
}

.mainCard {
  background: #fff;
  border: 1px solid #f0d8e8;
  border-radius: 14px;
  padding: 18px 16px 20px;
  position: relative;
}

.lyricBtn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #fff;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  color: #444;
  cursor: pointer;
  font-family: inherit;
}

.topRow {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.musicImg {
  width: 130px;
  height: 130px;
  flex-shrink: 0;
  background: #ffe8f2;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.trackInfo {
  flex: 1;
  padding-top: 28px;
}

.trackTitle {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 5px;
}

.trackArtist {
  font-size: 12px;
  color: #777;
  margin-bottom: 10px;
}

.trackMeta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.metaItem {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #888;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 0 6px;
}

.playBtn {
  width: 54px;
  height: 54px;
  padding: 0;
  border: none;
  background: #e8447a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.playBtn:hover {
  background: #d93b70;
}

.tabs {
  display: flex;
  border-bottom: 1.5px solid #e8d0dc;
  margin: 20px 0 0;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #aaa;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #e8447a;
  font-weight: 700;
}

.tab.active::after {
  content: "";
  position: absolute;
  bottom: -1.5px;
  left: 0;
  right: 0;
  height: 2.5px;
  background: #e8447a;
  border-radius: 2px 2px 0 0;
}

.infoCard {
  background: #fff;
  border: 1px solid #f0d8e8;
  border-radius: 14px;
  overflow: hidden;
  margin-top: 14px;
}

.infoRow {
  padding: 14px 18px;
  border-bottom: 1px solid #f5e8ee;
}

.infoRow:last-child {
  border-bottom: none;
}

.infoLbl {
  font-size: 11.5px;
  color: #aaa;
  margin-bottom: 5px;
}

.infoVal {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.genreTags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.genreTag {
  background: #fff;
  border: 1.5px solid #ddd;
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12.5px;
  color: #555;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.2s, border-color 0.2s;
}

.genreTag:hover {
  background-color: #f9f9f9;
  border-color: #bbb;
}

.groupTag {
  background-color: #fbeaf0;
  color: #993556;
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
  text-decoration: none;
  transition: opacity 0.2s;
}

.groupTag:hover {
  opacity: 0.8;
}

/* --- コメント関連 --- */
.commentContainer {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fff;
  border: 1px solid #f0d8e8;
  border-radius: 14px;
  padding: 16px;
}

.commentForm {
  background: #fff;
  border: 1px solid #fdf0f6;
  border-radius: 14px;
  padding: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.inputWrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.commentInput {
  flex: 1;
  border: 1px solid #e8d0dc;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 14px;
  outline: none;
  background: #fdf8fa;
}

.commentInput:focus {
  border-color: #e8447a;
  background: #fff;
}

.sendButton {
  background: #e8447a;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.sendButton:disabled {
  background: #e8d0dc;
  color: #fff;
  cursor: not-allowed;
}

.commentList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px; 
}

.commentItem {
  background: #fff;
  border: 1px solid #fdf0f6;
  border-radius: 12px;
  padding: 12px 14px;
}

.commentUserRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.commentUser {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.commentTime {
  font-size: 11px;
  color: #aaa;
}

.commentDeleteBtn {
  background: none;
  border: none;
  color: #e8447a;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.commentDeleteBtn:hover {
  background-color: #ffe3f1;
}

.commentText {
  font-size: 14px;
  color: #222;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

/* モーダル（ポップアップ）スタイル */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modalContent {
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
  padding: 20px 16px;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modalHeader h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.closeModalBtn {
  background: none;
  border: none;
  font-size: 18px;
  color: #888;
  cursor: pointer;
}
`;
