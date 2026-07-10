"use client";

import { useCallback, useEffect, useRef } from "react";
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

    const reportPlayback = useCallback((songId: string) => {
        if (hasCountedThisSongRef.current) {
            return;
        }

        hasCountedThisSongRef.current = true;

        fetch(`/api/songs/${songId}/play`, { method: "POST" })
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
    }, []);

    useEffect(() => {
        if (!audioRef.current || !currentSong) {
            return;
        }

        activePlayDurationRef.current = 0;
        hasCountedThisSongRef.current = false;
        audioRef.current.src = currentSong.audioFilePath;
        audioRef.current.play().catch(() => { });
    }, [currentSong]);

    useEffect(() => {
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

            if (activePlayDurationRef.current < 30) {
                return;
            }

            reportPlayback(currentSong.id);
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentSong, reportPlayback]);

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

    const handleEnded = () => {
        const audio = audioRef.current;

        if (currentSong && audio && Number.isFinite(audio.duration) && audio.duration < 30) {
            const requiredPlayDuration = Math.max(1, audio.duration - 1);

            if (activePlayDurationRef.current >= requiredPlayDuration) {
                reportPlayback(currentSong.id);
            }
        }

        next();
    };

    return (
        <audio
            ref={audioRef}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onEnded={handleEnded}
        />
    );
}
