import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { TwoPersonIcon, Pen, MusicalNote } from '../../../components/Svgs'
import GiftPanel from '../../../components/GiftPanel/GiftPanel'
import LogoutButton from './LogoutButton'
import ProfileCard from './ProfileCard'

// ギフトボックス用データ(colorはハートの色の指定) 要データ置き換え
const myBreakdown = [
    { key: "blog", label: "ブログ", value: 120, color: "#ff6ea0" },
    { key: "song", label: "楽曲", value: 130, color: "#6ec3ff" },
    { key: "vote", label: "アイドル", value: 150, color: "#ffd66e" },
]

// 総ポイント
const total = myBreakdown.reduce((s, b) => s + b.value, 0)

function getRegionLabel(region: string | null) {
    if (region === 'kanto') return '関東ジュニア'
    if (region === 'kansai') return '関西ジュニア'
    return '無所属'
}

export default async function MyProfilePage() {
    const supabase = await createSupabaseServer()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [profileResult, plansResult, juniorsResult] = await Promise.all([
        supabase
            .from('profiles')
            .select(`
                name,
                plan:plans(id, name, monthly_price, point_multiplier),
                oshi:juniors(id, name, image_path, region, group:groups(name))
            `)
            .eq('id', user.id)
            .single(),
        supabase
            .from('plans')
            .select('id, name, monthly_price, point_multiplier')
            .order('monthly_price'),
        supabase
            .from('juniors')
            .select('id, name, image_path, region, group:groups(name)')
            .order('name'),
    ])

    const profile = profileResult.data
    const plans = plansResult.data ?? []
    const juniors = (juniorsResult.data ?? []).map((junior) => {
        const imageUrl = junior.image_path
            ? supabase.storage.from('images').getPublicUrl(junior.image_path).data.publicUrl
            : null

        return {
            id: junior.id,
            name: junior.name,
            imageUrl,
            affiliation: junior.group?.name ?? getRegionLabel(junior.region),
        }
    })

    const displayName = profile?.name
        ?? (user.email ? user.email.split('@')[0] : 'ユーザー')
    const oshiName = profile?.oshi?.name ?? '未登録'

    return (
        <main className="page-wrap">
            <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

            <h1 className="page-title" style={{ marginBottom: '34px' }}>My Page</h1>

            <ProfileCard
                initialName={displayName}
                initialPlan={profile?.plan ?? null}
                initialOshi={profile?.oshi ? {
                    id: profile.oshi.id,
                    name: profile.oshi.name,
                    imageUrl: profile.oshi.image_path
                        ? supabase.storage.from('images').getPublicUrl(profile.oshi.image_path).data.publicUrl
                        : null,
                    affiliation: profile.oshi.group?.name ?? getRegionLabel(profile.oshi.region),
                } : null}
                plans={plans}
                juniors={juniors}
            />

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
            <LogoutButton />
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
    .gift-panel { flex-direction: column; }
    .gift-scene { width: 260px; height: 220px; }
  }
`
