import { createSupabaseServer } from '@/lib/supabase-server'

type RouteContext = {
    params: Promise<{ songId: string }>
}

export async function POST(request: Request, context: RouteContext) {
    try {
        const { songId } = await context.params

        if (!songId) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        // ログインユーザーの取得
        const { data: { user } } = await supabase.auth.getUser()

        // ゲスト（未ログイン）ユーザーの再生は、ランキング（play_countのインクリメント）に反映しない仕様
        if (!user) {
            return Response.json({ success: true, skipped: true, reason: 'guest_user' })
        }

        // 本日の0時（UTC）以降の、このユーザーによるこの曲の再生カウントログを取得
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayIso = today.toISOString()

        const { count, error: countError } = await supabase
            .from('support_point_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('source_id', songId)
            .eq('action_type', 'play')
            .gte('created_at', todayIso)

        if (countError) {
            console.error('Failed to fetch support_point_logs count:', countError)
            return Response.json({ error: countError.message }, { status: 500 })
        }


        if (count !== null && count >= 20) {
            return Response.json({ success: true, skipped: true, reason: 'limit_reached' })
        }

        // Supabase の RPC で再生回数をインクリメント
        const { error } = await supabase.rpc('increment_play_count', {
            song_id: songId,
        })

        if (error) {
            console.error('increment_play_count error:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        // 再生カウントに成功した場合、関連するジュニアの支援ポイントログ (support_point_logs) を記録
        const { data: songJuniors } = await supabase
            .from('song_juniors')
            .select('junior_id')
            .eq('song_id', songId)
            .limit(1)

        if (songJuniors && songJuniors.length > 0) {
            const juniorId = songJuniors[0].junior_id
            const { error: logError } = await supabase
                .from('support_point_logs')
                .insert({
                    user_id: user.id,
                    junior_id: juniorId,
                    action_type: 'play',
                    source_type: 'song',
                    source_id: songId,
                    points: 1
                })

            if (logError) {
                console.error('Failed to insert support_point_log:', logError)
            }
        }

        return Response.json({ success: true })
    } catch (e: any) {
        return Response.json(
            { error: e.message || 'Server error' },
            { status: 500 },
        )
    }
}
