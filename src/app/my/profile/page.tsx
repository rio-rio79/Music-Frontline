'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    email?: string
}

export default function MyProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => {
                if (!res.ok) throw new Error()
                return res.json()
            })
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/login')
        } catch {
            setLoggingOut(false)
        }
    }

    if (loading) {
        return (
            <section>
                <h1>マイページ</h1>
                <p>読み込み中...</p>
            </section>
        )
    }

    if (!user) {
        return (
            <section>
                <h1>マイページ</h1>
                <p>ログインしていません。</p>
            </section>
        )
    }

    return (
        <section>
            <h1>マイページ</h1>
            <div style={{ marginTop: '24px' }}>
                <p>
                    <strong>メールアドレス:</strong> {user.email}
                </p>
                <button
                    id="logout-button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                        marginTop: '20px',
                        padding: '12px 28px',
                        border: '1.5px solid rgb(248, 67, 142)',
                        borderRadius: '10px',
                        background: 'transparent',
                        color: 'rgb(248, 67, 142)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: loggingOut ? 'not-allowed' : 'pointer',
                        opacity: loggingOut ? 0.6 : 1,
                        transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        if (!loggingOut) {
                            e.currentTarget.style.background = 'rgb(248, 67, 142)'
                            e.currentTarget.style.color = '#fff'
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgb(248, 67, 142)'
                    }}
                >
                    {loggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>
            </div>
        </section>
    )
}
