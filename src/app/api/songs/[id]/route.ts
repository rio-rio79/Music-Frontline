import { createSupabaseServer } from '@/lib/supabase-server'

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params

        if (!id) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        const { data: song, error } = await supabase
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
            .eq('id', id)
            .single()

        if (error) {
            return Response.json({ error: error.message }, { status: 404 })
        }

        if (!song) {
            return Response.json({ error: '楽曲が見つかりません。' }, { status: 404 })
        }

        // アーティスト名の解決
        let artistName = 'アーティスト名'
        if (song.song_juniors && song.song_juniors.length > 0) {
            const groups = song.song_juniors
                .map((sj) => sj.groups?.name)
                .filter(Boolean) as string[]
            
            if (groups.length > 0) {
                artistName = Array.from(new Set(groups)).join(', ')
            } else {
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
            const { data } = supabase.storage.from('audio').getPublicUrl(audioFilePath)
            audioFilePath = data.publicUrl
        }

        // image_path の解決
        let imagePath = song.image_path || '/music_cover_img.png'
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
            const { data } = supabase.storage.from('images').getPublicUrl(imagePath)
            imagePath = data.publicUrl
        }

        const formattedSong = {
            id: song.id,
            title: song.title,
            audioFilePath,
            imagePath,
            artistName,
            playCount: song.play_count,
            publishedAt: song.published_at,
        }

        return Response.json({ song: formattedSong })
    } catch (e: any) {
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}
