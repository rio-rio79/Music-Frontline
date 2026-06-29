import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseProxy } from '@/lib/supabase-proxy'

/**
 * Proxy (Next.js 16 で middleware から名称変更)
 *
 * 1. 全リクエストでセッションリフレッシュを実行
 * 2. 保護ルート (/my/*) への未認証アクセスを /login へリダイレクト
 */
export async function proxy(request: NextRequest) {
    const { supabase, response } = createSupabaseProxy(request)

    // セッションリフレッシュ（getUser を呼ぶとトークンが更新される）
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 認証されていないユーザーは、/login 以外のページにアクセスした場合に /login へリダイレクト
    const { pathname } = request.nextUrl
    if (pathname !== '/login' && !user) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // 逆に、すでにログインしているユーザーが /login にアクセスした場合はトップページへリダイレクト
    if (pathname === '/login' && user) {
        const topUrl = new URL('/', request.url)
        return NextResponse.redirect(topUrl)
    }

    return response()
}

export const config = {
    matcher: [
        /*
         * api, _next/static, _next/image, 各種アセット(mp3, wav, png, jpg, jpeg, gif, svg, ico)を除外
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:mp3|wav|png|jpg|jpeg|gif|svg)$).*)',
    ],
}
