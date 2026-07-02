import { createSupabaseBrowser } from './supabase-browser'
import { translateAuthError } from './auth-errors'


export async function login(email: string, password: string) {
    const supabase = createSupabaseBrowser()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    if (error) {
        throw new Error(translateAuthError(error.message))
    }
    return data.user
}

export async function signup(email: string, password: string) {
    const supabase = createSupabaseBrowser()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })
    if (error) {
        throw new Error(translateAuthError(error.message))
    }
    return data.user
}

export async function logout() {
    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.signOut()
    if (error) {
        throw new Error(error.message)
    }
}

export async function getCurrentUser() {
    const supabase = createSupabaseBrowser()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        return null
    }
    return user
}
