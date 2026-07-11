"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLikeStore } from "../stores/likeStore";
import { usePlayerStore } from "../stores/playerStore";

export default function MiniPlayer() {
    const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
    const [isLikePending, setIsLikePending] = useState(false);
    const seekPreviewTimeRef = useRef<number | null>(null);
    const router = useRouter();

    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const currentTime = usePlayerStore((state) => state.currentTime);
    const duration = usePlayerStore((state) => state.duration);
    const volume = usePlayerStore((state) => state.volume);
    const togglePlay = usePlayerStore((state) => state.togglePlay);
    const previous = usePlayerStore((state) => state.previous);
    const next = usePlayerStore((state) => state.next);
    const requestSeek = usePlayerStore((state) => state.requestSeek);
    const setVolume = usePlayerStore((state) => state.setVolume);
    const updateSongLikeStatus = usePlayerStore((state) => state.updateSongLikeStatus);
    const previousVolumeRef = useRef(volume);

    const likedSongIds = useLikeStore((state) => state.likedSongIds);
    const toggleLike = useLikeStore((state) => state.toggleLike);

    useEffect(() => {
        if (volume > 0) {
            previousVolumeRef.current = volume;
        }
    }, [volume]);

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

    const safeDuration = duration || 0;
    const displayedTime = Math.min(seekPreviewTime ?? currentTime, safeDuration);
    const seekProgress = safeDuration ? (displayedTime / safeDuration) * 100 : 0;
    const volumeProgress = Math.round(volume * 100);
    const hasCurrentSong = Boolean(currentSong);
    const isCurrentSongLiked = currentSong ? likedSongIds.includes(currentSong.id) : false;

    const handleLike = async () => {
        if (!currentSong || isLikePending) return;

        setIsLikePending(true);
        try {
            const result = await toggleLike(currentSong.id);

            if (result === null) {
                if (confirm("いいねをするにはログインが必要です。ログインページへ移動しますか？")) {
                    router.push("/login");
                }
                return;
            }

            updateSongLikeStatus(currentSong.id, result);
        } finally {
            setIsLikePending(false);
        }
    };

    const handleVolumeChange = (nextVolume: number) => {
        setVolume(nextVolume);
    };

    const toggleMute = () => {
        if (volume > 0) {
            previousVolumeRef.current = volume;
            setVolume(0);
            return;
        }

        setVolume(previousVolumeRef.current || 0.1);
    };

    return (
        <div className={`mini-player ${hasCurrentSong ? "" : "mini-player-idle"}`}>
            <div className="mini-controls" aria-label="再生操作">
                <button type="button" onClick={previous} aria-label="前の曲" disabled={!hasCurrentSong}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="5" y="5" width="2.4" height="14" />
                        <path d="M20 5 9 12l11 7z" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="mini-primary-control"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "一時停止" : "再生"}
                    disabled={!hasCurrentSong}
                >
                    {hasCurrentSong && isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <rect x="5" y="4" width="5" height="16" rx="1" />
                            <rect x="14" y="4" width="5" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg width="17" height="17" viewBox="0 0 22 22" fill="currentColor" aria-hidden="true" className="mini-play-icon">
                            <polygon points="4,2 19,11 4,20" />
                        </svg>
                    )}
                </button>
                <button type="button" onClick={next} aria-label="次の曲" disabled={!hasCurrentSong}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="16.6" y="5" width="2.4" height="14" />
                        <path d="M4 5l11 7-11 7z" />
                    </svg>
                </button>
            </div>

            <div className="mini-info-box">
                <div className="mini-artwork" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18V5l11-2v13" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="6" cy="18" r="2.4" fill="#fff" />
                        <circle cx="17" cy="16" r="2.4" fill="#fff" />
                    </svg>
                </div>

                <div className="mini-meta">
                    {currentSong ? (
                        <>
                            <strong>{currentSong.title}</strong>
                            <small>{currentSong.artistName || "MUSIC FRONTLINE"}</small>
                        </>
                    ) : (
                        <>
                            <strong className="mini-idle-note">♪</strong>
                            <small>再生中の楽曲はありません</small>
                        </>
                    )}
                </div>

                {currentSong && (
                    <>
                        <button
                            type="button"
                            className="mini-heart-button"
                            onClick={handleLike}
                            aria-label={isCurrentSongLiked ? "お気に入りから削除" : "お気に入りに追加"}
                            aria-pressed={isCurrentSongLiked}
                            disabled={isLikePending}
                        >
                            <svg width="13" height="13" viewBox="0 0 22 22" fill={isCurrentSongLiked ? "#E8447A" : "none"} stroke="#E8447A" strokeWidth="1.8" aria-hidden="true">
                                <path d="M11 19.5S3 14.5 3 8.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 6-8 11-8 11z" />
                            </svg>
                        </button>

                        <span className="mini-time-label mini-time-current">{formatTime(displayedTime)}</span>
                        <span className="mini-time-label mini-time-remaining">-{formatTime(Math.max(safeDuration - displayedTime, 0))}</span>

                        <input
                            type="range"
                            className="mini-seek"
                            min="0"
                            max={safeDuration}
                            step="0.1"
                            value={displayedTime}
                            onPointerDown={(event) => updateSeekPreview(Number(event.currentTarget.value))}
                            onPointerUp={commitSeek}
                            onPointerCancel={cancelSeek}
                            onChange={(event) => handleSeekChange(Number(event.target.value))}
                            aria-label="再生位置"
                            disabled={!safeDuration}
                            style={{
                                background: `linear-gradient(to right, #E8447A ${seekProgress}%, #f0d8e8 ${seekProgress}%)`,
                            }}
                        />
                    </>
                )}
            </div>

            <div className="mini-volume" aria-label="音量操作">
                <button
                    type="button"
                    className="mini-volume-button"
                    onClick={toggleMute}
                    aria-label={volume > 0 ? "ミュート" : "ミュート解除"}
                    aria-pressed={volume === 0}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a98aa0" strokeWidth="1.8" aria-hidden="true">
                        <path d="M4 9v6h4l5 4V5L8 9H4z" />
                        {volume > 0 ? (
                            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                        ) : (
                            <path d="m16.5 9 4 4m0-4-4 4" strokeLinecap="round" />
                        )}
                    </svg>
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(event) => handleVolumeChange(Number(event.target.value))}
                    aria-label="音量"
                    className="mini-volume-range"
                    style={{
                        background: `linear-gradient(to right, #E8447A ${volumeProgress}%, #f0d8e8 ${volumeProgress}%)`,
                    }}
                />
            </div>
        </div>
    );
}

function formatTime(seconds: number) {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
