import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , outputArg, ...inputArgs] = process.argv;

if (!outputArg || inputArgs.length === 0) {
    throw new Error(
        "Usage: node scripts/generate-blog-seed.mjs <output.sql> <blog-json>...",
    );
}

const root = process.cwd();
const outputPath = resolve(root, outputArg);
const juniorSeedPath = resolve(root, "supabase/seeds/002_juniors.sql");
const namespace = "843c62a3-d46f-5ad4-a8d0-9f6bc83aa501";

const titleOverrides = new Map([
    ["120:水を飲んでから", "水を飲んでひと息"],
    ["130:少し曇った空", "曇り空の朝"],
    ["134:汗を拭きながら", "タオルで汗を拭いて"],
    ["150:ゆっくり始める", "自分のペースで始める"],
]);

const targetMonthCounts = new Map([
    [1, 70],
    [2, 65],
    [3, 55],
    [4, 70],
    [5, 65],
    [6, 80],
    [7, 60],
]);

const seasonalTermsByMonth = new Map([
    [1, ["新年", "年明け", "冬", "寒", "白い息", "マフラー", "あたたか", "温か"]],
    [2, ["冬", "寒", "白い息", "マフラー", "あたたか", "温か"]],
    [4, ["春", "桜", "花見"]],
    [6, ["夏", "暑", "梅雨", "雨", "水分", "氷", "冷たい", "半袖"]],
    [7, ["夏", "暑", "水分", "氷", "冷たい", "半袖", "七夕"]],
]);

