"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { COMMENT_FILTER_LABELS } from "@/lib/comment-filter";
import { type BlogDetailItem, type BlogJuniorLink } from "@/lib/blog-data";
import { createBlogComment, deleteBlogComment, incrementBlogView, toggleBlogLike } from "../actions";
import BlogAvatar from "../BlogAvatar";
import BlogJuniorFinder from "../BlogJuniorFinder";
import { CommentIcon } from "../BlogIcons";
import styles from "../Blog.module.css";
import { Heart } from "../../../components/Svgs"

type BlogPostClientProps = {
    post: BlogDetailItem;
    backLink: {
        href: string;
        label: string;
    };
    juniors: BlogJuniorLink[];
};

function LockIcon({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
    );
}

export default function BlogPostClient({ post, backLink, juniors }: BlogPostClientProps) {
    const [liked, setLiked] = useState(post.liked);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [commentDraft, setCommentDraft] = useState("");
    const [comments, setComments] = useState(post.comments);
    const [commentCount, setCommentCount] = useState(post.commentCount);
    const [isLikePending, setIsLikePending] = useState(false);
    const [isCommentPending, setIsCommentPending] = useState(false);
    const [deletingCommentIds, setDeletingCommentIds] = useState<Record<string, boolean>>({});
    const [errorMessage, setErrorMessage] = useState("");
    const countedViewRef = useRef(false);

    useEffect(() => {
        if (!post.canReadBody) return;
        if (countedViewRef.current) return;
        countedViewRef.current = true;

        void incrementBlogView(post.id);
    }, [post.canReadBody, post.id]);

    const handleToggleLike = async () => {
        if (isLikePending) return;

        const previousLiked = liked;
        const previousLikeCount = likeCount;

        setErrorMessage("");
        setIsLikePending(true);
        setLiked(!previousLiked);
        setLikeCount(previousLikeCount + (previousLiked ? -1 : 1));

        const result = await toggleBlogLike(post.id);
        setIsLikePending(false);

        if (result.status === "success") {
            setLiked(result.liked);
            setLikeCount(result.likeCount);
            return;
        }

        setLiked(previousLiked);
        setLikeCount(previousLikeCount);
        setErrorMessage(result.message);
    };

    const submitComment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const text = commentDraft.trim();
        if (!text) return;

        setErrorMessage("");
        setIsCommentPending(true);

        const result = await createBlogComment(post.id, text);
        setIsCommentPending(false);

        if (result.status === "error") {
            setErrorMessage(result.message);
            return;
        }

        setComments((current) => [result.comment, ...current]);
        setCommentCount(result.commentCount);
        setCommentDraft("");
    };

    const handleDeleteComment = async (commentId: string) => {
        if (deletingCommentIds[commentId]) return;

        const previousComments = comments;
        const previousCommentCount = commentCount;

        setErrorMessage("");
        setDeletingCommentIds((current) => ({ ...current, [commentId]: true }));
        setComments((current) => current.filter((comment) => comment.id !== commentId));
        setCommentCount((current) => Math.max(0, current - 1));

        const result = await deleteBlogComment(post.id, commentId);

        setDeletingCommentIds((current) => {
            const next = { ...current };
            delete next[commentId];
            return next;
        });

        if (result.status === "success") {
            setCommentCount(result.commentCount);
            return;
        }

        setComments(previousComments);
        setCommentCount(previousCommentCount);
        setErrorMessage(result.message);
    };

    return (
        <PageShell className={styles.page}>
            <Link href={backLink.href} className={styles.backLink}>‹ {backLink.label}</Link>

            <div className={styles.detailHeader}>
                <BlogAvatar
                    src={post.authorImageUrl}
                    alt={`${post.authorName}の画像`}
                    initials={post.authorInitials}
                    className={`${styles.avatar} ${styles.detailAvatar}`}
                    imageClassName={styles.avatarImage}
                    size={42}
                />
                <span className={`${styles.authorName} ${styles.detailAuthorName}`}>{post.authorName}</span>
                {post.isOshi && <span className={styles.oshiBadge}>推し</span>}
                <span className={`${styles.affiliation} ${styles.detailAffiliation}`}>{post.authorAffiliation}</span>
                <time className={`${styles.date} ${styles.detailDate}`}>{post.date}</time>
            </div>

            <h1 className={styles.detailTitle}>{post.title}</h1>
            {post.canReadBody ? (
                <p className={styles.detailBody}>{post.body}</p>
            ) : (
                <div className={styles.lockedBodyCard}>
                    <div className={styles.lockBadge}>
                        <LockIcon />
                    </div>
                    <div className={styles.lockedBodyTitle}>本文は有料プラン限定です</div>
                    <p className={styles.lockedBodyDescription}>
                        この投稿の本文とコメントを見るには、有料プランへの加入が必要です。
                    </p>
                    <Link href="/my/profile" className={styles.planCta}>
                        有料プランに加入する
                    </Link>
                </div>
            )}

            <div className={`${styles.actions} ${styles.detailActions}`}>
                {post.canInteract ? (
                    <button
                        type="button"
                        className={`${styles.likeButton} ${liked ? styles.likeButtonLiked : ""}`}
                        aria-pressed={liked}
                        aria-label={`${post.title}にいいね`}
                        disabled={isLikePending}
                        onClick={() => {
                            void handleToggleLike();
                        }}
                    >
                        <Heart width={19} height={19} color="#9a8f95"/>
                        <span>{likeCount.toLocaleString()}</span>
                    </button>
                ) : (
                    <span className={styles.stat} aria-label={`いいね数 ${likeCount.toLocaleString()}`}>
                        <Heart width={19} height={19} color="#9a8f95"/>
                        <span>{likeCount.toLocaleString()}</span>
                    </span>
                )}
                <span className={styles.stat} aria-label={`コメント数 ${commentCount}`}>
                    <CommentIcon size={19} />
                    <span>{commentCount}</span>
                </span>
            </div>
            {errorMessage && <p className={styles.formError} role="alert">{errorMessage}</p>}

            <Link href={`/junior/${post.authorId}?tab=blog`} className={styles.authorPostsLink}>
                <span>{post.authorName}さんの投稿一覧を見る</span>
                <span aria-hidden="true">›</span>
            </Link>

            {post.canReadBody && post.otherPosts.length > 0 && (
                <section className={styles.otherPosts}>
                    <div className={styles.sectionLabel}>他のジュニアの投稿</div>
                    {post.otherPosts.map((otherPost) => (
                        <Link key={otherPost.id} href={`/blog/${otherPost.id}`} className={styles.otherPostLink}>
                            <BlogAvatar
                                src={otherPost.authorImageUrl}
                                alt={`${otherPost.authorName}の画像`}
                                initials={otherPost.authorInitials}
                                className={styles.smallAvatar}
                                imageClassName={styles.avatarImage}
                                size={30}
                            />
                            <span className={styles.otherPostText}>
                                <span className={styles.otherPostTitle}>{otherPost.title}</span>
                                <span className={styles.otherPostMeta}>{otherPost.authorName} ・ {otherPost.date}</span>
                            </span>
                            <span className={styles.chevron} aria-hidden="true">›</span>
                        </Link>
                    ))}
                </section>
            )}

            <BlogJuniorFinder juniors={juniors} />

            {!post.canInteract && (
                <div className={styles.lockedCommentsNote}>
                    <LockIcon size={18} />
                    <span>コメントの閲覧には有料プランへの加入が必要です</span>
                </div>
            )}

            {post.canInteract && (
                <section className={styles.commentsSection}>
                    <h2 className={styles.commentsTitle}>コメント {commentCount}</h2>

                    <div className={styles.commentFilterNotice}>
                        <span>
                            コメント表示: {COMMENT_FILTER_LABELS[post.commentFilterMode]}
                            {!post.canUseCommentFilter ? "（プレミアムプランで変更できます）" : ""}
                        </span>
                        <Link href="/my/profile?modal=commentFilter" className={styles.commentFilterLink}>
                            設定を変更
                        </Link>
                    </div>

                    <form className={styles.commentForm} onSubmit={submitComment}>
                        <textarea
                            className={styles.commentInput}
                            maxLength={300}
                            placeholder="コメントを入力"
                            aria-label="コメント"
                            value={commentDraft}
                            onChange={(event) => setCommentDraft(event.target.value)}
                        />
                        <div className={styles.commentSubmitRow}>
                            <button className={styles.commentSubmit} type="submit" disabled={!commentDraft.trim() || isCommentPending}>
                                {isCommentPending ? "送信中..." : "送信"}
                            </button>
                        </div>
                    </form>

                    {comments.length > 0 ? (
                        <div>
                            {comments.map((comment) => (
                                <div className={styles.commentItem} key={comment.id}>
                                    <span className={styles.commentAvatar}>{comment.author.slice(0, 1)}</span>
                                    <div className={styles.commentContent}>
                                        <div className={styles.commentMeta}>
                                            <span className={styles.commentAuthor}>{comment.author}</span>
                                            <time className={styles.commentDate}>{comment.date}</time>
                                            {comment.canDelete && (
                                                <button
                                                    type="button"
                                                    className={styles.commentDelete}
                                                    disabled={Boolean(deletingCommentIds[comment.id])}
                                                    onClick={() => {
                                                        void handleDeleteComment(comment.id);
                                                    }}
                                                >
                                                    削除
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.commentText}>{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>まだコメントはありません。</div>
                    )}
                </section>
            )}
        </PageShell>
    );
}
