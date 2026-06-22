"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { usePlayerStore } from "../stores/playerStore";

export default function MiniPlayer() {
    // ドラッグ中だけ使う再生位置。音声への反映は、つまみを離した時点で行う。
    const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
    const seekPreviewTimeRef = useRef<number | null>(null);

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

        // キーボード操作では再生位置をすぐに確定する。
        requestSeek(time);
    };

    // 縦型プレイヤーと同じく、曲が選ばれるまでは表示しない。
    if (!currentSong) {
        return null;
    }

    const displayedTime = seekPreviewTime ?? currentTime;

    return (
        <div className="mini-player">
            <div className="mini-controls" aria-label="再生操作">
                <button type="button" onClick={previous} aria-label="前の曲">
                    ⏮
                </button>
                <button
                    type="button"
                    className="mini-primary-control"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "一時停止" : "再生"}
                >
                    {isPlaying ? "❚❚" : "▶"}
                </button>
                <button type="button" onClick={next} aria-label="次の曲">
                    ⏭
                </button>
            </div>

            <div className="mini-song-info">
                <Image
                    src="/music_cover_img.png"
                    alt="楽曲のカバー画像"
                    className="mini-cover"
                    width={48}
                    height={48}
                />

                <div className="mini-meta">
                    <strong>{currentSong.title}</strong>
                    <small>MUSIC FRONTLINE</small>
                    <input
                        type="range"
                        className="mini-seek"
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
                </div>
            </div>

            <label className="mini-volume">
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
    );
}
