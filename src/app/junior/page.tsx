import Link from "next/link";
import juniors from "../../data/juniors";

export default function JuniorTop() {
    return (
        <section>
            <h1>ジュニア一覧ページ</h1>
            <ul>
                {juniors.map((junior) => (
                    <li key={junior.id}>
                        <Link href={`/junior/${junior.id}`}>
                            <h2>{junior.name}</h2>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
