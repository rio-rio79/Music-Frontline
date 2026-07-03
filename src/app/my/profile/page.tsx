'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { TwoPersonIcon, Pen, MusicalNote } from '../../../components/Svgs'
import GiftPanel from '../../../components/GiftPanel/GiftPanel'

// ギフトボックス用データ(colorはハートの色の指定) 要データ置き換え
const myBreakdown = [
    { key: "blog", label: "ブログ", value: 120, color: "#ff6ea0" },
    { key: "song", label: "楽曲", value: 130, color: "#6ec3ff" },
    { key: "vote", label: "アイドル", value: 150, color: "#ffd66e" },
]

// 総ポイント
const total = myBreakdown.reduce((s, b) => s + b.value, 0)

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
        getCurrentUser()
            .then((u) => setUser(u ? { id: u.id, email: u.email } : null))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await logout()
            router.push('/login')
        } catch {
            setLoggingOut(false)
        }
    }

    if (loading) {
        return (
            <section style={{ padding: '44px 24px', textAlign: 'center' }}>
                <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
                <h1 className="page-title" style={{ marginBottom: '34px !important' }}>マイページ</h1>
                <p>読み込み中...</p>
            </section>
        )
    }

    if (!user) {
        return (
            <section style={{ padding: '44px 24px', textAlign: 'center' }}>
                <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
                <h1 className="page-title" style={{ marginBottom: '34px !important' }}>マイページ</h1>
                <p>ログインしていません。</p>
            </section>
        )
    }

    const displayInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U'
    const displayName = user.email ? user.email.split('@')[0] : 'ユーザー'
    const oshiName = "山田太郎" // データ置き換え

    return (
        <main className="page-wrap">
            <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

            <h1 className="page-title" style={{ marginBottom: '34px' }}>My Page</h1>

            <section className="card">
                <div className="card-banner">profile</div>
                <div className="profile-body">
                    <div className="avatar" id="avatarInitial">{displayInitial}</div>
                    <div className="profile-info">
                        <div className="profile-name-row">
                            <span className="profile-name" id="userName">{displayName}</span>
                            <span className="plan-pill">プラン: プレミアム</span>
                        </div>
                        <div className="info-row"><span className="label">ユーザーID：</span><span className="value masked">●●●●●</span></div>
                        <div className="info-row"><span className="label">メールアドレス：</span><span className="value">{user.email}</span></div>
                    </div>
                </div>
            </section>

            <h2 className="section-title">Favorite</h2>
            <div className="stat-grid">
                <div className="stat-card">
                    <TwoPersonIcon/>
                    <div className="stat-label">フォロー中</div>
                    <div className="stat-value" id="statFollow">2</div>
                </div>
                <div className="stat-card">
                    <Pen/>
                    <div className="stat-label">ブログ数</div>
                    <div className="stat-value" id="statBlog">15</div>
                </div>
                <div className="stat-card">
                    <MusicalNote/>
                    <div className="stat-label">曲数</div>
                    <div className="stat-value" id="statSong">10</div>
                </div>
            </div>

            <p className="total-pt-label">
                <span className="name">{oshiName}</span> さんへの総応援pt数
            </p>
            <p className="total-pt-value">
                <span>{total}</span>
                <span className="unit">pt</span>
            </p>

            {/* ギフトボックス部分 */}
            <GiftPanel breakdown={myBreakdown} />

            <a className="withdraw-link">退会する</a>
            <button 
                className="logout-btn" 
                onClick={handleLogout} 
                disabled={loggingOut}
                style={{
                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                    opacity: loggingOut ? 0.6 : 1
                }}
            >
                {loggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
        </main>
    )
}

