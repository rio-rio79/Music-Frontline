import { redirect } from "next/navigation";
import { getBlogListPage, type BlogTab } from "@/lib/blog-data";
import BlogListClient from "./BlogListClient";

const PAGE_SIZE = 30;

type BlogTopProps = {
    searchParams: Promise<{
        page?: string;
        tab?: string;
        author?: string;
    }>;
};

export default async function BlogTop({ searchParams }: BlogTopProps) {
    const query = await searchParams;
    const requestedPage = Number.parseInt(query.page ?? "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const tab: BlogTab = query.tab === "following" ? "following" : "all";
    const authorId = query.author?.trim() || undefined;

    const { posts, totalCount } = await getBlogListPage({
        page,
        pageSize: PAGE_SIZE,
        tab,
        authorId,
    });
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    if (page > totalPages) {
        const params = new URLSearchParams();
        if (tab === "following") params.set("tab", tab);
        if (authorId) params.set("author", authorId);
        params.set("page", String(totalPages));
        redirect(`/blog?${params.toString()}`);
    }

    return (
        <BlogListClient
            posts={posts}
            activeTab={tab}
            currentPage={page}
            totalPages={totalPages}
            authorId={authorId}
        />
    );
}
