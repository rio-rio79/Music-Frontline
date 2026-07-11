"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MusicList from "../../../components/MusicList/MusicList";
import { useLikeStore } from "../../../stores/likeStore";
import BlogPostList from "../../blog/BlogPostList";
import { type BlogListItem } from "@/lib/blog-data";
import IdleList from "@/components/IdleList/IdleList";

type SectionKey = "follows" | "likes";
type LikeTabKey = "music" | "blog";

const MUSIC_PAGE_SIZE = 20;

const LIKE_TABS: { key: LikeTabKey; label: string; sectionLabel: string }[] = [
    {
        key: "music",
        label: "Music",
        sectionLabel: "MUSIC",
    },
    {
        key: "blog",
        label: "Blog",
        sectionLabel: "BLOG",
    },
];

type MyListClientProps = {
    initialSection: SectionKey;
    initialLikeTab: LikeTabKey;
};

export default function MyListClient({
    initialSection,
    initialLikeTab,
}: MyListClientProps) {
    const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
    const [activeLikeTab, setActiveLikeTab] = useState<LikeTabKey>(initialLikeTab);
    const [musicPage, setMusicPage] = useState(1);
    const [likedBlogs, setLikedBlogs] = useState<BlogListItem[]>([]);
    const [blogLoading, setBlogLoading] = useState(false);
    const [blogError, setBlogError] = useState<string | null>(null);
    const [blogRequiresLogin, setBlogRequiresLogin] = useState(false);

    const likedSongs = useLikeStore((state) => state.likedSongs);
    const likedJuniors = useLikeStore((state) => state.likedJuniors);
    const loading = useLikeStore((state) => state.loading);
    const isLoggedIn = useLikeStore((state) => state.isLoggedIn);
    const fetchLikes = useLikeStore((state) => state.fetchLikes);
    const fetchJuniorLikes = useLikeStore((state) => state.fetchJuniorLikes);
    const toggleJuniorLike = useLikeStore((state) => state.toggleJuniorLike);

    useEffect(() => {
        if (activeSection === "follows") {
            fetchJuniorLikes();
        } else if (activeLikeTab === "music") {
            fetchLikes();
        }
    }, [activeLikeTab, activeSection, fetchLikes, fetchJuniorLikes]);

    useEffect(() => {
        if (activeSection !== "likes" || activeLikeTab !== "blog") {
            return;
        }

        const controller = new AbortController();

        const fetchBlogLikes = async () => {
            setBlogLoading(true);
            setBlogError(null);
            setBlogRequiresLogin(false);

            try {
                const res = await fetch("/api/likes/blogs", {
                    signal: controller.signal,
                });

                if (res.status === 401) {
                    setBlogRequiresLogin(true);
                    setLikedBlogs([]);
                    return;
                }

                if (!res.ok) {
                    throw new Error("いいねしたブログの取得に失敗しました。");
                }

                const data = await res.json() as { posts?: BlogListItem[] };
                setLikedBlogs(data.posts ?? []);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
                setBlogError(error instanceof Error ? error.message : "エラーが発生しました。");
            } finally {
                if (!controller.signal.aborted) {
                    setBlogLoading(false);
                }
            }
        };

        void fetchBlogLikes();

        return () => {
            controller.abort();
        };
    }, [activeLikeTab, activeSection]);

    const handleSectionSelect = (section: SectionKey) => {
        setActiveSection(section);

        const url = new URL(window.location.href);
        if (section === "follows") {
            url.searchParams.delete("section");
            url.searchParams.delete("like");
        } else {
            url.searchParams.set("section", "likes");
            url.searchParams.set("like", activeLikeTab);
        }
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const handleLikeTabSelect = (tab: LikeTabKey) => {
        setActiveLikeTab(tab);
        if (tab === "music") {
            setMusicPage(1);
        }

        const url = new URL(window.location.href);
        url.searchParams.set("section", "likes");
        url.searchParams.set("like", tab);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const currentLikeTab = LIKE_TABS.find((t) => t.key === activeLikeTab)!;
    const musicTotalPages = Math.max(1, Math.ceil(likedSongs.length / MUSIC_PAGE_SIZE));
    const currentMusicPage = Math.min(musicPage, musicTotalPages);
    const visibleLikedSongs = likedSongs.slice(
        (currentMusicPage - 1) * MUSIC_PAGE_SIZE,
        currentMusicPage * MUSIC_PAGE_SIZE,
    );

    // メインコンテンツの描画ロジックを関数として集約
    const renderContent = () => {
        if (!isLoggedIn || (activeSection === "likes" && blogRequiresLogin)) {
            return (
                <div className="like-empty-note">
                    マイリストを表示するにはログインが必要です。<br />
                    <Link href="/login" style={{ color: "var(--pink)", textDecoration: "underline", marginTop: "10px", display: "inline-block" }}>
                        ログイン画面へ
                    </Link>
                </div>
            );
        }

        if (loading) {
            return <div className="like-empty-note">読み込み中...</div>;
        }

        if (activeSection === "follows") {
            return likedJuniors.length > 0 ? (
                <IdleList idles={likedJuniors} onToggleLike={toggleJuniorLike} />
            ) : (
                <div className="like-empty-note">フォロー中のジュニアはありません。</div>
            );
        }

        switch (activeLikeTab) {
            case "music":
                return likedSongs.length > 0 ? (
                    <MusicList songs={visibleLikedSongs} />
                ) : (
                    <div className="like-empty-note">いいねした楽曲はありません。</div>
                );
            case "blog":
                if (blogLoading) {
                    return <div className="like-empty-note">読み込み中...</div>;
                }
                if (blogError) {
                    return <div className="like-empty-note">{blogError}</div>;
                }
                return (
                    <BlogPostList
                        posts={likedBlogs}
                        emptyMessage="いいねしたブログはありません。"
                        detailSource="liked-blogs"
                        onPostUnliked={(postId) => {
                            setLikedBlogs((current) => current.filter((post) => post.id !== postId));
                        }}
                    />
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

                .like-page .like-tabs,
                .like-page .like-sub-tabs {
                    display: flex;
                    background: #f5f5f5;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 24px;
                }

                .like-page .like-sub-tabs {
                    width: min(360px, 100%);
                    margin: 0 auto 32px;
                    background: #fff;
                    border: 1px solid var(--border);
                }

                .like-page .like-tab,
                .like-page .like-sub-tab {
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

                .like-page .like-sub-tab {
                    padding: 10px 0;
                    font-size: 13px;
                }

                .like-page .like-tab.active,
                .like-page .like-sub-tab.active {
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
                    gap: 8px;
                    margin-top: 32px;
                    font-size: 14px;
                    color: #888;
                }

                .like-page .like-pagination button {
                    min-width: 34px;
                    height: 34px;
                    padding: 0 9px;
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    background: #fff;
                    color: #777;
                    font: inherit;
                    font-weight: 700;
                    cursor: pointer;
                }

                .like-page .like-pagination button:hover:not(:disabled) {
                    border-color: var(--pink);
                    color: var(--pink);
                    background: #fff8fb;
                }

                .like-page .like-pagination button:disabled {
                    cursor: not-allowed;
                    opacity: 0.45;
                }

                .like-page .like-pagination .current {
                    border-color: var(--pink);
                    background: var(--pink);
                    color: #fff;
                    cursor: default;
                    opacity: 1;
                }

                .like-page .like-pagination .current:hover {
                    color: var(--pink);
                    background: var(--pink);
                    color: #fff;
                }
            `}</style>

            <h1 className="like-title">My List</h1>

            <div className="like-tabs">
                <button
                    type="button"
                    className={`like-tab ${activeSection === "follows" ? "active" : ""}`}
                    onClick={() => handleSectionSelect("follows")}
                >
                    Follows
                </button>
                <button
                    type="button"
                    className={`like-tab ${activeSection === "likes" ? "active" : ""}`}
                    onClick={() => handleSectionSelect("likes")}
                >
                    Likes
                </button>
            </div>

            {activeSection === "likes" && (
                <div className="like-sub-tabs">
                    {LIKE_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`like-sub-tab ${activeLikeTab === tab.key ? "active" : ""}`}
                            onClick={() => handleLikeTabSelect(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="like-section-label">
                <span className="dots">・ ・ ・</span>
                {activeSection === "follows" ? "FOLLOWS" : currentLikeTab.sectionLabel}
                <span className="dots">・ ・ ・</span>
            </div>

            {renderContent()}

            {isLoggedIn && !loading && activeSection === "likes" && activeLikeTab === "music" && likedSongs.length > MUSIC_PAGE_SIZE && (
                <div className="like-pagination">
                    <button
                        type="button"
                        onClick={() => setMusicPage((page) => Math.max(1, page - 1))}
                        disabled={currentMusicPage === 1}
                        aria-label="前のページ"
                    >
                        &lt;
                    </button>
                    {Array.from({ length: musicTotalPages }, (_, index) => index + 1).map((page) => (
                        <button
                            key={page}
                            type="button"
                            className={page === currentMusicPage ? "current" : undefined}
                            onClick={() => setMusicPage(page)}
                            disabled={page === currentMusicPage}
                            aria-current={page === currentMusicPage ? "page" : undefined}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setMusicPage((page) => Math.min(musicTotalPages, page + 1))}
                        disabled={currentMusicPage === musicTotalPages}
                        aria-label="次のページ"
                    >
                        &gt;
                    </button>
                </div>
            )}
        </section>
    );
}
