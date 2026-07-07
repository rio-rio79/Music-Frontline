import { createSupabaseServer } from "@/lib/supabase-server";

export type BlogTab = "all" | "following";

export type BlogListItem = {
    id: string;
    authorId: string;
    authorName: string;
    authorInitials: string;
    authorAffiliation: string;
    isOshi: boolean;
    date: string;
    title: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    liked: boolean;
    canInteract: boolean;
};

export type BlogCommentItem = {
    id: string;
    author: string;
    text: string;
    date: string;
    canDelete: boolean;
};

export type BlogOtherPost = {
    id: string;
    title: string;
    date: string;
    authorName: string;
    authorInitials: string;
};

export type BlogDetailItem = BlogListItem & {
    body: string;
    canReadBody: boolean;
    otherPosts: BlogOtherPost[];
    comments: BlogCommentItem[];
};

type RelatedGroup = {
    name: string;
};

type RelatedJunior = {
    id: string;
    name: string;
    region: string | null;
    groups: RelatedGroup | null;
};

type RawBlogPost = {
    id: string;
    junior_id: string;
    title: string;
    body?: string;
    published_at: string;
    view_count: number;
    juniors: RelatedJunior | null;
};

type RawBlogComment = {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    profiles: { name: string } | null;
};

const blogPostOverviewSelection = `
    id,
    junior_id,
    title,
    published_at,
    view_count,
    juniors!inner (
        id,
        name,
        region,
        groups (
            name
        )
    )
`;

export function formatBlogDate(value: string) {
    return new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));
}

function formatAffiliation(junior: RelatedJunior) {
    if (junior.groups?.name) return junior.groups.name;
    if (junior.region === "kanto") return "関東ジュニア";
    if (junior.region === "kansai") return "関西ジュニア";
    return "無所属";
}

function getInitials(name: string) {
    return name.slice(0, 2);
}

function countByPostId(rows: { blog_posts_id: string }[]) {
    const counts = new Map<string, number>();
    for (const row of rows) {
        counts.set(row.blog_posts_id, (counts.get(row.blog_posts_id) ?? 0) + 1);
    }
    return counts;
}

