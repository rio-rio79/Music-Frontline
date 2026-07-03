"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MusicList from "../../components/MusicList/MusicList";
import { useLikeStore } from "../../stores/likeStore";
import BlogList from "@/components/BlogList/BlogList";
import IdleList from "@/components/IdleList/IdleList";
import posts from "../../data/posts";

// ----データに置き換える----
export type Idle = {
  id: string;
  name: string;
  nameRoma: string;
  thumbnailUrl?: string;
};

export const idles: Idle[] = [
  {
    id: "1",
    name: "AAA", // 名前
    nameRoma: "aaa", // 名前ローマ字
    thumbnailUrl: "",
  },
  {
    id: "2",
    name: "BBB",
    nameRoma: "bbb",
    thumbnailUrl: "",
  },
  {
    id: "3",
    name: "CCC",
    nameRoma: "ccc",
    thumbnailUrl: "",
  },
  {
    id: "4",
    name: "DDD",
    nameRoma: "ddd",
    thumbnailUrl: "",
  },
  {
    id: "5",
    name: "EEE",
    nameRoma: "eee",
    thumbnailUrl: "",
  },
];

// ----データに置き換える----

type TabKey = "music" | "blog" | "idol";

const TABS: { key: TabKey; label: string; sectionLabel: string; note: string }[] = [
    {
        key: "music",
        label: "MUSIC",
        sectionLabel: "MUSIC",
        note: "（楽曲へのいいねコンテンツがここに入ります）",
    },
    {
        key: "blog",
        label: "ブログ",
        sectionLabel: "BLOG",
        note: "（ブログへのいいねコンテンツがここに入ります）",
    },
    {
        key: "idol",
        label: "アイドル",
        sectionLabel: "IDOL",
        note: "（アイドルへのいいねコンテンツがここに入ります）",
    },
];

export default function Like() {
    const [activeTab, setActiveTab] = useState<TabKey>("music");

    const likedSongs = useLikeStore((state) => state.likedSongs);
    const loading = useLikeStore((state) => state.loading);
    const isLoggedIn = useLikeStore((state) => state.isLoggedIn);
    const fetchLikes = useLikeStore((state) => state.fetchLikes);

    useEffect(() => {
        if (activeTab === "music") {
            fetchLikes();
        }
    }, [activeTab, fetchLikes]);

    const current = TABS.find((t) => t.key === activeTab)!;

    // メインコンテンツの描画ロジックを関数として集約
    const renderContent = () => {
        if (!isLoggedIn) {
            return (
                <div className="like-empty-note">
                    いいね一覧を表示するにはログインが必要です。<br />
                    <Link href="/login" style={{ color: "var(--pink)", textDecoration: "underline", marginTop: "10px", display: "inline-block" }}>
                        ログイン画面へ
                    </Link>
                </div>
            );
        }

        if (loading) {
            return <div className="like-empty-note">読み込み中...</div>;
        }

        switch (activeTab) {
            case "music":
                return likedSongs.length > 0 ? (
                    <MusicList songs={likedSongs} />
                ) : (
                    <div className="like-empty-note">いいねした楽曲はありません。</div>
                );
            case "blog":
                return posts.length > 0 ? (
                    <BlogList blogs={posts} />
                ) : (
                    <div className="like-empty-note">いいねしたブログはありません。</div>
                );
            case "idol":
                return idles.length > 0 ? (
                    <IdleList idles={idles} />
                ) : (
                    <div className="like-empty-note">いいねしたアイドルはありません。</div>
                );
            default:
                return null;
        }
    };

    return (
        <section className="like-page">
            <style>{`
                .like-page {
                    --pink: #FF69B4;
                    --pink-light: #FFEAF3;
                    --text: #222;
                    --sub: #999;
                    --border: #eee;

                    max-width: 700px;
                    margin: 0 auto;
                    padding: 32px 20px 80px;
                    font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
                    color: var(--text);
                    box-sizing: border-box;
                }

                .like-page *{
                    box-sizing: border-box;
                }

                .like-page .like-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--pink);
                    border-bottom: 2px solid var(--pink);
                    display: inline-block;
                    padding-bottom: 8px;
                    margin: 0 0 24px;
                }

                .like-page .like-tabs {
                    display: flex;
                    background: #f5f5f5;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 32px;
                }

                .like-page .like-tab {
                    flex: 1;
                    text-align: center;
                    padding: 14px 0;
                    font-size: 15px;
                    font-weight: 700;
                    color: #888;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    transition: background .2s, color .2s;
                }

                .like-page .like-tab.active {
                    background: var(--pink-light);
                    color: var(--pink);
                }

                .like-page .like-section-label {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    margin-bottom: 24px;
                }

                .like-page .like-section-label .dots {
                    color: var(--pink);
                    font-size: 14px;
                    letter-spacing: 4px;
                }

                .like-page .like-empty-note {
                    text-align: center;
                    color: var(--sub);
                    font-size: 13px;
                    padding: 60px 0;
                    border: 1px dashed var(--border);
                    border-radius: 12px;
                }

                .like-page .like-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 18px;
                    margin-top: 32px;
                    font-size: 14px;
                    color: #888;
                }

                .like-page .like-pagination .current {
                    color: var(--pink);
                    font-weight: 700;
                }
            `}</style>

            <h1 className="like-title">いいね</h1>

            <div className="like-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`like-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="like-section-label">
                <span className="dots">・ ・ ・</span>
                {current.sectionLabel}
                <span className="dots">・ ・ ・</span>
            </div>

            {renderContent()}
 
             {isLoggedIn && !loading && activeTab === "music" && likedSongs.length > 0 && (
                 <div className="like-pagination">
                     <span className="current">1</span>
                     <span>2</span>
                     <span>3</span>
                     <span>4</span>
                     <span>…</span>
                     <span>&gt;</span>
                     <span>&gt;&gt;</span>
                 </div>
             )}
        </section>
    );
}