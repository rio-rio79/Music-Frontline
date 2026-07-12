"use client";

import Link from "next/link";
import { type Song, usePlayerStore } from "../../stores/playerStore";
import styles from './MusicList.module.css';
import { ThmbSvg, StopMusic, StartMusic, Heart } from "../Svgs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLikeStore } from "../../stores/likeStore";

type MusicListProps = {
    songs: Song[];
};

export default function MusicList({ songs }: MusicListProps) {
    const router = useRouter();
    // 一覧の再生ボタンはブラウザで操作するため、共有ストアから状態と操作を取得する。
    const currentSong = usePlayerStore((state) => state.currentSong);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const playSong = usePlayerStore((state) => state.playSong);
    const togglePlay = usePlayerStore((state) => state.togglePlay);

    const toggleLike = useLikeStore((state) => state.toggleLike);
    const likedSongIds = useLikeStore((state) => state.likedSongIds);

    const handlePlay = (song: Song) => {
        // 同じ曲を選んだ場合は、曲を読み込み直さず再生・一時停止だけ切り替える。
        if (currentSong?.id === song.id) {
            togglePlay();
            return;
        }

        // 別の曲なら、ストアに曲と再生リスト全体を設定して再生を開始する。
        playSong(song, songs);
    };

    const handleLike = async (songId: string) => {
        const result = await toggleLike(songId);
        if (result === null) {
            if (confirm("いいねをするにはログインが必要です。ログインページへ移動しますか？")) {
                router.push("/login");
            }
        }
    };

    return (
        <ul className={styles.songList}>
            {songs.map((song) => {
                const isCurrentSong = currentSong?.id === song.id;
                const isCurrentPlaying = isCurrentSong && isPlaying;

                return (
                    <li key={song.id} className={styles.songRow}>
                        {/* サムネイル */}
                        <div className={styles.thumb}>
                            {song.imagePath ? (
                                <Image 
                                    src={song.imagePath} 
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
                            <div className={styles.artistContainer}>
                                <span className={styles.juniorNames}>
                                    {song.juniors && song.juniors.length > 0
                                        ? song.juniors.join(", ")
                                        : "アーティスト名"}
                                </span>
                                {song.groups && song.groups.map((group) => (
                                    <span key={group} className={styles.groupTag}>
                                        {group}
                                    </span>
                                ))}
                            </div>
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
                                onClick={() => handleLike(song.id)}
                                aria-label={likedSongIds.includes(song.id) ? "いいねを解除" : "いいねする"}
                            >
                                <Heart filled={likedSongIds.includes(song.id)} />
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
