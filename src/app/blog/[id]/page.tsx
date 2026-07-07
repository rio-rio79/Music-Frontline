import { notFound } from "next/navigation";
import { getBlogDetail } from "@/lib/blog-data";
import BlogPostClient from "./BlogPostClient";

type BlogDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function BlogDetailPage({
    params,
}: BlogDetailPageProps) {
    const { id } = await params;
    const post = await getBlogDetail(id);

    if (!post) notFound();

    return <BlogPostClient post={post} />;
}
