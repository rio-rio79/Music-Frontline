"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type BlogJuniorLink, type BlogListItem, type BlogTab } from "@/lib/blog-data";
import { toggleBlogLike } from "./actions";
import PageHeading from "@/components/PageHeading";
import PageShell from "@/components/PageShell";
import BlogAvatar from "./BlogAvatar";
import BlogJuniorFinder from "./BlogJuniorFinder";
import { CommentIcon, HeartIcon } from "./BlogIcons";
import styles from "./Blog.module.css";


type BlogListClientProps = {
    posts: BlogListItem[];
    activeTab: BlogTab;
    currentPage: number;
    totalPages: number;
    authorId?: string;
    juniors: BlogJuniorLink[];
};

type LikeState = {
    liked: boolean;
    likeCount: number;
};

function getPageItems(currentPage: number, totalPages: number) {
    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const visiblePages = [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b);
    const items: Array<number | "ellipsis"> = [];

    visiblePages.forEach((page, index) => {
        if (index > 0 && page - visiblePages[index - 1] > 1) items.push("ellipsis");
        items.push(page);
    });
    return items;
}

function buildBlogHref(page: number, tab: BlogTab, authorId?: string) {
    const params = new URLSearchParams();
    if (tab === "following") params.set("tab", tab);
    if (authorId) params.set("author", authorId);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/blog?${query}` : "/blog";
}

export default function BlogListClient({
    posts,
    activeTab,
    currentPage,
    totalPages,
    authorId,
    juniors = [],
}: BlogListClientProps) {
    const router = useRouter();
    const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});
    const [pendingLikeIds, setPendingLikeIds] = useState<Record<string, boolean>>({});
    const [errorMessage, setErrorMessage] = useState("");

    const getLikeState = (post: BlogListItem) => likeStates[post.id] ?? {
        liked: post.liked,
        likeCount: post.likeCount,
    };

    const handleToggleLike = async (post: BlogListItem) => {
        if (pendingLikeIds[post.id]) return;

        const currentState = getLikeState(post);
        const optimisticState = {
            liked: !currentState.liked,
            likeCount: currentState.likeCount + (currentState.liked ? -1 : 1),
        };

        setErrorMessage("");
        setPendingLikeIds((current) => ({ ...current, [post.id]: true }));
        setLikeStates((current) => ({
            ...current,
            [post.id]: optimisticState,
        }));

        const result = await toggleBlogLike(post.id);

        setPendingLikeIds((current) => {
            const next = { ...current };
            delete next[post.id];
            return next;
        });

        if (result.status === "success") {
            setLikeStates((current) => ({
                ...current,
                [post.id]: {
                    liked: result.liked,
                    likeCount: result.likeCount,
                },
            }));
            return;
        }

        setLikeStates((current) => ({
            ...current,
            [post.id]: currentState,
        }));
        setErrorMessage(result.message);
    };

    const selectTab = (tab: BlogTab) => {
        router.push(buildBlogHref(1, tab));
    };

    return (
        <PageShell className={styles.page}>
            <div className={styles.pageHeader}>
                <PageHeading title="Blog" />
            </div>

            <div className={styles.tabs} role="tablist" aria-label="ブログ一覧タブ">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "all"}
                    className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
                    onClick={() => selectTab("all")}
                >
                    最新の投稿
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "following"}
                    className={`${styles.tab} ${activeTab === "following" ? styles.tabActive : ""}`}
                    onClick={() => selectTab("following")}
                >
                    フォロー中
                </button>
            </div>
            {errorMessage && <p className={styles.formError} role="alert">{errorMessage}</p>}

            {posts.length > 0 ? (
                <div className={styles.postGrid}>
                    {posts.map((post) => {
                        const likeState = getLikeState(post);
                        const likePending = Boolean(pendingLikeIds[post.id]);

                        return (
                            <article
                                key={post.id}
                                className={styles.postCard}
                                data-post-id={post.id}
                                role="link"
                                tabIndex={0}
                                onClick={() => router.push(`/blog/${post.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") router.push(`/blog/${post.id}`);
                                }}
                            >
                                <BlogAvatar
                                    src={post.authorImageUrl}
                                    alt={`${post.authorName}の画像`}
                                    initials={post.authorInitials}
                                    className={styles.avatar}
                                    imageClassName={styles.avatarImage}
                                    size={44}
                                />
                                <div className={styles.postContent}>
                                    <div className={styles.postMeta}>
                                        <span className={styles.authorName}>{post.authorName}</span>
                                        {post.isOshi && <span className={styles.oshiBadge}>推し</span>}
                                        <span className={styles.affiliation}>{post.authorAffiliation}</span>
                                        <time className={styles.date}>{post.date}</time>
                                    </div>
                                    <h2 className={styles.postTitle}>{post.title}</h2>
                                    <div className={styles.actions}>
                                        {post.canInteract ? (
                                            <button
                                                type="button"
                                                className={`${styles.likeButton} ${likeState.liked ? styles.likeButtonLiked : ""}`}
                                                aria-pressed={likeState.liked}
                                                aria-label={`${post.title}にいいね`}
                                                disabled={likePending}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void handleToggleLike(post);
                                                }}
                                            >
                                                <HeartIcon />
                                                <span>{likeState.likeCount.toLocaleString()}</span>
                                            </button>
                                        ) : (
                                            <span className={styles.stat} aria-label={`いいね数 ${post.likeCount.toLocaleString()}`}>
                                                <HeartIcon />
                                                <span>{post.likeCount.toLocaleString()}</span>
                                            </span>
                                        )}
                                        <span className={styles.stat} aria-label={`コメント数 ${post.commentCount}`}>
                                            <CommentIcon />
                                            <span>{post.commentCount}</span>
                                        </span>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    {activeTab === "following" ? (
                        <>
                            フォロー中のジュニアの投稿はまだありません。<br />
                            気になるジュニアをフォローしてみましょう。
                        </>
                    ) : (
                        <>表示できる投稿はありません。</>
                    )}
                </div>
            )}

            {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="ブログ一覧のページ切り替え">
                    {currentPage > 1 && (
                        <Link
                            href={buildBlogHref(currentPage - 1, activeTab, authorId)}
                            className={styles.paginationArrow}
                            aria-label="前のページ"
                        >
                            ‹
                        </Link>
                    )}
                    {getPageItems(currentPage, totalPages).map((item, index) =>
                        item === "ellipsis" ? (
                            <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>…</span>
                        ) : (
                            <Link
                                key={item}
                                href={buildBlogHref(item, activeTab, authorId)}
                                className={`${styles.paginationLink} ${item === currentPage ? styles.paginationCurrent : ""}`}
                                aria-current={item === currentPage ? "page" : undefined}
                            >
                                {item}
                            </Link>
                        ),
                    )}
                    {currentPage < totalPages && (
                        <Link
                            href={buildBlogHref(currentPage + 1, activeTab, authorId)}
                            className={styles.paginationArrow}
                            aria-label="次のページ"
                        >
                            ›
                        </Link>
                    )}
                </nav>
            )}

            <BlogJuniorFinder juniors={juniors} />
        </PageShell>
    );
}
