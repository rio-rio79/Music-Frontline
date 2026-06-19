import songs from "../../../data/songs";

type MusicDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function MusicDetailPage({
    params,
}: MusicDetailPageProps) {
    const { id } = await params;

    const song = songs.find((song) => song.id === Number(id));

    return (
        <section>
            <h1>楽曲詳細ページ</h1>
            <h2>{song?.title}</h2>
        </section>
    );
}
