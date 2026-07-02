import { createSupabaseServer } from '@/lib/supabase-server'

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params

        if (!id) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()

        // Supabase の RPC で再生回数をインクリメント
        const { error } = await supabase.rpc('increment_play_count', {
            song_id: id,
        })

        if (error) {
            console.error('increment_play_count error:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (e: any) {
        return Response.json(
            { error: e.message || 'Server error' },
            { status: 500 },
        )
    }
}
