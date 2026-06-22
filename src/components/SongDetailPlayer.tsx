"use client";

import { type Song, usePlayerStore } from "../stores/playerStore";

type SongDetailPlayerProps = {
    song: Song;
};

export default function SongDetailPlayer({ song }: SongDetailPlayerProps) {
    // 一覧ページと同じストアを使うため、画面を移動しても再生状態を共有できる。
    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const playSong = usePlayerStore((state) => state.playSong);
    const togglePlay = usePlayerStore((state) => state.togglePlay);

    const isCurrentSong = currentSong?.id === song.id;
    const isCurrentPlaying = isCurrentSong && isPlaying;

    const handlePlay = () => {
        // 同じ曲なら、再読み込みせずに再生・一時停止だけを切り替える。
        if (isCurrentSong) {
            togglePlay();
            return;
        }

        // 別の曲なら、選択した曲をストアへ設定して再生する。
        playSong(song);
    };

    return (
        <button
            type="button"
            className="detail-play-button"
            onClick={handlePlay}
            aria-label={`${song.title}を${isCurrentPlaying ? "一時停止" : "再生"}`}
            aria-pressed={isCurrentPlaying}
        >
            {isCurrentPlaying ? "❚❚" : "▶"}
        </button>
    );
}
