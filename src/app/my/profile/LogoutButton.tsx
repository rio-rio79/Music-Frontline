'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'

export default function LogoutButton() {
    const router = useRouter()
    const [loggingOut, setLoggingOut] = useState(false)

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await logout()
            router.push('/login')
        } catch {
            setLoggingOut(false)
        }
    }

    return (
        <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                opacity: loggingOut ? 0.6 : 1,
            }}
        >
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
    )
}
