import Link from "next/link";
import songs from "../../data/songs";

export default function MusicTop() {
    return (
        <section>
            <h1>楽曲一覧ページ</h1>
            <ul>
                {songs.map((song) => (
                    <li key={song.id}>
                        <Link href={`/music/${song.id}`}>
                            <h2>{song.title}</h2>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
