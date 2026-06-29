import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST() {
    try {
        const supabase = await createSupabaseServer()

        const { error } = await supabase.auth.signOut()

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return Response.json({ success: true })
    } catch {
        return Response.json(
            { error: 'サーバーエラーが発生しました。' },
            { status: 500 }
        )
    }
}
