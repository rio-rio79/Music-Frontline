import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

/**
 * Proxy (旧 middleware) 用の Supabase クライアントを生成する。
 * request / response の Cookie を直接操作して、セッションリフレッシュを行う。
 */
export function createSupabaseProxy(request: NextRequest) {
    // レスポンスを先に作っておき、Cookie をセットできるようにする
    let response = NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // リクエスト Cookie を更新（後続の Server Component が最新値を読めるように）
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    // レスポンス Cookie を更新（ブラウザへ返すため）
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    return { supabase, response: () => response }
}
