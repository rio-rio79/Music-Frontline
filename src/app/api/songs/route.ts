import { createSupabaseServer } from '@/lib/supabase-server'
import { resolveMusicCoverUrl } from '@/lib/music-assets'

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Server error'
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim().toLowerCase() || ''
        const sort = searchParams.get('sort') || 'group'

        const supabase = await createSupabaseServer()
        const getMusicCoverUrl = (path: string) =>
            supabase.storage.from('images').getPublicUrl(path).data.publicUrl

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

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        // レスポンスの整形と Storage URL の解決
        let formattedSongs = songs.map((song) => {
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
                // Storage からの公開 URL 取得
                const { data } = supabase.storage.from('audio').getPublicUrl(audioFilePath)
                audioFilePath = data.publicUrl
            }

            // image_path の解決
            const imagePath = resolveMusicCoverUrl(song.image_path, getMusicCoverUrl)

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
        })

        // 検索フィルター (曲名、個人名、グループ名のいずれかに部分一致)
        if (q) {
            formattedSongs = formattedSongs.filter((song) => {
                const titleMatch = song.title.toLowerCase().includes(q)
                const juniorMatch = song.juniors.some((name) => name.toLowerCase().includes(q))
                const groupMatch = song.groups.some((name) => name.toLowerCase().includes(q))
                return titleMatch || juniorMatch || groupMatch
            })
        }

        // ソート処理
        if (sort === 'group') {
            formattedSongs.sort((a, b) => {
                const aGroup = a.groups?.[0] || "";
                const bGroup = b.groups?.[0] || "";
                if (!aGroup && bGroup) return 1;
                if (aGroup && !bGroup) return -1;
                return aGroup.localeCompare(bGroup, "ja");
            })
        } else if (sort === 'fifty') {
            formattedSongs.sort((a, b) => a.title.localeCompare(b.title, "ja"))
        } else if (sort === 'new') {
            formattedSongs.sort((a, b) => {
                const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
                const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
                return bTime - aTime
            })
        } else if (sort === 'popular') {
            formattedSongs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        }

        return Response.json({ songs: formattedSongs })
    } catch (error: unknown) {
        return Response.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