export async function getBlogListPage({
    page,
    pageSize,
    tab,
    authorId,
}: {
    page: number;
    pageSize: number;
    tab: BlogTab;
    authorId?: string;
}) {
    const supabase = await createSupabaseServer();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const [profileResult, followsResult] = await Promise.all([
        user
            ? supabase
                .from("profiles")
                .select("oshi_junior_id,plan:plans(monthly_price)")
                .eq("id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        user && tab === "following"
            ? supabase
                .from("follow_juniors")
                .select("junior_id")
                .eq("user_id", user.id)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (profileResult.error) throw new Error(profileResult.error.message);
    if (followsResult.error) throw new Error(followsResult.error.message);

    const followedJuniorIds = (followsResult.data ?? []).map((row) => row.junior_id);
    if (tab === "following" && followedJuniorIds.length === 0) {
        return { posts: [] as BlogListItem[], totalCount: 0 };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
        .from("blog_posts")
        .select(blogPostOverviewSelection, { count: "exact" })
        .order("published_at", { ascending: false })
        .range(from, to);

    if (tab === "following") query = query.in("junior_id", followedJuniorIds);
    if (authorId) query = query.eq("junior_id", authorId);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rawPosts = (data ?? []) as unknown as RawBlogPost[];
    const postIds = rawPosts.map((post) => post.id);
    if (postIds.length === 0) {
        return { posts: [] as BlogListItem[], totalCount: count ?? 0 };
    }

    const [likesResult, commentsResult] = await Promise.all([
        supabase
            .from("blog_likes")
            .select("blog_posts_id,user_id")
            .in("blog_posts_id", postIds),
        supabase
            .from("blog_comments")
            .select("blog_posts_id")
            .in("blog_posts_id", postIds),
    ]);

    if (likesResult.error) throw new Error(likesResult.error.message);
    if (commentsResult.error) throw new Error(commentsResult.error.message);

    const likes = likesResult.data ?? [];
    const likeCounts = countByPostId(likes);
    const commentCounts = countByPostId(commentsResult.data ?? []);
    const profileData = profileResult.data as {
        oshi_junior_id: string | null;
        plan: { monthly_price: number } | null;
    } | null;
    const canInteract = Boolean(user && (profileData?.plan?.monthly_price ?? 0) > 0);
    const userId = user?.id;
    const likedPostIds = new Set(
        canInteract && userId ? likes.filter((like) => like.user_id === userId).map((like) => like.blog_posts_id) : [],
    );
    const oshiJuniorId = profileData?.oshi_junior_id ?? null;

    const posts = rawPosts.flatMap((post): BlogListItem[] => {
        if (!post.juniors) return [];

        return [{
            id: post.id,
            authorId: post.junior_id,
            authorName: post.juniors.name,
            authorInitials: getInitials(post.juniors.name),
            authorAffiliation: formatAffiliation(post.juniors),
            isOshi: post.junior_id === oshiJuniorId,
            date: formatBlogDate(post.published_at),
            title: post.title,
            viewCount: post.view_count,
            likeCount: likeCounts.get(post.id) ?? 0,
            commentCount: commentCounts.get(post.id) ?? 0,
            liked: likedPostIds.has(post.id),
            canInteract,
        }];
    });

    return { posts, totalCount: count ?? 0 };
}

export async function getBlogDetail(postId: string): Promise<BlogDetailItem | null> {
    const supabase = await createSupabaseServer();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("blog_posts")
        .select(blogPostOverviewSelection)
        .eq("id", postId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const post = data as unknown as RawBlogPost;
    if (!post.juniors) return null;

    const [profileResult, likesResult, otherPostsResult] = await Promise.all([
        user
            ? supabase
                .from("profiles")
                .select("oshi_junior_id,plan:plans(monthly_price)")
                .eq("id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        supabase
            .from("blog_likes")
            .select("user_id", { count: "exact" })
            .eq("blog_posts_id", postId),
        supabase
            .from("blog_posts")
            .select(blogPostOverviewSelection)
            .neq("junior_id", post.junior_id)
            .order("published_at", { ascending: false })
            .limit(3),
    ]);

    for (const result of [profileResult, likesResult, otherPostsResult]) {
        if (result.error) throw new Error(result.error.message);
    }

    const profileData = profileResult.data as {
        oshi_junior_id: string | null;
        plan: { monthly_price: number } | null;
    } | null;
    const canReadBody = Boolean(user && (profileData?.plan?.monthly_price ?? 0) > 0);

    const [bodyResult, commentsResult] = await Promise.all([
        canReadBody
            ? supabase
                .from("blog_posts")
                .select("body")
                .eq("id", postId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        canReadBody
            ? supabase
                .from("blog_comments")
                .select("id,body,created_at,user_id,profiles(name)", { count: "exact" })
                .eq("blog_posts_id", postId)
                .order("created_at", { ascending: false })
            : supabase
                .from("blog_comments")
                .select("id", { count: "exact", head: true })
                .eq("blog_posts_id", postId),
    ]);

    if (bodyResult.error) throw new Error(bodyResult.error.message);
    if (commentsResult.error) throw new Error(commentsResult.error.message);

    const liked = Boolean(
        canReadBody && user && (likesResult.data ?? []).some((like) => like.user_id === user.id),
    );
    const comments = ((commentsResult.data ?? []) as unknown as RawBlogComment[]).map(
        (comment): BlogCommentItem => ({
            id: comment.id,
            author: comment.profiles?.name ?? "ユーザー",
            text: comment.body,
            date: formatBlogDate(comment.created_at),
            canDelete: comment.user_id === user?.id,
        }),
    );
    const otherPosts = ((otherPostsResult.data ?? []) as unknown as RawBlogPost[]).flatMap(
        (other): BlogOtherPost[] => {
            if (!other.juniors) return [];
            return [{
                id: other.id,
                title: other.title,
                date: formatBlogDate(other.published_at),
                authorName: other.juniors.name,
                authorInitials: getInitials(other.juniors.name),
            }];
        },
    );

    return {
        id: post.id,
        authorId: post.junior_id,
        authorName: post.juniors.name,
        authorInitials: getInitials(post.juniors.name),
        authorAffiliation: formatAffiliation(post.juniors),
        isOshi: post.junior_id === profileData?.oshi_junior_id,
        date: formatBlogDate(post.published_at),
        title: post.title,
        body: canReadBody
            ? ((bodyResult.data as { body: string } | null)?.body ?? "")
            : "ブログの本文閲覧は有料プランに加入する必要があります",
        canReadBody,
        canInteract: canReadBody,
        viewCount: post.view_count,
        likeCount: likesResult.count ?? 0,
        commentCount: commentsResult.count ?? 0,
        liked,
        otherPosts,
        comments,
    };
}
