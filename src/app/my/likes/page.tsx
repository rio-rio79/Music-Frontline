import LikePageClient from "./LikePageClient";

type LikePageProps = {
    searchParams: Promise<{
        tab?: string | string[];
    }>;
};

type TabKey = "music" | "blog" | "idol";

function parseTab(value: string | string[] | undefined): TabKey {
    const tab = Array.isArray(value) ? value[0] : value;
    if (tab === "blog" || tab === "idol") return tab;
    return "music";
}

export default async function LikePage({ searchParams }: LikePageProps) {
    const query = await searchParams;

    return <LikePageClient initialTab={parseTab(query.tab)} />;
}
