"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "../stores/playerStore";

export default function AudioPlayerController() {
    // 画面には出さず、アプリ全体で1つだけ音声の実体を持つ。
    const audioRef = useRef<HTMLAudioElement>(null);
    const activePlayDurationRef = useRef<number>(0);
    const hasCountedThisSongRef = useRef<boolean>(false);

    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const volume = usePlayerStore((state) => state.volume);
    const seekRequestTime = usePlayerStore((state) => state.seekRequestTime);
    const next = usePlayerStore((state) => state.next);
    const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
    const setDuration = usePlayerStore((state) => state.setDuration);
    const clearSeekRequest = usePlayerStore((state) => state.clearSeekRequest);

    useEffect(() => {
        if (!audioRef.current || !currentSong) {
            return;
        }

        audioRef.current.src = currentSong.audioFilePath;
        audioRef.current.play().catch(() => { });
    }, [currentSong]);

    useEffect(() => {
        activePlayDurationRef.current = 0;
        hasCountedThisSongRef.current = false;

        if (!isPlaying || !currentSong) {
            return;
        }

        const interval = setInterval(() => {
            const audio = audioRef.current;
            if (!audio) return;

            const isAudible = !audio.paused && !audio.muted && audio.volume > 0;

            if (!isAudible) {
                return;
            }

            activePlayDurationRef.current += 1;

            if (activePlayDurationRef.current < 30 || hasCountedThisSongRef.current) {
                return;
            }

            hasCountedThisSongRef.current = true;

            fetch(`/api/songs/${currentSong.id}/play`, { method: "POST" })
                .then((res) => {
                    if (res.ok) {
                        return res.json();
                    }
                    throw new Error("API response error");
                })
                .then((data) => {
                    if (data?.points?.points_awarded === false && data.points.reason) {
                        console.log(`Playback points skipped on server: ${data.points.reason}`);
                    }
                })
                .catch((err) => {
                    console.error("Failed to increment play count:", err);
                });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentSong]);

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

    useEffect(() => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.volume = volume;
    }, [currentSong, volume]);

    useEffect(() => {
        if (!audioRef.current || seekRequestTime === null) {
            return;
        }

        audioRef.current.currentTime = seekRequestTime;
        setCurrentTime(seekRequestTime);
        clearSeekRequest();
    }, [clearSeekRequest, seekRequestTime, setCurrentTime]);

    return (
        <audio
            ref={audioRef}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onEnded={next}
        />
    );
}
