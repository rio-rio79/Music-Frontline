import { createSupabaseServer } from '@/lib/supabase-server'
import { resolveMusicCoverUrl } from '@/lib/music-assets'
import { formatJuniorAffiliation } from '@/lib/junior-affiliation'

type RouteContext = {
    params: Promise<{ juniorId: string }>
}

type SongRow = {
    id: string
    title: string
    audio_path: string | null
    image_path: string | null
    play_count: number | null
    published_at: string | null
    lyricist: string | null
    composer: string | null
    lyrics: string | null
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Server error'
}

export async function GET(request: Request, context: RouteContext) {
    try {
        const { juniorId } = await context.params

        if (!juniorId) {
            return Response.json({ error: 'ジュニアIDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()
        const getMusicCoverUrl = (path: string) =>
            supabase.storage.from('images').getPublicUrl(path).data.publicUrl

        // 1. ジュニア情報の取得
        const { data: junior, error: juniorError } = await supabase
            .from('juniors')
            .select(`
                id,
                name,
                name_en,
                profile,
                birth_date,
                join_date,
                birthplace,
                height,
                region,
                catchphrase,
                image_path,
                group_id,
                groups (
                    name
                )
            `)
            .eq('id', juniorId)
            .single()

        if (juniorError || !junior) {
            return Response.json({ error: 'ジュニアが見つかりません。' }, { status: 404 })
        }

        // ジュニア画像URLの解決
        const juniorImageUrl = junior.image_path
            ? supabase.storage.from('images').getPublicUrl(junior.image_path).data.publicUrl
            : null;

        // 2. ジュニアに関連する楽曲情報の取得
        const { data: songJuniors, error: songsError } = await supabase
            .from('song_juniors')
            .select(`
                song_id,
                songs (
                    id,
                    title,
                    audio_path,
                    image_path,
                    play_count,
                    published_at,
                    lyricist,
                    composer,
                    lyrics
                )
            `)
            .eq('junior_id', juniorId)

        if (songsError) {
            return Response.json({ error: songsError.message }, { status: 500 })
        }

        const rawSongs = (songJuniors || [])
            .map((sj) => sj.songs)
            .filter(Boolean) as SongRow[]

        // 楽曲ごとの詳細項目（いいね、アーティスト名、URL解決）を並列処理
        const songs = await Promise.all(
            rawSongs.map(async (song) => {
                // audio_path の解決
                let audioFilePath = song.audio_path || ''
                if (audioFilePath && !audioFilePath.startsWith('http') && !audioFilePath.startsWith('/')) {
                    const { data } = supabase.storage.from('audio').getPublicUrl(audioFilePath)
                    audioFilePath = data.publicUrl
                }

                // image_path の解決
                const imagePath = resolveMusicCoverUrl(song.image_path, getMusicCoverUrl)

                // 総いいね数の取得
                const { count: likesCount } = await supabase
                    .from('song_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('song_id', song.id)

                // ログインユーザーのいいね状態の取得
                let isLiked = false
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: existingLike } = await supabase
                        .from('song_likes')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('song_id', song.id)
                        .maybeSingle()
                    if (existingLike) {
                        isLiked = true
                    }
                }

                // アーティスト名の解決（同じ曲に関わる他のジュニアやグループのリスト）
                const { data: sjList } = await supabase
                    .from('song_juniors')
                    .select(`
                        juniors ( name ),
                        groups ( name )
                    `)
                    .eq('song_id', song.id)

                let songGroups: string[] = []
                let songJuniorsList: string[] = []
                if (sjList) {
                    songGroups = Array.from(new Set(sjList.map((sj) => sj.groups?.name).filter(Boolean))) as string[]
                    songJuniorsList = Array.from(new Set(sjList.map((sj) => sj.juniors?.name).filter(Boolean))) as string[]
                }
                const artistName = songGroups.length > 0 ? songGroups.join(', ') : (songJuniorsList.length > 0 ? songJuniorsList.join(', ') : 'アーティスト名')

                return {
                    id: song.id,
                    title: song.title,
                    audioFilePath,
                    imagePath,
                    artistName,
                    playCount: song.play_count,
                    publishedAt: song.published_at,
                    juniors: songJuniorsList,
                    groups: songGroups,
                    lyricist: song.lyricist,
                    composer: song.composer,
                    lyrics: song.lyrics,
                    likesCount: likesCount || 0,
                    isLiked,
                }
            })
        )

        const groupName = (junior.groups as { name: string | null } | null)?.name ?? null
        const formattedJunior = {
            id: junior.id,
            name: junior.name,
            nameEn: junior.name_en,
            profile: junior.profile,
            birthDate: junior.birth_date,
            joinDate: junior.join_date,
            birthplace: junior.birthplace,
            height: junior.height,
            region: junior.region,
            catchphrase: junior.catchphrase,
            imageUrl: juniorImageUrl,
            groupName,
            affiliation: formatJuniorAffiliation(groupName, junior.region),
            songs,
        }

        return Response.json({ junior: formattedJunior })
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
