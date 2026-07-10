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

type BlogCommentRpcResult = {
    comment_id: string;
    body: string;
    created_at: string;
    author_name: string;
    comment_count: number;
};

type BlogViewRpcResult = {
    view_count: number;
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

export async function incrementBlogView(postId: string): Promise<IncrementBlogViewResult> {
    if (!postId) {
        return { status: "error", message: "ブログ投稿を確認できませんでした。" };
    }

    const { supabase, user, canUseBlogActions } = await getPaidPlanSupabase();
    if (!user || !canUseBlogActions) {
        return { status: "error", message: "ブログの本文閲覧は有料プランに加入する必要があります" };
    }

    const { data, error } = await supabase.rpc("record_blog_view_with_points", {
        p_blog_post_id: postId,
    });

    if (error) {
        console.error("Failed to increment blog view:", error);
        return { status: "error", message: "閲覧数を更新できませんでした。" };
    }

    const result = data as BlogViewRpcResult;

    revalidatePath("/blog");
    revalidatePath(`/blog/${postId}`);

    return { status: "success", viewCount: result.view_count };
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

    const { data, error } = await supabase.rpc("toggle_blog_like_with_points", {
        p_blog_post_id: postId,
    });

    if (error) {
        console.error("Failed to toggle blog like:", error);
        return { status: "error", message: "いいねを更新できませんでした。" };
    }

    const result = data as { liked: boolean; like_count: number };
    revalidatePath("/blog");
    revalidatePath(`/blog/${postId}`);
    return {
        status: "success",
        liked: result.liked,
        likeCount: result.like_count,
    };
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

    const { data, error } = await supabase.rpc("create_blog_comment_with_points", {
        p_blog_post_id: postId,
        p_body: comment,
    });

    if (error) {
        console.error("Failed to create blog comment:", error);
        return { status: "error", message: "コメントを送信できませんでした。" };
    }

    const savedComment = data as unknown as BlogCommentRpcResult;
    revalidatePath("/blog");
    revalidatePath(`/blog/${postId}`);

    return {
        status: "success",
        comment: {
            id: savedComment.comment_id,
            author: savedComment.author_name,
            text: savedComment.body,
            date: formatBlogDate(savedComment.created_at),
            canDelete: true,
        },
        commentCount: savedComment.comment_count,
    };
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

    const { data, error } = await supabase.rpc("delete_blog_comment_with_points", {
        p_blog_post_id: postId,
        p_comment_id: commentId,
    });

    if (error) {
        console.error("Failed to delete blog comment:", error);
        return { status: "error", message: "コメントを削除できませんでした。" };
    }

    const result = data as { comment_id: string; comment_count: number };
    revalidatePath("/blog");
    revalidatePath(`/blog/${postId}`);
    return {
        status: "success",
        commentId: result.comment_id,
        commentCount: result.comment_count,
    };
}
