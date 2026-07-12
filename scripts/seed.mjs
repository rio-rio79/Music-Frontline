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
const GROUP_ACEES_ID = "8eaf6f2d-c09e-4a83-a55e-8f9a6bf0dc01";
const GROUP_KEY_TO_LIT_ID = "117a12e8-7e76-46f4-93ac-fcd68130dc02";
const GROUP_BZAI_ID = "68ac9c77-a673-45ba-9091-cef7e1c0dc03";
const GROUP_AMBITIOUS_ID = "99f30cd4-c9fc-445f-9567-b35875e0dc04";
const GROUP_BOYS_BE_ID = "c15fa4b5-a109-424c-8810-552f9270dc05";

const SONG_1_ID = "a0b1c2d3-0001-4000-8000-000000000001";
const SONG_2_ID = "a0b1c2d3-0002-4000-8000-000000000002";
const SONG_3_ID = "a0b1c2d3-0003-4000-8000-000000000003";
const SONG_4_ID = "a0b1c2d3-0004-4000-8000-000000000004";
const SONG_5_ID = "a0b1c2d3-0005-4000-8000-000000000005";

const sampleGroups = [
    { id: GROUP_ACEES_ID, name: "ACEes", description: null, image_path: "ACEes.jpg" },
    { id: GROUP_KEY_TO_LIT_ID, name: "KEY TO LIT", description: null, image_path: "KEY TO LIT.jpg" },
    { id: GROUP_BZAI_ID, name: "B&ZAI", description: null, image_path: "B&ZAI.jpg" },
    { id: GROUP_AMBITIOUS_ID, name: "AmBitious", description: null, image_path: "AmBitious.jpg" },
    { id: GROUP_BOYS_BE_ID, name: "Boys be", description: null, image_path: "Boys be.jpg" }
];

const sampleJuniors = [
    { id: "f5255b7a-84c9-59bb-9026-e420e61c3169", name: "浮所飛貴", group_id: GROUP_ACEES_ID, catchphrase: null },
    { id: "73f0f4d8-3dab-5dd7-9c5c-570145faabe6", name: "那須雄登", group_id: GROUP_ACEES_ID, catchphrase: null },
    { id: "c4738b44-8a19-5b3e-8660-1660c18cec84", name: "作間龍斗", group_id: GROUP_ACEES_ID, catchphrase: null },
    { id: "b80a809f-a880-5b1d-a7da-e61f1a6204b1", name: "深田竜生", group_id: GROUP_ACEES_ID, catchphrase: null },
    { id: "1a1e082c-5bbf-542a-beda-fd03ca26f8cd", name: "佐藤龍我", group_id: GROUP_ACEES_ID, catchphrase: null },
    { id: "351de116-68b8-5eeb-95c2-7f1182b4689f", name: "岩﨑大昇", group_id: GROUP_KEY_TO_LIT_ID, catchphrase: null },
    { id: "0d3656d2-972c-57ab-95fe-f1d3ae134c34", name: "井上瑞稀", group_id: GROUP_KEY_TO_LIT_ID, catchphrase: null },
    { id: "a775b19e-6359-50cb-96b2-f5be32e12bd4", name: "中村嶺亜", group_id: GROUP_KEY_TO_LIT_ID, catchphrase: null },
    { id: "d65da435-a91a-5002-b935-7a992ccb55b7", name: "猪狩蒼弥", group_id: GROUP_KEY_TO_LIT_ID, catchphrase: null },
    { id: "f5699aea-9b50-5ef5-a74d-f808e16a040b", name: "佐々木大光", group_id: GROUP_KEY_TO_LIT_ID, catchphrase: null },
    { id: "b28df31d-1829-5f4c-a6a0-d0b5a5097c01", name: "橋本涼", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "00466df1-8c5b-5886-b2ee-8cd991a592fb", name: "矢花黎", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "afb17391-c86f-5a99-80a4-6a32aa455254", name: "今野大輝", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "53cb1e30-1a90-53c4-b80d-b1b038ecd6c2", name: "菅田琳寧", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "2d9e1058-2833-5439-bf7d-8620a84c0f10", name: "本高克樹", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "33eabca5-e5b2-568b-9f2a-4039264de012", name: "鈴木悠仁", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "2409ece2-5d2f-507f-9994-d3938c0f8802", name: "川﨑星輝", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "062a5b44-4db3-5e64-a65f-2ad5df7640f2", name: "稲葉通陽", group_id: GROUP_BZAI_ID, catchphrase: null },
    { id: "c6956239-b069-58fd-bed0-86e6a956156f", name: "真弓孟之", group_id: GROUP_AMBITIOUS_ID, catchphrase: null },
    { id: "3b8a1540-bbfa-5e09-9449-5de495e40be8", name: "岡佑吏", group_id: GROUP_AMBITIOUS_ID, catchphrase: null },
    { id: "676ac5c0-7b4d-516b-ab21-ae69f0badbbf", name: "永岡蓮王", group_id: GROUP_AMBITIOUS_ID, catchphrase: null },
    { id: "f4dbca99-d831-5598-9a58-b82743a598d7", name: "井上一太", group_id: GROUP_AMBITIOUS_ID, catchphrase: null },
    { id: "a988db67-1d5c-549d-9207-e1bca7211fca", name: "浦陸斗", group_id: GROUP_AMBITIOUS_ID, catchphrase: null },
    { id: "b5c02f40-b780-5d0d-b0b2-9bc1b21cd641", name: "大内リオン", group_id: GROUP_AMBITIOUS_ID, catchphrase: null },
    { id: "6f1871d1-c802-5a71-b836-482d1c9d373a", name: "池川侑希弥", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "299a01ff-0946-530e-a946-ff267272c06c", name: "伊藤篤志", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "6df956b8-c3de-529f-b22c-1b4db8e7419e", name: "岩倉司", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "0901fc4a-56c1-5cb0-a450-2022c066736e", name: "上垣廣祐", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "ac3a0f03-a295-5135-b5ec-f41d657a597b", name: "亀井海聖", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "5bb06702-70a6-5580-8858-f3734f6e8c38", name: "北村仁太郎", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "17e190dc-6f6c-5627-8bd5-3616da72ff4d", name: "嵜本孝太朗", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "b341b36b-0fd2-5e42-8cef-febd2874c0cb", name: "丸岡晃聖", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "844db39d-1283-5b5a-a5f3-074b38d9614c", name: "千田藍生", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "1aa2dcf0-02ae-5d88-8e19-1df9e07589bf", name: "山中一輝", group_id: GROUP_BOYS_BE_ID, catchphrase: null },
    { id: "bb95b66a-754f-5ea6-b456-e2e0fa4be3c8", name: "角紳太郎", group_id: GROUP_BOYS_BE_ID, catchphrase: null }
];

