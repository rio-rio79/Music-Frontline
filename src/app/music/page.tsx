import MusicList from "../../components/MusicList";
import songs from "../../data/songs";

export default function MusicTop() {
    return (
        <section>
            <h1>楽曲一覧ページ</h1>
            <MusicList songs={songs} />
        </section>
    );
}
