import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = await createSupabaseServer()

        // 楽曲データと関連するジュニア、グループの情報を取得
        const { data: songs, error } = await supabase
            .from('songs')
            .select(`
                id,
                title,
                audio_path,
                image_path,
                play_count,
                published_at,
                song_juniors (
                    junior_id,
                    juniors (
                        name
                    ),
                    group_id,
                    groups (
                        name
                    )
                )
            `)
            .order('published_at', { ascending: false })

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        // レスポンスの整形と Storage URL の解決
        const formattedSongs = songs.map((song) => {
            // アーティスト名の解決
            let artistName = 'アーティスト名'
            if (song.song_juniors && song.song_juniors.length > 0) {
                // グループ名があれば優先して取得
                const groups = song.song_juniors
                    .map((sj) => sj.groups?.name)
                    .filter(Boolean) as string[]
                
                if (groups.length > 0) {
                    artistName = Array.from(new Set(groups)).join(', ')
                } else {
                    // ジュニア名を取得
                    const juniors = song.song_juniors
                        .map((sj) => sj.juniors?.name)
                        .filter(Boolean) as string[]
                    if (juniors.length > 0) {
                        artistName = Array.from(new Set(juniors)).join(', ')
                    }
                }
            }

            // audio_path の解決
            let audioFilePath = song.audio_path || ''
            if (audioFilePath && !audioFilePath.startsWith('http') && !audioFilePath.startsWith('/')) {
                // Storage からの公開 URL 取得
                const { data } = supabase.storage.from('audio').getPublicUrl(audioFilePath)
                audioFilePath = data.publicUrl
            }

            // image_path の解決
            let imagePath = song.image_path || '/music_cover_img.png'
            if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
                const { data } = supabase.storage.from('images').getPublicUrl(imagePath)
                imagePath = data.publicUrl
            }

            return {
                id: song.id,
                title: song.title,
                audioFilePath,
                imagePath,
                artistName,
                playCount: song.play_count,
                publishedAt: song.published_at,
            }
        })

        return Response.json({ songs: formattedSongs })
    } catch (e: any) {
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}
