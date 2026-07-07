import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

type RouteContext = {
    params: Promise<{ songId: string }>
}

// コメントの投稿
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { songId } = await context.params
        if (!songId) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return Response.json({ error: 'ログインが必要です。' }, { status: 401 })
        }

        const bodyData = await request.json()
        const { body } = bodyData
        if (!body || !body.trim()) {
            return Response.json({ error: 'コメント内容が必要です。' }, { status: 400 })
        }

        // コメントの追加
        const { data: comment, error } = await supabase
            .from('song_comments')
            .insert({
                song_id: songId,
                user_id: user.id,
                body: body.trim()
            })
            .select(`
                id,
                body,
                created_at,
                user_id,
                profiles (
                    name
                )
            `)
            .single()

        if (error) {
            console.error('Failed to insert comment:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        // 応援ポイントの同期 (RPC)
        const { error: rpcError } = await supabase.rpc('sync_song_comment_points', {
            p_song_id: songId
        })
        if (rpcError) {
            console.error('Failed to sync song comment points after insert:', rpcError)
        }

        const formattedComment = {
            id: comment.id,
            body: comment.body,
            createdAt: comment.created_at,
            userId: comment.user_id,
            userName: (comment.profiles as any)?.name || 'ユーザー',
            canDelete: true
        }

        return Response.json({ comment: formattedComment })
    } catch (e: any) {
        console.error('Server error in comment POST:', e)
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}

// コメントの削除
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { songId } = await context.params
        if (!songId) {
            return Response.json({ error: '楽曲IDが必要です。' }, { status: 400 })
        }

        const supabase = await createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return Response.json({ error: 'ログインが必要です。' }, { status: 401 })
        }

        const bodyData = await request.json()
        const { commentId } = bodyData
        if (!commentId) {
            return Response.json({ error: 'コメントIDが必要です。' }, { status: 400 })
        }

        // 所有者チェック: user_id = user.id であることを WHERE 句で検証して削除を実行
        const { data: deletedData, error } = await supabase
            .from('song_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id)
            .select('id')

        if (error) {
            console.error('Failed to delete comment:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        if (!deletedData || deletedData.length === 0) {
            return Response.json({ error: '指定されたコメントが存在しないか、削除権限がありません。' }, { status: 403 })
        }

        // 応援ポイントの同期 (RPC)
        const { error: rpcError } = await supabase.rpc('sync_song_comment_points', {
            p_song_id: songId
        })
        if (rpcError) {
            console.error('Failed to sync song comment points after delete:', rpcError)
        }

        return Response.json({ success: true })
    } catch (e: any) {
        console.error('Server error in comment DELETE:', e)
        return Response.json({ error: e.message || 'Server error' }, { status: 500 })
    }
}
