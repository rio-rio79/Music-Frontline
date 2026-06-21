"use client";

import Link from "next/link";
import { type Song, usePlayerStore } from "../stores/playerStore";

type MusicListProps = {
    songs: Song[];
};

export default function MusicList({ songs }: MusicListProps) {
    // 一覧の再生ボタンはブラウザで操作するため、共有ストアから状態と操作を取得する。
    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const playSong = usePlayerStore((state) => state.playSong);
    const togglePlay = usePlayerStore((state) => state.togglePlay);

    const handlePlay = (song: Song) => {
        // 同じ曲を選んだ場合は、曲を読み込み直さず再生・一時停止だけ切り替える。
        if (currentSong?.id === song.id) {
            togglePlay();
            return;
        }

        // 別の曲なら、ストアに曲を設定して再生を開始する。
        playSong(song);
    };

    return (
        <ul className="music-list">
            {songs.map((song) => {
                const isCurrentSong = currentSong?.id === song.id;
                const isCurrentPlaying = isCurrentSong && isPlaying;

                return (
                    <li key={song.id} className="music-list-item">
                        <Link href={`/music/${song.id}`} className="music-link">
                            <h2>{song.title}</h2>
                        </Link>

                        <button
                            type="button"
                            className="music-play-button"
                            onClick={() => handlePlay(song)}
                            aria-label={`${song.title}を${isCurrentPlaying ? "一時停止" : "再生"}`}
                            aria-pressed={isCurrentPlaying}
                        >
                            {isCurrentPlaying ? "❚❚" : "▶"}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
