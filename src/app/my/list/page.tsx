import MyListClient from "./MyListClient";

type MyListPageProps = {
    searchParams: Promise<{
        section?: string | string[];
        like?: string | string[];
    }>;
};

type SectionKey = "follows" | "likes";
type LikeTabKey = "music" | "blog";

function parseSection(value: string | string[] | undefined): SectionKey {
    const section = Array.isArray(value) ? value[0] : value;
    return section === "likes" ? "likes" : "follows";
}

function parseLikeTab(value: string | string[] | undefined): LikeTabKey {
    const tab = Array.isArray(value) ? value[0] : value;
    return tab === "blog" ? "blog" : "music";
}

export default async function MyListPage({ searchParams }: MyListPageProps) {
    const query = await searchParams;

    return (
        <MyListClient
            initialSection={parseSection(query.section)}
            initialLikeTab={parseLikeTab(query.like)}
        />
    );
}
