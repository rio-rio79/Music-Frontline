'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from '@/lib/auth'
import './login.css'

type Tab = 'login' | 'signup'

export default function LoginPage() {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const authFn = tab === 'login' ? login : signup
            await authFn(email, password)


            router.push('/')
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('通信エラーが発生しました。')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-card">
                {/* タブ切替 */}
                <div className="login-tabs">
                    <button
                        id="tab-login"
                        type="button"
                        className={`login-tab${tab === 'login' ? ' active' : ''}`}
                        onClick={() => {
                            setTab('login')
                            setError('')
                        }}
                    >
                        ログイン
                    </button>
                    <button
                        id="tab-signup"
                        type="button"
                        className={`login-tab${tab === 'signup' ? ' active' : ''}`}
                        onClick={() => {
                            setTab('signup')
                            setError('')
                        }}
                    >
                        サインアップ
                    </button>
                </div>

                {/* フォーム */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="email">メールアドレス</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">パスワード</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="8文字以上"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={
                                tab === 'login'
                                    ? 'current-password'
                                    : 'new-password'
                            }
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button
                        id="submit-auth"
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                    >
                        {loading && <span className="login-spinner" />}
                        {tab === 'login' ? 'ログイン' : 'アカウント作成'}
                    </button>
                </form>
            </div>
        </div>
    )
}
