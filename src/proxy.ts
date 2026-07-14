import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseProxy } from '@/lib/supabase-proxy'

const BASIC_AUTH_REALM = 'MUSIC FRONTLINE'

function isBasicAuthEnabled() {
    return (
        process.env.BASIC_AUTH_ENABLED !== 'false' &&
        Boolean(process.env.BASIC_AUTH_USER) &&
        Boolean(process.env.BASIC_AUTH_PASSWORD)
    )
}

function decodeBasicAuthCredentials(authorization: string | null) {
    if (!authorization?.startsWith('Basic ')) {
        return null
    }

    try {
        const decoded = Buffer.from(authorization.slice(6), 'base64').toString(
            'utf8'
        )
        const separatorIndex = decoded.indexOf(':')

        if (separatorIndex === -1) {
            return null
        }

        return {
            user: decoded.slice(0, separatorIndex),
            password: decoded.slice(separatorIndex + 1),
        }
    } catch {
        return null
    }
}

function isValidBasicAuth(request: NextRequest) {
    if (!isBasicAuthEnabled()) {
        return true
    }

    const credentials = decodeBasicAuthCredentials(
        request.headers.get('authorization')
    )

    if (!credentials) {
        return false
    }

    return (
        credentials.user === process.env.BASIC_AUTH_USER &&
        credentials.password === process.env.BASIC_AUTH_PASSWORD
    )
}

function basicAuthResponse() {
    return new NextResponse('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
        },
    })
}

/**
 * Proxy (Next.js 16 で middleware から名称変更)
 *
 * 1. BASIC_AUTH_USER / BASIC_AUTH_PASSWORD が設定されている環境では簡易Basic認証を要求
 * 2. 全リクエストでセッションリフレッシュを実行
 * 3. 保護ルートへの未認証アクセスを /login へリダイレクト
 */
export async function proxy(request: NextRequest) {
    if (!isValidBasicAuth(request)) {
        return basicAuthResponse()
    }

    const { supabase, response } = createSupabaseProxy(request)

    // セッションリフレッシュ（getUser を呼ぶとトークンが更新される）
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 認証されていないユーザーでも、ブログ一覧と詳細は案内表示のため公開する。
    const { pathname } = request.nextUrl
    const isPublicBlogRoute = pathname === '/blog' || pathname.startsWith('/blog/')
    if (pathname !== '/login' && !isPublicBlogRoute && !user) {
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
