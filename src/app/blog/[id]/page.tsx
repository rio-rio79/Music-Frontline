import { notFound } from "next/navigation";
import { getBlogDetail } from "@/lib/blog-data";
import BlogPostClient from "./BlogPostClient";

type BlogDetailPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        from?: string | string[];
    }>;
};

export default async function BlogDetailPage({
    params,
    searchParams,
}: BlogDetailPageProps) {
    const { id } = await params;
    const query = await searchParams;
    const post = await getBlogDetail(id);

    if (!post) notFound();

    const from = Array.isArray(query.from) ? query.from[0] : query.from;
    const backLink = from === "liked-blogs"
        ? { href: "/my/list?section=likes&like=blog", label: "マイリストに戻る" }
        : { href: "/blog", label: "ブログ一覧に戻る" };

    return <BlogPostClient post={post} backLink={backLink} />;
}