const sampleSongs = [
    {
        id: SONG_1_ID,
        title: "Brave Signal",
        audio_path: "/audio/sample-1.mp3",
        image_path: null,
        play_count: 25000,
        published_at: "2024-05-20T00:00:00Z",
        lyricist: "1&Y",
        composer: "TETSU",
        lyrics: "Brave Signal の歌詞です。\nまっすぐな勢いでステージへ駆け出すデモ楽曲です。"
    },
    {
        id: SONG_2_ID,
        title: "Ignite Key",
        audio_path: "/audio/sample-2.mp3",
        image_path: null,
        play_count: 12000,
        published_at: "2024-06-01T00:00:00Z",
        lyricist: "作詞者A",
        composer: "作曲者A",
        lyrics: "Ignite Key の歌詞です。\n未来を開く鍵をテーマにしたデモ楽曲です。"
    },
    {
        id: SONG_3_ID,
        title: "Blue Zeal Beat",
        audio_path: "/audio/sample-3.mp3",
        image_path: null,
        play_count: 8500,
        published_at: "2024-06-10T00:00:00Z",
        lyricist: "作詞者B",
        composer: "作曲者B",
        lyrics: "Blue Zeal Beat の歌詞です。\n熱量と疾走感を前面に出したデモ楽曲です。"
    },
    {
        id: SONG_4_ID,
        title: "Ambitious Road",
        audio_path: "/audio/sample-4.mp3",
        image_path: null,
        play_count: 3100,
        published_at: "2024-06-15T00:00:00Z",
        lyricist: "作詞者C",
        composer: "作曲者C",
        lyrics: "Ambitious Road の歌詞です。\n夢へ向かう足取りを描いたデモ楽曲です。"
    },
    {
        id: SONG_5_ID,
        title: "Blooming Canvas",
        audio_path: "/audio/sample-5.mp3",
        image_path: null,
        play_count: 9800,
        published_at: "2024-06-20T00:00:00Z",
        lyricist: "作詞者D",
        composer: "作曲者D",
        lyrics: "Blooming Canvas の歌詞です。\n成長途中の輝きを描いたデモ楽曲です。"
    }
];

const groupSongLinks = [
    { songId: SONG_1_ID, groupId: GROUP_ACEES_ID, juniorIds: sampleJuniors.filter((junior) => junior.group_id === GROUP_ACEES_ID).map((junior) => junior.id) },
    { songId: SONG_2_ID, groupId: GROUP_KEY_TO_LIT_ID, juniorIds: sampleJuniors.filter((junior) => junior.group_id === GROUP_KEY_TO_LIT_ID).map((junior) => junior.id) },
    { songId: SONG_3_ID, groupId: GROUP_BZAI_ID, juniorIds: sampleJuniors.filter((junior) => junior.group_id === GROUP_BZAI_ID).map((junior) => junior.id) },
    { songId: SONG_4_ID, groupId: GROUP_AMBITIOUS_ID, juniorIds: sampleJuniors.filter((junior) => junior.group_id === GROUP_AMBITIOUS_ID).map((junior) => junior.id) },
    { songId: SONG_5_ID, groupId: GROUP_BOYS_BE_ID, juniorIds: sampleJuniors.filter((junior) => junior.group_id === GROUP_BOYS_BE_ID).map((junior) => junior.id) }
];

// 中間テーブル
const sampleSongJuniors = groupSongLinks.flatMap((song, songIndex) =>
    song.juniorIds.map((juniorId, juniorIndex) => ({
        id: `e1d822b1-6a2c-473d-862d-ea081fbb4f${String(songIndex * 20 + juniorIndex + 1).padStart(2, '0')}`,
        song_id: song.songId,
        junior_id: juniorId,
        group_id: song.groupId
    }))
);

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
    const { error: songJuniorsDeleteError } = await supabase
        .from('song_juniors')
        .delete()
        .in('song_id', sampleSongs.map((song) => song.id));
    if (songJuniorsDeleteError) console.error("song_juniors 削除エラー:", songJuniorsDeleteError);

    const { data: songJuniors, error: songJuniorsError } = await supabase
        .from('song_juniors')
        .upsert(sampleSongJuniors, { onConflict: 'id' })
        .select();
    if (songJuniorsError) console.error("song_juniors エラー:", songJuniorsError);
    else console.log(`song_juniors テーブルに ${songJuniors.length} 件を登録しました。`);

    console.log("シード挿入完了。");
}

seed();