function uuidToBytes(uuid) {
    return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

function uuidV5(name, namespaceUuid) {
    const hash = createHash("sha1")
        .update(Buffer.concat([uuidToBytes(namespaceUuid), Buffer.from(name)]))
        .digest()
        .subarray(0, 16);

    hash[6] = (hash[6] & 0x0f) | 0x50;
    hash[8] = (hash[8] & 0x3f) | 0x80;

    const hex = hash.toString("hex");
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join("-");
}

function stableNumber(value) {
    return createHash("sha256").update(value).digest().readUInt32BE(0);
}

function parseTimestamp(value) {
    const match = value.match(
        /^(2026)-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+09:00$/,
    );
    if (!match) throw new Error(`Invalid published_at: ${value}`);

    const [, year, month, day, hour, minute, second] = match;
    const timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`);
    const min = new Date("2026-01-01T00:00:00+09:00");
    const max = new Date("2026-07-10T23:59:59+09:00");
    if (timestamp < min || timestamp > max) {
        throw new Error(`Out-of-range published_at: ${value}`);
    }

    return { timestamp, month: Number(month) };
}

function isSeasonLocked(post) {
    const terms = seasonalTermsByMonth.get(post.month) ?? [];
    const text = `${post.theme} ${post.title} ${post.body}`;
    return terms.some((term) => text.includes(term));
}

function getMonthCounts(posts) {
    const counts = new Map([...targetMonthCounts.keys()].map((month) => [month, 0]));
    for (const post of posts) counts.set(post.month, counts.get(post.month) + 1);
    return counts;
}

function formatJst(timestamp) {
    const jst = new Date(timestamp.getTime() + 9 * 60 * 60 * 1000);
    const date = [
        jst.getUTCFullYear(),
        String(jst.getUTCMonth() + 1).padStart(2, "0"),
        String(jst.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const time = [
        String(jst.getUTCHours()).padStart(2, "0"),
        String(jst.getUTCMinutes()).padStart(2, "0"),
        String(jst.getUTCSeconds()).padStart(2, "0"),
    ].join(":");
    return `${date}T${time}+09:00`;
}

function ensureUniqueTimestamps(posts) {
    const occupied = new Set();
    let adjusted = 0;

    for (const post of posts) {
        while (occupied.has(post.publishedAt)) {
            const { timestamp } = parseTimestamp(post.publishedAt);
            post.publishedAt = formatJst(
                new Date(timestamp.getTime() + 5 * 60 * 1000),
            );
            adjusted += 1;
        }
        occupied.add(post.publishedAt);
    }

    return adjusted;
}

function chooseNewTimestamp(post, targetMonth, occupied) {
    const maxDay = new Date(2026, targetMonth, 0).getDate();
    const seed = stableNumber(`${post.slot}:${post.postIndex}:${targetMonth}`);
    let day = 1 + (seed % maxDay);
    let hour = 7 + ((seed >>> 5) % 16);
    let minute = ((seed >>> 10) % 12) * 5;

    for (let attempt = 0; attempt < maxDay * 16 * 12; attempt += 1) {
        const value = `2026-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+09:00`;
        if (!occupied.has(value)) return value;

        minute += 5;
        if (minute >= 60) {
            minute = 0;
            hour += 1;
        }
        if (hour >= 23) {
            hour = 7;
            day = day === maxDay ? 1 : day + 1;
        }
    }

    throw new Error(`Could not allocate timestamp for slot ${post.slot}`);
}

function redistributeDates(posts) {
    const counts = getMonthCounts(posts);
    const occupied = new Set(posts.map((post) => post.publishedAt));
    const sourceExcess = new Map(
        [...counts].map(([month, count]) => [
            month,
            Math.max(0, count - targetMonthCounts.get(month)),
        ]),
    );
    const deficits = [...counts]
        .map(([month, count]) => ({
            month,
            count: Math.max(0, targetMonthCounts.get(month) - count),
        }))
        .filter(({ count }) => count > 0);

    const candidates = posts
        .filter((post) => sourceExcess.get(post.month) > 0 && !isSeasonLocked(post))
        .sort(
            (a, b) =>
                stableNumber(`${a.slot}:${a.postIndex}`) -
                stableNumber(`${b.slot}:${b.postIndex}`),
        );

    let moved = 0;
    for (const deficit of deficits) {
        while (deficit.count > 0) {
            const candidateIndex = candidates.findIndex((post) => {
                if (sourceExcess.get(post.month) <= 0) return false;
                return !posts.some(
                    (other) => other.slot === post.slot && other.month === deficit.month,
                );
            });

            if (candidateIndex === -1) {
                throw new Error(`Not enough movable posts for month ${deficit.month}`);
            }

            const [post] = candidates.splice(candidateIndex, 1);
            occupied.delete(post.publishedAt);
            post.publishedAt = chooseNewTimestamp(post, deficit.month, occupied);
            occupied.add(post.publishedAt);
            sourceExcess.set(post.month, sourceExcess.get(post.month) - 1);
            post.month = deficit.month;
            deficit.count -= 1;
            moved += 1;
        }
    }

    const finalCounts = getMonthCounts(posts);
    for (const [month, target] of targetMonthCounts) {
        if (finalCounts.get(month) !== target) {
            throw new Error(
                `Month ${month} has ${finalCounts.get(month)} posts; expected ${target}`,
            );
        }
    }

    return { moved, finalCounts };
}

function dollarQuote(value, tag) {
    const marker = `$${tag}$`;
    if (value.includes(marker)) throw new Error(`Value contains SQL marker ${marker}`);
    return `${marker}${value}${marker}`;
}

const rawJuniorSeed = readFileSync(juniorSeedPath, "utf8");
const juniorMatches = [...rawJuniorSeed.matchAll(
    /\(\s*'(?<id>[0-9a-f-]{36})',\s*'(?<name>[^']+)'/g,
)];
const juniors = juniorMatches.map(({ groups }) => ({ id: groups.id, name: groups.name }));
if (juniors.length !== 155) {
    throw new Error(`Expected 155 juniors, found ${juniors.length}`);
}

const blocks = inputArgs.flatMap((path) =>
    JSON.parse(readFileSync(resolve(path), "utf8")),
);
const slots = new Map();

for (const block of blocks) {
    if (!Number.isInteger(block.author_slot)) {
        throw new Error("author_slot must be an integer");
    }
    if (slots.has(block.author_slot)) {
        throw new Error(`Duplicate author_slot: ${block.author_slot}`);
    }
    if (!Array.isArray(block.posts) || block.posts.length !== 3) {
        throw new Error(`Slot ${block.author_slot} must contain exactly 3 posts`);
    }
    slots.set(block.author_slot, block.posts);
}

const missingSlots = Array.from({ length: 155 }, (_, index) => index + 1).filter(
    (slot) => !slots.has(slot),
);
if (missingSlots.length > 0 || slots.size !== 155) {
    throw new Error(`Invalid slots. Missing: ${missingSlots.join(", ")}`);
}

const posts = [];
for (let slot = 1; slot <= 155; slot += 1) {
    const junior = juniors[slot - 1];
    slots.get(slot).forEach((post, postIndex) => {
        for (const field of ["theme", "title", "body", "published_at"]) {
            if (typeof post[field] !== "string" || post[field].trim() === "") {
                throw new Error(`Slot ${slot} post ${postIndex + 1} is missing ${field}`);
            }
        }

        const { month } = parseTimestamp(post.published_at);
        posts.push({
            id: uuidV5(`blog-post:${slot}:${postIndex + 1}`, namespace),
            slot,
            postIndex: postIndex + 1,
            juniorId: junior.id,
            juniorName: junior.name,
            theme: post.theme,
            title: titleOverrides.get(`${slot}:${post.title}`) ?? post.title,
            body: post.body,
            publishedAt: post.published_at,
            month,
        });
    });
}

const uniqueTitles = new Set(posts.map((post) => post.title));
const uniqueBodies = new Set(posts.map((post) => post.body));
if (uniqueTitles.size !== posts.length || uniqueBodies.size !== posts.length) {
    const duplicateTitles = posts
        .filter((post, index) =>
            posts.findIndex((candidate) => candidate.title === post.title) !== index,
        )
        .map((post) => `title slot ${post.slot}: ${post.title}`);
    const duplicateBodies = posts
        .filter((post, index) =>
            posts.findIndex((candidate) => candidate.body === post.body) !== index,
        )
        .map((post) => `body slot ${post.slot}: ${post.title}`);
    throw new Error(
        `Duplicate content found:\n${[...duplicateTitles, ...duplicateBodies].join("\n")}`,
    );
}

const adjustedDuplicateTimestamps = ensureUniqueTimestamps(posts);
const originalCounts = getMonthCounts(posts);
const { moved, finalCounts } = redistributeDates(posts);

for (const post of posts) parseTimestamp(post.publishedAt);
if (new Set(posts.map((post) => post.publishedAt)).size !== posts.length) {
    throw new Error("Duplicate published_at found after redistribution");
}
for (let slot = 1; slot <= 155; slot += 1) {
    const slotDates = posts
        .filter((post) => post.slot === slot)
        .map((post) => post.publishedAt.slice(0, 10));
    if (new Set(slotDates).size !== 3) {
        throw new Error(`Slot ${slot} has duplicate publication dates`);
    }
}

const rows = posts.map((post) => `    (
        '${post.id}',
        '${post.juniorId}',
        ${dollarQuote(post.title, "blog_title")},
        ${dollarQuote(post.body, "blog_body")},
        '${post.publishedAt}'::timestamptz,
        0
    )`);

const sql = `-- AIで生成したブログ投稿用デモデータ。
-- author_slot 1〜155を002_juniors.sqlの登録順へ対応させ、1人3件ずつ登録する。
-- IDはスロット番号と投稿番号から決定的に生成しているため、再実行しても重複しない。
-- themeは生成内容の重複確認専用であり、blog_postsには保存しない。

BEGIN;

INSERT INTO public.blog_posts (
    id,
    junior_id,
    title,
    body,
    published_at,
    view_count
)
VALUES
${rows.join(",\n")}
ON CONFLICT (id)
DO UPDATE SET
    junior_id = EXCLUDED.junior_id,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    published_at = EXCLUDED.published_at,
    updated_at = now();

COMMIT;
`;

writeFileSync(outputPath, sql, "utf8");

const formatCounts = (counts) =>
    [...counts].map(([month, count]) => `${month}:${count}`).join(", ");

console.log(`Generated ${posts.length} posts for ${juniors.length} juniors.`);
console.log(`Adjusted ${adjustedDuplicateTimestamps} duplicate timestamps.`);
console.log(`Moved ${moved} non-seasonal posts to rebalance publication months.`);
console.log(`Before: ${formatCounts(originalCounts)}`);
console.log(`After:  ${formatCounts(finalCounts)}`);
