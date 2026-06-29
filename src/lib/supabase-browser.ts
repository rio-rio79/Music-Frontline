import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * ブラウザ (Client Component) 用の Supabase クライアントを生成する。
 * document.cookie を自動的に操作する。
 */
export function createSupabaseBrowser() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}
