import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: Request) {
    try {
        const supabase = await createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return Response.json(
                { error: '認証されていません。' },
                { status: 401 }
            )
        }

        // follow_juniors テーブルからデータを取得し、ジュニアデータを結合
        // juniors に group_id があれば groups からも名前を取得
        const { data: follows, error: followsError } = await supabase
            .from('follow_juniors')
            .select(`
                id,
                junior_id,
                juniors (
                    id,
                    name,
                    image_path,
                    group_id,
                    groups (
                        name
                    )
                )
            `)
            .eq('user_id', user.id)

        if (followsError) {
            return Response.json({ error: followsError.message }, { status: 500 })
        }

        // 取得したデータをフロントエンド用の形式に整形
        const formattedJuniors = (follows || []).map((follow) => {
            const junior = follow.juniors
            if (!junior) return null

            let imagePath = junior.image_path || '/music_cover_img.png' // デフォルト画像
            if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
                const { data } = supabase.storage.from('images').getPublicUrl(imagePath)
                imagePath = data.publicUrl
            }

            return {
                id: junior.id,
                name: junior.name,
                groupName: junior.groups?.name || null,
                imageUrl: imagePath,
            }
        }).filter(Boolean)

        return Response.json({ juniors: formattedJuniors })
    } catch (e: any) {
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return Response.json(
                { error: '認証されていません。' },
                { status: 401 }
            )
        }

        const { juniorId } = await request.json()
        if (!juniorId) {
            return Response.json({ error: 'ジュニアIDが必要です。' }, { status: 400 })
        }

        // 作成したRPC (toggle_follow_junior) を呼び出し
        const { data, error: rpcError } = await supabase.rpc('toggle_follow_junior', {
            p_junior_id: juniorId
        })

        if (rpcError) {
            return Response.json({ error: rpcError.message }, { status: 500 })
        }

        // toggle_follow_junior は { followed: boolean } 形式で返す
        const resData = data as any
        return Response.json({ liked: resData.followed })
    } catch (e: any) {
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}
