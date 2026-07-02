"use client"; // フックを使用するためクライアントコンポーネントにします

import { useRef, useState, use, useEffect } from "react";
import { type Song, usePlayerStore } from "../../../stores/playerStore"; // ストアをインポート
import { useLikeStore } from "../../../stores/likeStore"; // いいねストアを追加
import { GraySmallHeart, ThmbSvg, GraySmallPlayMusic, SkipBack, SkipForward, StartMusic, StopMusic } from "@/components/Svgs";

type MusicDetailPageProps = {
    params: Promise<{ id: string }>;
};

type TabType = "info" | "comments";

// スパチャの金額選択肢の型定義
type ScTier = {
    amount: number;
    colorClass: string;
};

// スパチャの金額設定（デザイン確認用）
const SC_TIERS: ScTier[] = [
    { amount: 200, colorClass: "tierBlue" },
    { amount: 500, colorClass: "tierCyan" },
    { amount: 1000, colorClass: "tierYellow" },
    { amount: 2000, colorClass: "tierOrange" },
    { amount: 5000, colorClass: "tierMagenta" },
    { amount: 10000, colorClass: "tierRed" },
];

export default function MusicDetailPage({
    params,
}: MusicDetailPageProps) {
    const { id } = use(params);
    const [activeTab, setActiveTab] = useState<TabType>("comments");

    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [likesCount, setLikesCount] = useState<number>(0);
    const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);

    // スパチャ用のステート（デザイン確認用）
    const [showScModal, setShowScModal] = useState<boolean>(false); // 金額選択モーダルの開閉
    const [selectedAmount, setSelectedAmount] = useState<ScTier | null>(null); // 選択された金額情報

    const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
    const seekPreviewTimeRef = useRef<number | null>(null);

    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const currentTime = usePlayerStore((state) => state.currentTime);
    const duration = usePlayerStore((state) => state.duration);
    const togglePlay = usePlayerStore((state) => state.togglePlay);
    const playSong = usePlayerStore((state) => state.playSong);
    const previous = usePlayerStore((state) => state.previous);
    const next = usePlayerStore((state) => state.next);
    const requestSeek = usePlayerStore((state) => state.requestSeek);

    const likedSongIds = useLikeStore((state) => state.likedSongIds);
    const toggleLikeStore = useLikeStore((state) => state.toggleLike);
    const fetchLikes = useLikeStore((state) => state.fetchLikes);
    const isLoggedIn = useLikeStore((state) => state.isLoggedIn);

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const res = await fetch(`/api/songs/${id}`);
                if (!res.ok) {
                    throw new Error("楽曲の取得に失敗しました。");
                }
                const data = await res.json();
                setSong(data.song);
                setLikesCount(data.song.likesCount || 0);
            } catch (err: any) {
                setError(err.message || "エラーが発生しました。");
            } finally {
                setLoading(false);
            }
        };
        fetchSong();
        fetchLikes();
    }, [id, fetchLikes]);

    const isLiked = song ? likedSongIds.includes(song.id) : false;

    const handleLikeToggle = async () => {
        if (!song) return;
        if (!isLoggedIn) {
            alert("いいねするにはログインが必要です。");
            return;
        }
        const newLiked = await toggleLikeStore(song.id);
        if (newLiked !== null) {
            setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
        }
    };

    if (loading) {
        return (
            <>
                <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
                <section className="notFoundSection">
                    <h1>読み込み中...</h1>
                </section>
            </>
        );
    }

    if (error || !song) {
        return (
            <>
                <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
                <section className="notFoundSection">
                    <h1>{error || "楽曲が見つかりません"}</h1>
                </section>
            </>
        );
    }

    const isCurrentSong = currentSong?.id === song.id;
    const isCurrentPlaying = isCurrentSong && isPlaying;

    const handlePlay = () => {
        if (isCurrentSong) {
            togglePlay();
            return;
        }
        playSong(song);
    };

    const updateSeekPreview = (time: number) => {
        const safeTime = Math.max(0, Math.min(time, duration));
        seekPreviewTimeRef.current = safeTime;
        setSeekPreviewTime(safeTime);
    };

    const commitSeek = () => {
        const time = seekPreviewTimeRef.current;
        if (time === null) return;
        requestSeek(time);
        seekPreviewTimeRef.current = null;
        setSeekPreviewTime(null);
    };

    const cancelSeek = () => {
        seekPreviewTimeRef.current = null;
        setSeekPreviewTime(null);
    };

    const handleSeekChange = (time: number) => {
        if (seekPreviewTimeRef.current !== null) {
            updateSeekPreview(time);
            return;
        }
        requestSeek(time);
    };

    const displayedTime = seekPreviewTime ?? currentTime;

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 金額を選択したときの処理（デザイン変更用）
    const handleSelectAmount = (tier: ScTier) => {
        setSelectedAmount(tier);
        setShowScModal(false);
    };

    // スパチャのキャンセル
    const handleCancelSc = () => {
        setSelectedAmount(null);
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
                                    <img src={song.imagePath} alt={song.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                                ) : (
                                    <ThmbSvg/>
                                )}
                            </div>

                            <div className="trackInfo">
                                <div className="trackTitle">{song.title}</div>
                                <div className="trackArtist">{song.artistName}</div>
                                <div className="trackMeta">
                                    <div className="metaItem">
                                        <GraySmallPlayMusic/>
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

                        {/* 再生位置 */}
                        <div className="playerProgress">
                            <input
                                type="range"
                                className="timeBar"
                                min="0"
                                max={duration || 0}
                                step="0.1"
                                value={Math.min(displayedTime, duration || 0)}
                                onPointerDown={(event) =>
                                    updateSeekPreview(Number(event.currentTarget.value))
                                }
                                onPointerUp={commitSeek}
                                onPointerCancel={cancelSeek}
                                onChange={(event) => handleSeekChange(Number(event.target.value))}
                                aria-label="再生位置"
                                disabled={!duration}
                                style={{
                                    width: "100%",
                                    cursor: "pointer",
                                    background: `linear-gradient(to right, #E8447A 0%, #E8447A ${
                                        duration ? (displayedTime / duration) * 100 : 0
                                    }%, #ffe3f1 ${
                                        duration ? (displayedTime / duration) * 100 : 0
                                    }%, #ffe3f1 100%)`
                                }}
                            />
                            <div className="timeLabels">
                                <span>{formatTime(displayedTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* コントロール */}
                        <div className="controls">
                            <div className="ctrlBtn" onClick={previous} style={{ cursor: "pointer" }}>
                                <SkipBack/>
                            </div>

                            <div 
                                className="playBtn" 
                                onClick={handlePlay}
                                style={{ cursor: "pointer" }}
                                role="button"
                                aria-label={`${song.title}を${isCurrentPlaying ? "一時停止" : "再生"}`}
                            >
                                {isCurrentPlaying ? <StopMusic color="white"/> : <StartMusic color="white"/>}
                            </div>

                            <div className="ctrlBtn" onClick={next} style={{ cursor: "pointer" }}>
                                <SkipForward/>
                            </div>
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
                                    {song.groups?.map((g) => (
                                        <span key={g} className="genreTag">{g}</span>
                                    ))}
                                    {song.juniors?.map((j) => (
                                        <span key={j} className="genreTag">{j}</span>
                                    ))}
                                    {(!song.groups?.length && !song.juniors?.length) && (
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
                            
                            {/* コメント・スパチャ入力フォーム */}
                            <div className={`commentForm ${selectedAmount ? `formScMode ${selectedAmount.colorClass}` : ""}`}>
                                {selectedAmount && (
                                    <div className="formScHeader">
                                        <span>スーパーチャットを送信中</span>
                                        <div className="formScInfo">
                                            <span className="formScAmount">￥{selectedAmount.amount.toLocaleString()}</span>
                                            <button className="cancelScBtn" onClick={handleCancelSc}>✕</button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="inputWrapper">
                                    {!selectedAmount && (
                                        <button 
                                            className="scButton" 
                                            title="金額を選択する"
                                            onClick={() => setShowScModal(true)}
                                        >
                                            ￥
                                        </button>
                                    )}
                                    <input 
                                        type="text" 
                                        placeholder={selectedAmount ? "公開メッセージを追加..." : "コメントを入力..."} 
                                        className="commentInput"
                                    />
                                    <button className="sendButton">
                                        {selectedAmount ? "購入" : "送信"}
                                    </button>
                                </div>
                            </div>

                            {/* コメント一覧 */}
                            <div className="commentList">
                                <div className="scItem scRed">
                                    <div className="scHeader">
                                        <span className="scUser">たかし_推し活中</span>
                                        <span className="scAmount">￥10,000</span>
                                    </div>
                                    <div className="scContent">
                                        この新曲最高すぎます！！ヘビロテ確定です😭✨
                                    </div>
                                </div>

                                <div className="scItem scGreen">
                                    <div className="scHeader">
                                        <span className="scUser">りさ</span>
                                        <span className="scAmount">￥2,000</span>
                                    </div>
                                    <div className="scContent">
                                        サビのメロディラインが本当に綺麗！
                                    </div>
                                </div>

                                <div className="commentItem">
                                    <div className="commentUserRow">
                                        <span className="commentUser">音楽ファンA</span>
                                        <span className="commentTime">2時間前</span>
                                    </div>
                                    <div className="commentText">
                                        ダンスの振り付け動画も早く見たいな〜。
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* スパチャ金額選択モーダル（ポップアップ） */}
            {showScModal && (
                <div className="modalOverlay" onClick={() => setShowScModal(false)}>
                    <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                        <div className="modalHeader">
                            <h3>スーパーチャットを選択</h3>
                            <button className="closeModalBtn" onClick={() => setShowScModal(false)}>✕</button>
                        </div>
                        <div className="amountGrid">
                            {SC_TIERS.map((tier) => (
                                <button 
                                    key={tier.amount} 
                                    className={`amountCard ${tier.colorClass}`}
                                    onClick={() => handleSelectAmount(tier)}
                                >
                                    <span className="gridAmount">￥{tier.amount.toLocaleString()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

// スタイル定義の文字列
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

.playerProgress {
  margin-bottom: 6px;
}

.timeBar {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: #ffe3f1;
  border-radius: 3px;
  outline: none;
  margin-bottom: 6px;
}

.timeLabels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #aaa;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 18px 0 6px;
}

.ctrlBtn {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.playBtn {
  width: 54px;
  height: 54px;
  background: #e8447a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
}

.timeBar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #e8447a;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.timeBar::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.timeBar::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #e8447a;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.timeBar::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* --- コメント・スパチャ関連 --- */
.commentContainer {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  
  /* コメントエリア全体の枠線設定を追加 */
  background: #fff;
  border: 1px solid #f0d8e8;
  border-radius: 14px;
  padding: 16px;
}

.commentForm {
  background: #fff;
  border: 1px solid #fdf0f6; /* 外枠ができたので少し薄めに調整 */
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

.scButton {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e8447a;
  color: #fff;
  border: none;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

/* スパチャ選択時の入力欄スタイル */
.formScMode {
  padding: 0 0 12px 0;
}
.formScHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}
.formScInfo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.formScAmount {
  font-size: 14px;
}
.cancelScBtn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.formScMode .inputWrapper {
  padding: 0 12px;
}

/* リストの余白調整 */
.commentList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px; 
}

.commentItem {
  background: #fff;
  border: 1px solid #fdf0f6; /* 外枠に合わせて少し薄めに調整 */
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

.commentText {
  font-size: 14px;
  color: #222;
  line-height: 1.4;
}

.scItem {
  border-radius: 12px;
  overflow: hidden;
}

.scHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 13px;
}

.scContent {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.4;
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

.amountGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.amountCard {
  border: none;
  border-radius: 10px;
  padding: 14px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  transition: transform 0.1s;
}

.amountCard:active {
  transform: scale(0.95);
}

/* スパチャカラー */
.tierBlue { background: #1565c0; }
.tierBlue.formScHeader { background: #0d47a1; }

.tierCyan { background: #00b0ff; color: #000 !important; }
.tierCyan.formScHeader { background: #00b0ff; color: #000 !important; }
.tierCyan .cancelScBtn { color: #000; }

.tierYellow { background: #ffca28; color: #000 !important; }
.tierYellow.formScHeader { background: #ffca28; color: #000 !important; }
.tierYellow .cancelScBtn { color: #000; }

.tierOrange { background: #f57c00; }
.tierOrange.formScHeader { background: #e65100; }

.tierMagenta { background: #e91e63; }
.tierMagenta.formScHeader { background: #c2185b; }

.tierRed { background: #e53935; }
.tierRed.formScHeader { background: #b71c1c; }

.scRed .scHeader { background: #b71c1c; color: #fff; }
.scRed .scContent { background: #e53935; color: #fff; }
.scGreen .scHeader { background: #00875a; color: #fff; }
.scGreen .scContent { background: #24a148; color: #fff; }
`;