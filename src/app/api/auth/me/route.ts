import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = await createSupabaseServer()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return Response.json(
                { error: '認証されていません。' },
                { status: 401 }
            )
        }

        return Response.json({ user })
    } catch {
        return Response.json(
            { error: 'サーバーエラーが発生しました。' },
            { status: 500 }
        )
    }
}
