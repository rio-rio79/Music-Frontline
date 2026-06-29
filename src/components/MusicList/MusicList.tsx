"use client";

import Link from "next/link";
import { type Song, usePlayerStore } from "../../stores/playerStore";
import styles from './MusicList.module.css';
import { ThmbSvg, StopMusic, StartMusic, Heart } from "../Svgs";
import Image from "next/image";

type MusicListProps = {
    songs: Song[];
};

export default function MusicList({ songs }: MusicListProps) {
    // 一覧の再生ボタンはブラウザで操作するため、共有ストアから状態と操作を取得する。
    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const playSong = usePlayerStore((state) => state.playSong);
    const togglePlay = usePlayerStore((state) => state.togglePlay);

    const songImage = "/music_cover_img.png"; // 本番はDBからとってきた楽曲イメージのパスで書き換える

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
        <ul className={styles.songList}>
            {songs.map((song) => {
                const isCurrentSong = currentSong?.id === song.id;
                const isCurrentPlaying = isCurrentSong && isPlaying;

                return (
                    <li key={song.id} className={styles.songRow}>
                        {/* サムネイル (HTMLのSVGデザインを継承) */}
                        <div className={styles.thumb}>
                            {songImage ? (
                                <Image 
                                    src={songImage} 
                                    alt={`${song.title}のカバー`}
                                    width={56}
                                    height={56}
                                    className={styles.thumbImg}
                                />
                            ) : (
                                <ThmbSvg/>
                            )}
                        </div>

                        {/* トラック情報 */}
                        <div className={styles.track}>
                            <Link href={`/music/${song.id}`} className={styles.musicLink}>
                                <h2 className={styles.trackTitle}>{song.title}</h2>
                            </Link>
                            {/* ユーザーデータ構造を考慮し、song.artist または song.singer を想定 */}
                            <p className={styles.trackArtist}>アーティスト名</p>
                        </div>

                        {/* アクションボタン */}
                        <div className={styles.actions}>
                            {/* 再生 / 一時停止ボタン */}
                            <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => handlePlay(song)}
                                aria-label={`${song.title}を${isCurrentPlaying ? "一時停止" : "再生"}`}
                                aria-pressed={isCurrentPlaying}
                            >
                                {isCurrentPlaying ? (
                                    // 停止アイコン
                                    <StopMusic/>

                                ) : (
                                    /* 再生アイコン */
                                    <StartMusic/>
                                )}
                            </button>

                            {/* いいねボタン */}
                            <button 
                                type="button" 
                                className={styles.actionBtn}
                                onClick={() => alert(`${song.title}をお気に入りにしました`)} /* ここにいいねの処理を入れる */
                                aria-label="お気に入りに追加"
                            >
                                <Heart/>
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}