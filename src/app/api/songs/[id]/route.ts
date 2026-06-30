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

        // グループ名とジュニア名を取得
        let songGroups: string[] = []
        let songJuniors: string[] = []
        
        if (song.song_juniors && song.song_juniors.length > 0) {
            const groups = song.song_juniors
                .map((sj) => sj.groups?.name)
                .filter(Boolean) as string[]
            songGroups = Array.from(new Set(groups))

            const juniors = song.song_juniors
                .map((sj) => sj.juniors?.name)
                .filter(Boolean) as string[]
            songJuniors = Array.from(new Set(juniors))
        }

        // アーティスト名の解決（後方互換性のため）
        const artistName = songGroups.length > 0 ? songGroups.join(', ') : (songJuniors.length > 0 ? songJuniors.join(', ') : 'アーティスト名')

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
            juniors: songJuniors,
            groups: songGroups,
        }

        return Response.json({ song: formattedSong })
    } catch (e: any) {
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}
