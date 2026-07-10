import { createSupabaseServer } from '@/lib/supabase-server'

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Server error'
}

export async function GET() {
    try {
        const supabase = await createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return Response.json(
                { error: '認証されていません。' },
                { status: 401 }
            )
        }

        // song_likes テーブルからデータを取得し、楽曲データを結合
        const { data: likes, error: likesError } = await supabase
            .from('song_likes')
            .select(`
                id,
                song_id,
                songs (
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
                )
            `)
            .eq('user_id', user.id)

        if (likesError) {
            return Response.json({ error: likesError.message }, { status: 500 })
        }

        // 取得したデータをフロントエンド用の形式に整形
        const formattedSongs = (likes || []).map((like) => {
            const song = like.songs
            if (!song) return null

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

            const artistName = songGroups.length > 0 ? songGroups.join(', ') : (songJuniors.length > 0 ? songJuniors.join(', ') : 'アーティスト名')

            let audioFilePath = song.audio_path || ''
            if (audioFilePath && !audioFilePath.startsWith('http') && !audioFilePath.startsWith('/')) {
                const { data } = supabase.storage.from('audio').getPublicUrl(audioFilePath)
                audioFilePath = data.publicUrl
            }

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
                juniors: songJuniors,
                groups: songGroups,
            }
        }).filter(Boolean)

        return Response.json({ songs: formattedSongs })
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return Response.json(
                { error: '認証されていません。' },
                { status: 401 }
            )
        }

        const { songId } = await request.json()
        if (!songId) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('toggle_song_like_with_points', {
            p_song_id: songId
        })

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        const result = data as { liked: boolean }
        return Response.json({ liked: result.liked })
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
