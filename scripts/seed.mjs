import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// .env.local をパース
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error(".env.local が見つかりません。");
    process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.substring(1, value.length - 1);
        }
        env[match[1]] = value;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabaseの環境変数が設定されていません。");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 固定UUID定義
const GROUP_1_ID = "3f0b2f56-6a1e-4b48-8df0-94d0774a3f11"; // HiHi Jets
const GROUP_2_ID = "3f0b2f56-6a1e-4b48-8df0-94d0774a3f12"; // 美 少年

const JUNIOR_1_ID = "a1d822b1-6a2c-473d-862d-ea081fbb4f21"; // 高橋優斗
const JUNIOR_2_ID = "a1d822b1-6a2c-473d-862d-ea081fbb4f22"; // 井上瑞稀
const JUNIOR_3_ID = "a1d822b1-6a2c-473d-862d-ea081fbb4f23"; // 岩﨑大昇
const JUNIOR_4_ID = "a1d822b1-6a2c-473d-862d-ea081fbb4f24"; // 佐藤龍我

const SONG_1_ID = "d3b07384-d113-4956-a5cc-e5b1574a4f81";
const SONG_2_ID = "d3b07384-d113-4956-a5cc-e5b1574a4f82";
const SONG_3_ID = "d3b07384-d113-4956-a5cc-e5b1574a4f83";
const SONG_4_ID = "d3b07384-d113-4956-a5cc-e5b1574a4f84";
const SONG_5_ID = "d3b07384-d113-4956-a5cc-e5b1574a4f85";

const sampleGroups = [
    { id: GROUP_1_ID, name: "HiHi Jets", description: "HiHi Jets グループ" },
    { id: GROUP_2_ID, name: "美 少年", description: "美 少年 グループ" }
];

const sampleJuniors = [
    { id: JUNIOR_1_ID, name: "高橋優斗", group_id: GROUP_1_ID, catchphrase: "ゆうぴー" },
    { id: JUNIOR_2_ID, name: "井上瑞稀", group_id: GROUP_1_ID, catchphrase: "みじゅき" },
    { id: JUNIOR_3_ID, name: "岩﨑大昇", group_id: GROUP_2_ID, catchphrase: "たいしょう" },
    { id: JUNIOR_4_ID, name: "佐藤龍我", group_id: GROUP_2_ID, catchphrase: "りゅうが" }
];

const sampleSongs = [
    {
        id: SONG_1_ID,
        title: "Sample Song 1",
        audio_path: "/audio/sample-1.mp3",
        image_path: "/music_cover_img.png",
        play_count: 25000,
        published_at: "2024-05-20T00:00:00Z",
        lyricist: "1&Y",
        composer: "TETSU",
        lyrics: "Sample Song 1 の歌詞です。\n楽しいメロディに乗せて歌いましょう。\nサビの部分が盛り上がります！"
    },
    {
        id: SONG_2_ID,
        title: "Sample Song 2",
        audio_path: "/audio/sample-2.mp3",
        image_path: "/music_cover_img.png",
        play_count: 12000,
        published_at: "2024-06-01T00:00:00Z",
        lyricist: "作詞者A",
        composer: "作曲者A",
        lyrics: "Sample Song 2 の歌詞です。\n少ししっとりした曲調です。\n心に響く歌詞をお届けします。"
    },
    {
        id: SONG_3_ID,
        title: "Sample Song 3",
        audio_path: "/audio/sample-3.mp3",
        image_path: "/music_cover_img.png",
        play_count: 8500,
        published_at: "2024-06-10T00:00:00Z",
        lyricist: "作詞者B",
        composer: "作曲者B",
        lyrics: "Sample Song 3 の歌詞です。\nアップテンポで元気が出る曲です。\nみんなで一緒に盛り上がりましょう！"
    },
    {
        id: SONG_4_ID,
        title: "Sample Song 4",
        audio_path: "/audio/sample-4.mp3",
        image_path: "/music_cover_img.png",
        play_count: 3100,
        published_at: "2024-06-15T00:00:00Z",
        lyricist: "作詞者C",
        composer: "作曲者C",
        lyrics: "Sample Song 4 の歌詞です。\nバラード曲です。\n切ないメロディと言葉たち。"
    },
    {
        id: SONG_5_ID,
        title: "Sample Song 5",
        audio_path: "/audio/sample-5.mp3",
        image_path: "/music_cover_img.png",
        play_count: 9800,
        published_at: "2024-06-20T00:00:00Z",
        lyricist: "作詞者D",
        composer: "作曲者D",
        lyrics: "Sample Song 5 の歌詞です。\nコラボ楽曲の特別な歌詞をお楽しみください。"
    }
];

// 中間テーブル
const sampleSongJuniors = [
    // Song 1 -> HiHi Jets / 高橋優斗
    { id: "e1d822b1-6a2c-473d-862d-ea081fbb4f01", song_id: SONG_1_ID, junior_id: JUNIOR_1_ID, group_id: GROUP_1_ID },
    // Song 2 -> HiHi Jets / 井上瑞稀
    { id: "e1d822b1-6a2c-473d-862d-ea081fbb4f02", song_id: SONG_2_ID, junior_id: JUNIOR_2_ID, group_id: GROUP_1_ID },
    // Song 3 -> 美 少年 / 岩﨑大昇
    { id: "e1d822b1-6a2c-473d-862d-ea081fbb4f03", song_id: SONG_3_ID, junior_id: JUNIOR_3_ID, group_id: GROUP_2_ID },
    // Song 4 -> 美 少年 / 佐藤龍我
    { id: "e1d822b1-6a2c-473d-862d-ea081fbb4f04", song_id: SONG_4_ID, junior_id: JUNIOR_4_ID, group_id: GROUP_2_ID },
    // Song 5 -> コラボ (高橋優斗 & 岩﨑大昇)
    { id: "e1d822b1-6a2c-473d-862d-ea081fbb4f05", song_id: SONG_5_ID, junior_id: JUNIOR_1_ID, group_id: GROUP_1_ID },
    { id: "e1d822b1-6a2c-473d-862d-ea081fbb4f06", song_id: SONG_5_ID, junior_id: JUNIOR_3_ID, group_id: GROUP_2_ID }
];

async function seed() {
    console.log("シードスクリプトを開始します...");

    // 1. groups
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .upsert(sampleGroups, { onConflict: 'id' })
        .select();
    if (groupsError) console.error("groups エラー:", groupsError);
    else console.log(`groups テーブルに ${groups.length} 件を登録しました。`);

    // 2. juniors
    const { data: juniors, error: juniorsError } = await supabase
        .from('juniors')
        .upsert(sampleJuniors, { onConflict: 'id' })
        .select();
    if (juniorsError) console.error("juniors エラー:", juniorsError);
    else console.log(`juniors テーブルに ${juniors.length} 件を登録しました。`);

    // 3. songs
    const { data: songs, error: songsError } = await supabase
        .from('songs')
        .upsert(sampleSongs, { onConflict: 'id' })
        .select();
    if (songsError) console.error("songs エラー:", songsError);
    else console.log(`songs テーブルに ${songs.length} 件を登録しました。`);

    // 4. song_juniors
    const { data: songJuniors, error: songJuniorsError } = await supabase
        .from('song_juniors')
        .upsert(sampleSongJuniors, { onConflict: 'id' })
        .select();
    if (songJuniorsError) console.error("song_juniors エラー:", songJuniorsError);
    else console.log(`song_juniors テーブルに ${songJuniors.length} 件を登録しました。`);

    console.log("シード挿入完了。");
}

seed();
