import Link from "next/link";
import posts from "../../data/posts";

export default function BlogTop() {
    return (
        <section>
            <h1>ブログTOPページ</h1>
            <ul>
                {posts.map((post) => (
                    <li key={post.id}>
                        <Link href={`/blog/${post.id}`}>
                            <h2>{post.title}</h2>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
