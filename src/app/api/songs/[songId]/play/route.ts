import { createSupabaseServer } from '@/lib/supabase-server'

type RouteContext = {
    params: Promise<{ songId: string }>
}

type RecordSongPlayResult = {
    points?: unknown
}

export async function POST(_request: Request, context: RouteContext) {
    try {
        const { songId } = await context.params

        if (!songId) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        // 成立した再生は、DB側で再生回数加算とログインユーザーのポイント付与を一括実行する。
        const { data: result, error } = await supabase.rpc('record_song_play_with_points', {
            p_song_id: songId,
        })

        if (error) {
            console.error('record_song_play_with_points error:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        const recordResult = result as RecordSongPlayResult | null

        return Response.json({
            success: true,
            playCountIncremented: true,
            result,
            points: recordResult?.points ?? null,
        })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Server error'

        return Response.json(
            { error: message },
            { status: 500 },
        )
    }
}
