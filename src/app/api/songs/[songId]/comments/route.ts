import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

type RouteContext = {
    params: Promise<{ songId: string }>
}

type SongCommentRequestBody = {
    body?: unknown
    commentId?: unknown
}

type SongCommentRpcResult = {
    comment_id: string
    body: string
    created_at: string
    user_id: string
    author_name: string
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Server error'
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

        const bodyData = await request.json() as SongCommentRequestBody
        const body = typeof bodyData.body === 'string' ? bodyData.body : ''
        const commentBody = body.trim()
        if (!commentBody) {
            return Response.json({ error: 'コメント内容が必要です。' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('create_song_comment_with_points', {
            p_song_id: songId,
            p_body: commentBody,
        })

        if (error) {
            console.error('Failed to insert comment:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        const comment = data as unknown as SongCommentRpcResult
        const formattedComment = {
            id: comment.comment_id,
            body: comment.body,
            createdAt: comment.created_at,
            userId: comment.user_id,
            userName: comment.author_name,
            canDelete: true
        }

        return Response.json({ comment: formattedComment })
    } catch (error: unknown) {
        console.error('Server error in comment POST:', error)
        return Response.json({ error: getErrorMessage(error) }, { status: 500 })
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

        const bodyData = await request.json() as SongCommentRequestBody
        const commentId = typeof bodyData.commentId === 'string' ? bodyData.commentId : ''
        if (!commentId) {
            return Response.json({ error: 'コメントIDが必要です。' }, { status: 400 })
        }

        const { error } = await supabase.rpc('delete_song_comment_with_points', {
            p_song_id: songId,
            p_comment_id: commentId,
        })

        if (error) {
            console.error('Failed to delete comment:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error: unknown) {
        console.error('Server error in comment DELETE:', error)
        return Response.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
