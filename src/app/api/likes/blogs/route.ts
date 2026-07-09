import { getLikedBlogPosts } from "@/lib/blog-data";

export async function GET() {
    try {
        const { authenticated, posts } = await getLikedBlogPosts();

        if (!authenticated) {
            return Response.json(
                { error: "認証されていません。" },
                { status: 401 },
            );
        }

        return Response.json({ posts });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Server error";
        return Response.json({ error: message }, { status: 500 });
    }
}
