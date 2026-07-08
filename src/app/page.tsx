"use client";

import { useEffect, useState } from "react";
import MusicList from "../components/MusicList/MusicList";
import { type Song } from "../stores/playerStore";
import styles from "./MyComponent.module.css"; // スタイルのインポート

export default function Top() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<string>("group");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        const fetchSongs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery.trim()) {
                    params.set("q", searchQuery.trim());
                }
                if (sortBy) {
                    params.set("sort", sortBy);
                }

                const res = await fetch(`/api/songs?${params.toString()}`);
                if (!res.ok) {
                    throw new Error("楽曲の取得に失敗しました。");
                }
                const data = await res.json();
                setSongs(data.songs || []);
                setError(null);
            } catch (err: any) {
                setError(err.message || "エラーが発生しました。");
            } finally {
                setLoading(false);
            }
        };

        // 入力のチャタリング防止用デバウンス（300ms）
        const timer = setTimeout(() => {
            fetchSongs();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, sortBy]);

    return (
        <section className={styles.container}>
            <h1>
                トップページに差し替えるかも！！
            </h1>
        </section>
    );
}