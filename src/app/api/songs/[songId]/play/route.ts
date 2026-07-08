import { createSupabaseServer } from '@/lib/supabase-server'

type RouteContext = {
    params: Promise<{ songId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
    try {
        const { songId } = await context.params

        if (!songId) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        // 成立した再生は、ログイン状態にかかわらず楽曲全体の再生回数へ反映する。
        const { error: playCountError } = await supabase.rpc('increment_play_count', {
            song_id: songId,
        })

        if (playCountError) {
            console.error('increment_play_count error:', playCountError)
            return Response.json({ error: playCountError.message }, { status: 500 })
        }

        // ログインユーザーだけランキングポイントを付与する。日次上限はDB側の日本時間period_keyで判定する。
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return Response.json({
                success: true,
                playCountIncremented: true,
                pointsAwarded: false,
                reason: 'guest_user',
            })
        }

        const { data: pointsResult, error: pointsError } = await supabase.rpc('award_song_play_points', {
            p_song_id: songId,
        })

        if (pointsError) {
            console.error('award_song_play_points error:', pointsError)
            return Response.json({ error: pointsError.message }, { status: 500 })
        }

        return Response.json({
            success: true,
            playCountIncremented: true,
            points: pointsResult,
        })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Server error'

        return Response.json(
            { error: message },
            { status: 500 },
        )
    }
}
