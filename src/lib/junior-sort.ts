export type JuniorListSortKey = "fifty" | "joinDate" | "age";

type SortableJunior = {
    name: string;
    nameKana?: string | null;
    joinDate?: string | null;
    birthDate?: string | null;
};

const japaneseNameCollator = new Intl.Collator("ja", {
    numeric: true,
    sensitivity: "base",
});

function compareJapaneseName(a: string, b: string) {
    return japaneseNameCollator.compare(a, b);
}

function compareNullableDateAsc(a: string | null | undefined, b: string | null | undefined) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a).getTime() - new Date(b).getTime();
}

export function compareJuniorListItems(
    a: SortableJunior,
    b: SortableJunior,
    sort: string,
) {
    if (sort === "joinDate") {
        return compareNullableDateAsc(a.joinDate, b.joinDate)
            || compareJapaneseName(a.name, b.name);
    }

    if (sort === "age") {
        return compareNullableDateAsc(a.birthDate, b.birthDate)
            || compareJapaneseName(a.name, b.name);
    }

    return compareJapaneseName(a.nameKana || a.name, b.nameKana || b.name)
        || compareJapaneseName(a.name, b.name);
}

export function compareGroupName(a: { name: string }, b: { name: string }) {
    return compareJapaneseName(a.name, b.name);
}
