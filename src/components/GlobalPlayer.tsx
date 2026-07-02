"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../stores/playerStore";

const formatTime = (time: number) => {
    const safeTime = Number.isFinite(time) && time > 0 ? time : 0;
    const minutes = Math.floor(safeTime / 60);
    const seconds = Math.floor(safeTime % 60);

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function GlobalPlayer() {
    // ブラウザの audio 要素を直接操作するための参照。
    const audioRef = useRef<HTMLAudioElement>(null);
    // ドラッグ中だけ使う再生位置。音声の再生位置は、指やマウスを離すまで変えない。
    const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
    const seekPreviewTimeRef = useRef<number | null>(null);

    // Zustand から、表示・再生に必要な状態と操作だけを取得する。
    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const currentTime = usePlayerStore((state) => state.currentTime);
    const duration = usePlayerStore((state) => state.duration);
    const volume = usePlayerStore((state) => state.volume);
    const seekRequestTime = usePlayerStore((state) => state.seekRequestTime);
    const togglePlay = usePlayerStore((state) => state.togglePlay);
    const previous = usePlayerStore((state) => state.previous);
    const next = usePlayerStore((state) => state.next);
    const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
    const setDuration = usePlayerStore((state) => state.setDuration);
    const setVolume = usePlayerStore((state) => state.setVolume);
    const clearSeekRequest = usePlayerStore((state) => state.clearSeekRequest);

    // 曲が切り替わったときに、audio 要素の再生元も切り替える。
    // playSong は isPlaying を true にするため、選択直後に再生する。
    useEffect(() => {
        if (!audioRef.current || !currentSong) {
            return;
        }

        audioRef.current.src = currentSong.audioFilePath;
        audioRef.current.play().catch(() => { });
    }, [currentSong]);

    const activePlayDurationRef = useRef<number>(0);
    const hasCountedThisSongRef = useRef<boolean>(false);

    // 曲が切り替わったら再生カウンターをリセット
    useEffect(() => {
        activePlayDurationRef.current = 0;
        hasCountedThisSongRef.current = false;
    }, [currentSong?.id]);

    // 再生カウントの監視（1秒ごと）
    useEffect(() => {
        if (!isPlaying || !currentSong) {
            return;
        }

        const interval = setInterval(() => {
            const audio = audioRef.current;
            if (!audio) return;

            // 音が出ている状態で実際に再生されているかチェック
            const isAudible = !audio.paused && !audio.muted && audio.volume > 0;

            if (isAudible) {
                activePlayDurationRef.current += 1;

                // 30秒に達し、かつ未カウントの場合
                if (activePlayDurationRef.current >= 30 && !hasCountedThisSongRef.current) {
                    hasCountedThisSongRef.current = true;

                    // 1ユーザー・1日につき1曲20回までの制限管理（LocalStorage）
                    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
                    const storageKey = "music_play_counts";
                    let countsData: { date: string; counts: Record<string, number> } = {
                        date: today,
                        counts: {},
                    };

                    try {
                        const localData = localStorage.getItem(storageKey);
                        if (localData) {
                            const parsed = JSON.parse(localData);
                            if (parsed && parsed.date === today) {
                                countsData = parsed;
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse play counts:", e);
                    }

                    const currentCount = countsData.counts[currentSong.id] || 0;
                    if (currentCount < 20) {
                        fetch(`/api/songs/${currentSong.id}/play`, { method: "POST" })
                            .then((res) => {
                                if (res.ok) {
                                    countsData.counts[currentSong.id] = currentCount + 1;
                                    localStorage.setItem(storageKey, JSON.stringify(countsData));
                                }
                            })
                            .catch((err) => {
                                console.error("Failed to increment play count:", err);
                            });
                    } else {
                        console.log(`Play count limit (20) reached today for song: ${currentSong.title}`);
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentSong]);

    // 再生状態が変わったら、実際の音声も再生・一時停止する。
    useEffect(() => {
        if (!audioRef.current || !currentSong) {
            return;
        }

        if (isPlaying) {
            audioRef.current.play().catch(() => { });
            return;
        }

        audioRef.current.pause();
    }, [currentSong, isPlaying]);

    // ストアの音量を、実際の audio 要素へ反映する。
    // 曲選択時に audio 要素が初めて生成されるため、currentSong も監視する。
    useEffect(() => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.volume = volume;
    }, [currentSong, volume]);

    // ミニプレイヤーから要求されたシークを、音声の実体へ反映する。
    useEffect(() => {
        if (!audioRef.current || seekRequestTime === null) {
            return;
        }

        audioRef.current.currentTime = seekRequestTime;
        setCurrentTime(seekRequestTime);
        clearSeekRequest();
    }, [clearSeekRequest, seekRequestTime, setCurrentTime]);

    const handleSeek = (time: number) => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const updateSeekPreview = (time: number) => {
        const safeTime = Math.max(0, Math.min(time, duration));

        seekPreviewTimeRef.current = safeTime;
        setSeekPreviewTime(safeTime);
    };

    const commitSeek = () => {
        const time = seekPreviewTimeRef.current;

        if (time === null) {
            return;
        }

        handleSeek(time);
        seekPreviewTimeRef.current = null;
        setSeekPreviewTime(null);
    };

    const cancelSeek = () => {
        seekPreviewTimeRef.current = null;
        setSeekPreviewTime(null);
    };

    // ドラッグ中はプレビューだけ更新し、キーボード操作ではすぐに再生位置を更新する。
    const handleSeekChange = (time: number) => {
        if (seekPreviewTimeRef.current !== null) {
            updateSeekPreview(time);
            return;
        }

        handleSeek(time);
    };

    const displayedTime = seekPreviewTime ?? currentTime;

    // 曲が選ばれるまでは、プレイヤー自体を画面に出さない。
    if (!currentSong) {
        return null;
    }

    return (
        <div className="global-player">
            {/* 音声の実体。画面上の操作は下のボタンで行う。 */}
            <audio
                ref={audioRef}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onEnded={next}
            />

            <div className="player-body">
                <Image
                    src="/music_cover_img.png"
                    alt="楽曲のカバー画像"
                    className="player-cover"
                    width={190}
                    height={190}
                />

                <div className="player-meta">
                    <strong>{currentSong.title}</strong>
                    <small>MUSIC FRONTLINE</small>
                </div>

                <div className="player-seek-area">
                    <input
                        type="range"
                        className="player-seek"
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
                    />
                    <div className="player-time">
                        <span>{formatTime(displayedTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="player-controls">
                    <button type="button" onClick={previous} aria-label="前の曲">
                        ⏮
                    </button>
                    <button
                        type="button"
                        className="player-primary-control"
                        onClick={togglePlay}
                        aria-label={isPlaying ? "一時停止" : "再生"}
                    >
                        {isPlaying ? "❚❚" : "▶"}
                    </button>
                    <button type="button" onClick={next} aria-label="次の曲">
                        ⏭
                    </button>
                </div>

                <label className="player-volume">
                    <span>Vol</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                        aria-label="音量"
                    />
                </label>
            </div>
        </div>
    );
}
