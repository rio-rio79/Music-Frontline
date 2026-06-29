import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Route Handlers (サーバーサイド) 用の Supabase クライアントを生成する。
 * cookies() を通じてセッション Cookie の読み書きを行う。
 */
export async function createSupabaseServer() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component から呼ばれた場合は set できないが無視して良い。
                        // Proxy でセッションリフレッシュ済みのため問題ない。
                    }
                },
            },
        }
    )
}