const pageStyles = `

  :root {
    --pink-main: #ff6ea0;
    --pink-deep: #ff4f8b;
    --pink-pale: #ffe1ec;
    --pink-stripe: #ffc4d9;
    --ink: #2b2730;
    --ink-soft: #6b6570;
    --line: #f0e3e8;
    --bg: #fdfafb;
    --card: #ffffff;
    --heart-blog: #ff6ea0;
    --heart-song: #6ec3ff;
    --heart-vote: #ffd66e;
    --heart-fund: #8ee69b;
  }

  .page-wrap {
    max-width: 680px;
    margin: 0 auto;
    padding: 44px 24px 80px;
    font-family: "Hiragino Sans","Yu Gothic","Helvetica Neue",Arial,sans-serif;
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  .page-title {
    text-align: center;
    font-size: 30px;
    font-weight: 800;
    margin-top: 0px !important;
    margin-bottom: 34px !important;
    position: relative;
    letter-spacing: .5px;
    color: var(--ink);
  }
  .page-title::after {
    content: "";
    display: block;
    width: 46px;
    height: 4px;
    border-radius: 3px;
    background: var(--pink-main);
    margin: 10px auto 0;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(255,110,160,.08);
    margin-bottom: 34px;
  }
  .card-banner {
    background: linear-gradient(90deg,#ffb0cb,var(--pink-main));
    color: #fff;
    text-align: center;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 2px;
    padding: 10px 0;
    text-transform: lowercase;
  }
  .profile-body {
    display: flex;
    align-items: center;
    gap: 26px;
    padding: 28px 30px;
  }
  .avatar {
    flex: 0 0 96px;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: linear-gradient(135deg,#ff8fb3,var(--pink-deep));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 40px;
    font-weight: 800;
    box-shadow: 0 8px 18px rgba(255,79,139,.3);
  }
  .profile-info { flex: 1; }
  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .profile-name {
    font-size: 22px;
    font-weight: 800;
  }
  .plan-pill {
    background: var(--pink-pale);
    color: var(--pink-deep);
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .info-row {
    display: flex;
    font-size: 14px;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  .info-row .label {
    width: 150px;
    flex-shrink: 0;
    color: var(--ink-soft);
  }
  .info-row .value { color: var(--ink); }
  .info-row .value.masked {
    letter-spacing: 3px;
    color: #1c1a1f;
  }
  .info-row .value.highlight {
    color: var(--pink-deep);
    font-weight: 700;
  }

  .section-title {
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 22px;
    position: relative;
    color: var(--ink);
  }
  .section-title::after {
    content: "";
    display: block;
    width: 36px;
    height: 3px;
    border-radius: 3px;
    background: var(--pink-main);
    margin: 8px auto 0;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 16px;
    margin-bottom: 40px;
  }
  .stat-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 20px 10px 18px;
    text-align: center;
  }
  .stat-label {
    font-size: 13px;
    color: var(--ink-soft);
    margin-bottom: 10px;
  }
  .stat-value {
    font-size: 26px;
    font-weight: 800;
  }

  .total-pt-label {
    text-align: center;
    font-size: 15px;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  .total-pt-label .name { color: var(--ink); font-weight: 700; }
  .total-pt-value {
    text-align: center;
    font-size: 48px;
    font-weight: 800;
    color: var(--pink-deep);
    margin-bottom: 30px;
  }
  .total-pt-value .unit {
    font-size: 22px;
    margin-left: 4px;
    font-weight: 700;
  }

  .gift-panel {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 34px 30px 38px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;
    justify-content: center;
  }
  .legend {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 170px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13px;
    color: var(--ink);
  }
  .legend-heart {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .legend-count {
    margin-left: auto;
    font-weight: 700;
    color: var(--ink-soft);
    font-size: 12px;
  }

  .gift-scene {
    position: relative;
    width: 320px;
    height: 260px;
    flex-shrink: 0;
  }

  .withdraw-link {
    display: block;
    text-align: center;
    font-size: 13px;
    color: var(--ink-soft);
    margin: 38px 0 16px;
    text-decoration: underline;
    cursor: pointer;
  }
  .logout-btn {
    display: block;
    margin: 0 auto;
    width: 220px;
    padding: 14px 0;
    border: none;
    border-radius: 10px;
    background: #4a454d;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 1px;
    transition: background 0.2s;
  }
  .logout-btn:hover { background: #39353b; }

  .heart-piece { animation: heartPop .4s ease forwards; }
  @keyframes heartPop {
    from { opacity: 0; transform-origin: center; }
    to { opacity: 1; }
  }

  @media (max-width: 520px) {
    .profile-body { flex-direction: column; text-align: center; padding: 26px 20px; }
    .info-row { justify-content: center; }
    .gift-panel { flex-direction: column; }
    .gift-scene { width: 260px; height: 220px; }
  }
`