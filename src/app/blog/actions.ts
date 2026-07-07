"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { formatBlogDate, type BlogCommentItem } from "@/lib/blog-data";

type BlogActionResult =
    | { status: "success"; liked: boolean; likeCount: number }
    | { status: "error"; message: string };

type BlogCommentResult =
    | { status: "success"; comment: BlogCommentItem; commentCount: number }
    | { status: "error"; message: string };

type DeleteBlogCommentResult =
    | { status: "success"; commentId: string; commentCount: number }
    | { status: "error"; message: string };

type IncrementBlogViewResult =
    | { status: "success"; viewCount: number }
    | { status: "error"; message: string };

type InsertedBlogComment = {
    id: string;
    body: string;
    created_at: string;
    profiles: { name: string } | null;
};

const COMMENT_MAX_LENGTH = 300;

async function getAuthenticatedSupabase() {
    const supabase = await createSupabaseServer();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { supabase, user: null };
    }

    return { supabase, user };
}

async function getPaidPlanSupabase() {
    const { supabase, user } = await getAuthenticatedSupabase();
    if (!user) {
        return { supabase, user: null, canUseBlogActions: false };
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("plan:plans(monthly_price)")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Failed to fetch blog action plan:", error);
        return { supabase, user, canUseBlogActions: false };
    }

    const profile = data as { plan: { monthly_price: number } | null } | null;
    return {
        supabase,
        user,
        canUseBlogActions: (profile?.plan?.monthly_price ?? 0) > 0,
    };
}

async function getBlogLikeCount(
    supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
    postId: string,
) {
    const { count, error } = await supabase
        .from("blog_likes")
        .select("id", { count: "exact", head: true })
        .eq("blog_posts_id", postId);

    if (error) throw error;
    return count ?? 0;
}

async function getBlogCommentCount(
    supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
    postId: string,
) {
    const { count, error } = await supabase
        .from("blog_comments")
        .select("id", { count: "exact", head: true })
        .eq("blog_posts_id", postId);

    if (error) throw error;
    return count ?? 0;
}

export async function incrementBlogView(postId: string): Promise<IncrementBlogViewResult> {
    if (!postId) {
        return { status: "error", message: "ブログ投稿を確認できませんでした。" };
    }

    const { supabase, user, canUseBlogActions } = await getPaidPlanSupabase();
    if (!user || !canUseBlogActions) {
        return { status: "error", message: "ブログの本文閲覧は有料プランに加入する必要があります" };
    }

    const { error } = await supabase.rpc("increment_blog_view", {
        blog_id: postId,
    });

    if (error) {
        console.error("Failed to increment blog view:", error);
        return { status: "error", message: "閲覧数を更新できませんでした。" };
    }

    const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("view_count")
        .eq("id", postId)
        .maybeSingle();

    if (fetchError || !data) {
        console.error("Failed to fetch blog view count:", fetchError);
        return { status: "error", message: "閲覧数を確認できませんでした。" };
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${postId}`);

    return { status: "success", viewCount: data.view_count };
}

export async function toggleBlogLike(postId: string): Promise<BlogActionResult> {
    if (!postId) {
        return { status: "error", message: "ブログ投稿を確認できませんでした。" };
    }

    const { supabase, user, canUseBlogActions } = await getPaidPlanSupabase();
    if (!user) {
        return { status: "error", message: "いいねするにはログインしてください。" };
    }
    if (!canUseBlogActions) {
        return { status: "error", message: "ブログの本文閲覧は有料プランに加入する必要があります" };
    }

    const { data: currentLike, error: currentLikeError } = await supabase
        .from("blog_likes")
        .select("id")
        .eq("blog_posts_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (currentLikeError) {
        console.error("Failed to fetch blog like:", currentLikeError);
        return { status: "error", message: "いいね状態を確認できませんでした。" };
    }

    if (currentLike) {
        const { error } = await supabase
            .from("blog_likes")
            .delete()
            .eq("id", currentLike.id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Failed to delete blog like:", error);
            return { status: "error", message: "いいねを解除できませんでした。" };
        }
    } else {
        const { error } = await supabase
            .from("blog_likes")
            .insert({
                blog_posts_id: postId,
                user_id: user.id,
            });

        if (error) {
            console.error("Failed to insert blog like:", error);
            return { status: "error", message: "いいねできませんでした。" };
        }
    }

    try {
        const likeCount = await getBlogLikeCount(supabase, postId);
        revalidatePath("/blog");
        revalidatePath(`/blog/${postId}`);
        return { status: "success", liked: !currentLike, likeCount };
    } catch (error) {
        console.error("Failed to count blog likes:", error);
        return { status: "error", message: "いいね数を確認できませんでした。" };
    }
}

export async function createBlogComment(
    postId: string,
    body: string,
): Promise<BlogCommentResult> {
    const comment = body.trim();

    if (!postId) {
        return { status: "error", message: "ブログ投稿を確認できませんでした。" };
    }

    if (!comment) {
        return { status: "error", message: "コメントを入力してください。" };
    }

    if (comment.length > COMMENT_MAX_LENGTH) {
        return {
            status: "error",
            message: `コメントは${COMMENT_MAX_LENGTH}文字以内で入力してください。`,
        };
    }

    const { supabase, user, canUseBlogActions } = await getPaidPlanSupabase();
    if (!user) {
        return { status: "error", message: "コメントするにはログインしてください。" };
    }
    if (!canUseBlogActions) {
        return { status: "error", message: "ブログの本文閲覧は有料プランに加入する必要があります" };
    }

    const { data, error } = await supabase
        .from("blog_comments")
        .insert({
            blog_posts_id: postId,
            user_id: user.id,
            body: comment,
        })
        .select("id,body,created_at,profiles(name)")
        .single();

    if (error) {
        console.error("Failed to create blog comment:", error);
        return { status: "error", message: "コメントを送信できませんでした。" };
    }

    try {
        const savedComment = data as unknown as InsertedBlogComment;
        const commentCount = await getBlogCommentCount(supabase, postId);
        revalidatePath("/blog");
        revalidatePath(`/blog/${postId}`);

        return {
            status: "success",
            comment: {
                id: savedComment.id,
                author: savedComment.profiles?.name ?? "あなた",
                text: savedComment.body,
                date: formatBlogDate(savedComment.created_at),
                canDelete: true,
            },
            commentCount,
        };
    } catch (error) {
        console.error("Failed to count blog comments:", error);
        return { status: "error", message: "コメント数を確認できませんでした。" };
    }
}

export async function deleteBlogComment(
    postId: string,
    commentId: string,
): Promise<DeleteBlogCommentResult> {
    if (!postId || !commentId) {
        return { status: "error", message: "削除するコメントを確認できませんでした。" };
    }

    const { supabase, user } = await getAuthenticatedSupabase();
    if (!user) {
        return { status: "error", message: "コメントを削除するにはログインしてください。" };
    }

    const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", commentId)
        .eq("blog_posts_id", postId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to delete blog comment:", error);
        return { status: "error", message: "コメントを削除できませんでした。" };
    }

    try {
        const commentCount = await getBlogCommentCount(supabase, postId);
        revalidatePath("/blog");
        revalidatePath(`/blog/${postId}`);
        return { status: "success", commentId, commentCount };
    } catch (error) {
        console.error("Failed to count blog comments:", error);
        return { status: "error", message: "コメント数を確認できませんでした。" };
    }
}
