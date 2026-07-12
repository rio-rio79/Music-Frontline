export function formatJuniorRegion(region: string | null | undefined) {
    if (region === "kanto") return "関東ジュニア";
    if (region === "kansai") return "関西ジュニア";
    return null;
}

export function formatJuniorAffiliation(
    groupName: string | null | undefined,
    region: string | null | undefined,
) {
    return groupName || formatJuniorRegion(region) || "無所属";
}
