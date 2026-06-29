import { createSupabaseServer } from '@/lib/supabase-server'
import { translateAuthError } from '@/lib/auth-errors'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return Response.json(
                { error: 'メールアドレスとパスワードは必須です。' },
                { status: 400 }
            )
        }

        const supabase = await createSupabaseServer()

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            return Response.json(
                { error: translateAuthError(error.message) },
                { status: 400 }
            )
        }

        return Response.json({ user: data.user })
    } catch {
        return Response.json(
            { error: 'サーバーエラーが発生しました。' },
            { status: 500 }
        )
    }
}
