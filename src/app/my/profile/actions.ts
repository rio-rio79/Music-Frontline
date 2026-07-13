'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import {
    isCommentFilterMode,
    isPremiumPlan,
} from '@/lib/comment-filter'
import { isFavoriteColorOption } from '@/lib/favorite-color'

export type UpdateUsernameState = {
    status: 'idle' | 'success' | 'error'
    message: string
}

export type RegisterOshiState = {
    status: 'idle' | 'success' | 'error'
    message: string
}

export type ChangePlanState = {
    status: 'idle' | 'success' | 'error'
    message: string
}

export type UpdateFavoriteColorState = {
    status: 'idle' | 'success' | 'error'
    message: string
}

export type UpdateCommentFilterState = {
    status: 'idle' | 'success' | 'error'
    message: string
}

const USERNAME_MAX_LENGTH = 30

export async function updateUsername(
    _previousState: UpdateUsernameState,
    formData: FormData
): Promise<UpdateUsernameState> {
    const value = formData.get('username')
    const username = typeof value === 'string' ? value.trim() : ''

    if (!username) {
        return { status: 'error', message: 'ユーザーネームを入力してください。' }
    }

    if (username.length > USERNAME_MAX_LENGTH) {
        return {
            status: 'error',
            message: `ユーザーネームは${USERNAME_MAX_LENGTH}文字以内で入力してください。`,
        }
    }

    const supabase = await createSupabaseServer()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { status: 'error', message: 'ログイン情報を確認できませんでした。' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            name: username,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .single()

    if (error) {
        console.error('Failed to update username:', error)
        return { status: 'error', message: 'ユーザーネームを変更できませんでした。' }
    }

    revalidatePath('/my/profile')

    return { status: 'success', message: 'ユーザーネームを変更しました。' }
}

export async function registerOshi(
    _previousState: RegisterOshiState,
    formData: FormData
): Promise<RegisterOshiState> {
    const value = formData.get('juniorId')
    const juniorId = typeof value === 'string' ? value : ''

    if (!juniorId) {
        return { status: 'error', message: '登録するジュニアを選択してください。' }
    }

    const supabase = await createSupabaseServer()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { status: 'error', message: 'ログイン情報を確認できませんでした。' }
    }

    const { error } = await supabase.rpc('set_oshi_junior', {
        p_junior_id: juniorId,
    })

    if (error) {
        console.error('Failed to register oshi:', error)
        const developmentDetail = process.env.NODE_ENV === 'development'
            ? `（${error.code}: ${error.message}）`
            : ''
        return {
            status: 'error',
            message: `推しを登録できませんでした。${developmentDetail}`,
        }
    }

    revalidatePath('/my/profile')

    return { status: 'success', message: '推しを登録しました。' }
}

export async function changePlan(
    _previousState: ChangePlanState,
    formData: FormData
): Promise<ChangePlanState> {
    const value = formData.get('planId')
    const planId = typeof value === 'string' ? value : ''

    if (!planId) {
        return { status: 'error', message: '変更するプランを選択してください。' }
    }

    const supabase = await createSupabaseServer()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { status: 'error', message: 'ログイン情報を確認できませんでした。' }
    }

    const { data: selectedPlan, error: selectedPlanError } = await supabase
        .from('plans')
        .select('monthly_price')
        .eq('id', planId)
        .maybeSingle()

    if (selectedPlanError) {
        console.error('Failed to fetch selected plan:', selectedPlanError)
        return { status: 'error', message: '変更するプランを確認できませんでした。' }
    }

    if (!selectedPlan) {
        return { status: 'error', message: '変更するプランを確認できませんでした。' }
    }

    const { error } = await supabase.rpc('change_membership_plan', {
        p_plan_id: planId,
    })

    if (error) {
        console.error('Failed to change membership plan:', error)
        return { status: 'error', message: 'プランを変更できませんでした。' }
    }

    if (!isPremiumPlan(selectedPlan.monthly_price)) {
        const { error: resetError } = await supabase
            .from('profiles')
            .update({
                comment_filter_mode: 'all',
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('id')
            .single()

        if (resetError) {
            console.error('Failed to reset comment filter mode after plan downgrade:', resetError)
            return {
                status: 'error',
                message: 'プランを変更しましたが、コメント表示設定をリセットできませんでした。',
            }
        }
    }

    revalidatePath('/my/profile')

    return { status: 'success', message: 'プランを変更しました。' }
}

export async function updateFavoriteColor(
    _previousState: UpdateFavoriteColorState,
    formData: FormData
): Promise<UpdateFavoriteColorState> {
    const value = formData.get('colorCode')
    const colorCode = typeof value === 'string' ? value : ''

    if (!colorCode || !isFavoriteColorOption(colorCode)) {
        return { status: 'error', message: '選択したカラーを確認できませんでした。' }
    }

    const supabase = await createSupabaseServer()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { status: 'error', message: 'ログイン情報を確認できませんでした。' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            color_code: colorCode,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .single()

    if (error) {
        console.error('Failed to update favorite color:', error)
        return { status: 'error', message: '推しカラーを変更できませんでした。' }
    }

    revalidatePath('/')
    revalidatePath('/my/profile')

    return { status: 'success', message: '推しカラーを変更しました。' }
}

export async function updateCommentFilterMode(
    _previousState: UpdateCommentFilterState,
    formData: FormData
): Promise<UpdateCommentFilterState> {
    const value = formData.get('commentFilterMode')
    const mode = typeof value === 'string' && isCommentFilterMode(value)
        ? value
        : null

    if (!mode) {
        return { status: 'error', message: 'コメント表示設定を確認できませんでした。' }
    }

    const supabase = await createSupabaseServer()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { status: 'error', message: 'ログイン情報を確認できませんでした。' }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan:plans(monthly_price)')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) {
        console.error('Failed to fetch plan for comment filter:', profileError)
        return { status: 'error', message: 'プラン情報を確認できませんでした。' }
    }

    const profileData = profile as { plan: { monthly_price: number } | null } | null
    if (!isPremiumPlan(profileData?.plan?.monthly_price)) {
        return { status: 'error', message: 'コメント表示設定はプレミアムプラン限定です。' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            comment_filter_mode: mode,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .single()

    if (error) {
        console.error('Failed to update comment filter mode:', error)
        return { status: 'error', message: 'コメント表示設定を変更できませんでした。' }
    }

    revalidatePath('/my/profile')
    revalidatePath('/music/[songId]', 'page')
    revalidatePath('/blog/[id]', 'page')

    return { status: 'success', message: 'コメント表示設定を変更しました。' }
}
