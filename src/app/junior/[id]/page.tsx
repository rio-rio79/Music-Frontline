import juniors from "../../../data/juniors";

type JuniorDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function JuniorDetailPage({
    params,
}: JuniorDetailPageProps) {
    const { id } = await params;

    const junior = juniors.find((junior) => junior.id === Number(id));

    return (
        <section>
            <h1>ジュニア詳細ページ</h1>
            <h2>{junior?.name}</h2>
        </section>
    );
}
