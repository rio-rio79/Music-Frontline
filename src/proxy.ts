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

    // 保護ルートへの未認証アクセスをリダイレクト
    const { pathname } = request.nextUrl
    if (pathname.startsWith('/my') && !user) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return response()
}

export const config = {
    matcher: [
        /*
         * 静的ファイル・画像最適化・favicon 等を除外
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
