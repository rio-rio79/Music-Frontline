"use client";

import { useEffect, useState } from "react";
import MusicList from "../components/MusicList/MusicList";
import { type Song } from "../stores/playerStore";
import styles from "./MyComponent.module.css"; // スタイルのインポート

export default function Top() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const res = await fetch("/api/songs");
                if (!res.ok) {
                    throw new Error("楽曲の取得に失敗しました。");
                }
                const data = await res.json();
                setSongs(data.songs || []);
            } catch (err: any) {
                setError(err.message || "エラーが発生しました。");
            } finally {
                setLoading(false);
            }
        };

        fetchSongs();
    }, []);

    return (
        <section className={styles.container}>
            {/* 検索ボックスとドロップダウンのラッパー */}
            <div className={styles.searchContainer}>
                {/* 右上のドロップダウンリスト */}
                <select className={styles.dropdown} aria-label="並び替え">
                    <option value="group">グループ順</option>
                    <option value="fifty">50音順</option>
                    <option value="new">新着順</option>
                    <option value="popular">人気順</option>
                </select>
                
                {/* 検索ボックス */}
                <div className={styles.searchBox}>
                    <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="#bbb" strokeWidth="2">
                        <circle cx="9" cy="9" r="7"/>
                        <path d="M14.5 14.5 L20 20" strokeLinecap="round"/>
                    </svg>
                    <input type="text" placeholder="検索ボックス" aria-label="検索ワード" />
                </div>
            </div>

            {/* MUSIC LIST */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>
                    読み込み中...
                </div>
            ) : error ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
                    {error}
                </div>
            ) : (
                <MusicList songs={songs} />
            )}
        </section>
    );
}