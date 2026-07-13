"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { type BlogListItem } from "@/lib/blog-data";
import { toggleBlogLike } from "./actions";
import BlogAvatar from "./BlogAvatar";
import { CommentIcon, HeartIcon } from "./BlogIcons";
import styles from "./Blog.module.css";
import { Heart } from "../../components/Svgs";

type LikeState = {
    liked: boolean;
    likeCount: number;
};

type BlogPostListProps = {
    posts: BlogListItem[];
    emptyMessage: ReactNode;
    detailSource?: string;
    onPostUnliked?: (postId: string) => void;
};

export default function BlogPostList({
    posts,
    emptyMessage,
    detailSource,
    onPostUnliked,
}: BlogPostListProps) {
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
            if (!result.liked) {
                onPostUnliked?.(post.id);
            }
            return;
        }

        setLikeStates((current) => ({
            ...current,
            [post.id]: currentState,
        }));
        setErrorMessage(result.message);
    };

    if (posts.length === 0) {
        return <div className={styles.emptyState}>{emptyMessage}</div>;
    }

    const getPostHref = (postId: string) => {
        const href = `/blog/${postId}`;
        return detailSource ? `${href}?from=${encodeURIComponent(detailSource)}` : href;
    };

    return (
        <>
            {errorMessage && <p className={styles.formError} role="alert">{errorMessage}</p>}

            <div>
                {posts.map((post) => {
                    const likeState = getLikeState(post);
                    const likePending = Boolean(pendingLikeIds[post.id]);
                    const postHref = getPostHref(post.id);

                    return (
                        <article
                            key={post.id}
                            className={styles.postCard}
                            data-post-id={post.id}
                            role="link"
                            tabIndex={0}
                            onClick={() => router.push(postHref)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") router.push(postHref);
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
                                            <Heart width={16} height={16} color="#9a8f95"/>
                                            <span>{likeState.likeCount.toLocaleString()}</span>
                                        </button>
                                    ) : (
                                        <span className={styles.stat} aria-label={`いいね数 ${post.likeCount.toLocaleString()}`}>
                                            <Heart width={16} height={16} color="#9a8f95"/>
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
        </>
    );
}
