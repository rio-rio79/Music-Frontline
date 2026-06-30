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

const sampleSongs = [
    {
        id: "d3b07384-d113-4956-a5cc-e5b1574a4f81",
        title: "Sample Song 1",
        audio_path: "/audio/sample-1.mp3",
        image_path: "/music_cover_img.png",
        play_count: 25000,
        published_at: "2024-05-20T00:00:00Z"
    },
    {
        id: "d3b07384-d113-4956-a5cc-e5b1574a4f82",
        title: "Sample Song 2",
        audio_path: "/audio/sample-2.mp3",
        image_path: "/music_cover_img.png",
        play_count: 12000,
        published_at: "2024-06-01T00:00:00Z"
    },
    {
        id: "d3b07384-d113-4956-a5cc-e5b1574a4f83",
        title: "Sample Song 3",
        audio_path: "/audio/sample-3.mp3",
        image_path: "/music_cover_img.png",
        play_count: 8500,
        published_at: "2024-06-10T00:00:00Z"
    },
    {
        id: "d3b07384-d113-4956-a5cc-e5b1574a4f84",
        title: "Sample Song 4",
        audio_path: "/audio/sample-4.mp3",
        image_path: "/music_cover_img.png",
        play_count: 3100,
        published_at: "2024-06-15T00:00:00Z"
    },
    {
        id: "d3b07384-d113-4956-a5cc-e5b1574a4f85",
        title: "Sample Song 5",
        audio_path: "/audio/sample-5.mp3",
        image_path: "/music_cover_img.png",
        play_count: 9800,
        published_at: "2024-06-20T00:00:00Z"
    }
];

async function seed() {
    console.log("シードスクリプトを開始します...");

    // `songs` テーブルへの Upsert
    const { data, error } = await supabase
        .from('songs')
        .upsert(sampleSongs, { onConflict: 'id' })
        .select();

    if (error) {
        console.error("songs テーブルへのシード挿入エラー:", error);
    } else {
        console.log(`songs テーブルに ${data.length} 件のレコードを upsert しました。`);
        console.log(data);
    }
}

seed();
