import posts from "../../../data/posts";

type BlogDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function BlogDetailPage({
    params,
}: BlogDetailPageProps) {
    const { id } = await params;

    const post = posts.find((post) => post.id === Number(id));

    return (
        <section>
            <h1>ブログ詳細ページ</h1>
            <h2>{post?.title}</h2>
        </section>
    );
}
