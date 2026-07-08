"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type BlogListItem, type BlogTab } from "@/lib/blog-data";
import BlogPostList from "./BlogPostList";
import styles from "./Blog.module.css";

type BlogListClientProps = {
    posts: BlogListItem[];
    activeTab: BlogTab;
    currentPage: number;
    totalPages: number;
    authorId?: string;
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
}: BlogListClientProps) {
    const router = useRouter();

    const selectTab = (tab: BlogTab) => {
        router.push(buildBlogHref(1, tab));
    };

    return (
        <section className={styles.page}>
            <h1 className={styles.pageTitle}>ブログ</h1>
            <div className={styles.titleUnderline} />

            <div className={styles.tabs} role="tablist" aria-label="ブログ一覧タブ">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "all"}
                    className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
                    onClick={() => selectTab("all")}
                >
                    全ての投稿
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

            <BlogPostList
                posts={posts}
                emptyMessage={
                    activeTab === "following" ? (
                        <>
                            フォロー中のジュニアの投稿はまだありません。<br />
                            気になるジュニアをフォローしてみましょう。
                        </>
                    ) : (
                        <>表示できる投稿はありません。</>
                    )
                }
            />

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
        </section>
    );
}
