import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { TwoPersonIcon, Pen, MusicalNote } from '../../../components/Svgs'
import type { BreakdownItem } from '../../../components/GiftPanel/GiftPanel'
import LogoutButton from './LogoutButton'
import ProfileCard from './ProfileCard'
import SupportPointSummary, { type SupportPointSummaryItem, type SupportPointTabKey } from './SupportPointSummary'

const pointHelpItems = [
    { label: '見る・聴く', description: '楽曲再生、ブログ閲覧で入ったポイント' },
    { label: 'いいね', description: '楽曲いいね、ブログいいねで入ったポイント' },
    { label: 'コメント', description: '楽曲コメント、ブログコメントで入ったポイント' },
    { label: 'ファンレター', description: 'ファンレター送信で入ったポイント' },
    { label: '継続応援', description: '推し登録、フォローの月次ポイント' },
]

const supportPointBreakdownTemplate = [
    { key: 'watch', label: '見る・聴く', color: '#6ec3ff' },
    { key: 'like', label: 'いいね', color: '#ffd66e' },
    { key: 'comment', label: 'コメント', color: '#8ee69b' },
    { key: 'fanLetter', label: 'ファンレター', color: '#b58cff' },
    { key: 'continued', label: '継続応援', color: '#ff9f7a' },
] as const

const createEmptyBreakdown = (): BreakdownItem[] => supportPointBreakdownTemplate.map((item) => ({
    ...item,
    value: 0,
}))

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeBreakdown(value: unknown): BreakdownItem[] {
    const rows = Array.isArray(value) ? value : []

    return supportPointBreakdownTemplate.map((template) => {
        const matched = rows.find((row) => isRecord(row) && row.key === template.key)
        const rawValue = isRecord(matched) ? matched.value : 0
        const points = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0

        return {
            ...template,
            value: points,
        }
    })
}

function normalizeSupportPointSummaries(
    value: unknown,
    fallbackOshiName: string | null
): SupportPointSummaryItem[] {
    const fallback: SupportPointSummaryItem[] = [
        {
            key: 'oshi',
            label: '推し',
            targetLabel: fallbackOshiName ?? '推し',
            breakdown: createEmptyBreakdown(),
        },
        {
            key: 'all',
            label: 'すべて',
            targetLabel: 'すべて',
            breakdown: createEmptyBreakdown(),
        },
    ]

    if (!isRecord(value) || !Array.isArray(value.summaries)) {
        return fallback
    }

    const rawSummaries: unknown[] = value.summaries

    return fallback.map((defaultSummary) => {
        const rawSummary = rawSummaries.find(
            (summary) => isRecord(summary) && summary.key === defaultSummary.key
        )

        if (!isRecord(rawSummary)) return defaultSummary

        const targetLabel = typeof rawSummary.targetLabel === 'string'
            ? rawSummary.targetLabel
            : defaultSummary.targetLabel

        return {
            ...defaultSummary,
            targetLabel,
            breakdown: normalizeBreakdown(rawSummary.breakdown),
        }
    })
}

function resolveDefaultSupportPointTab(oshiName: string | null): SupportPointTabKey {
    return oshiName ? 'oshi' : 'all'
}

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

    const [profileResult, plansResult, juniorsResult, supportPointResult] = await Promise.all([
        supabase
            .from('profiles')
            .select(`
                name,
                color_code,
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
        supabase.rpc('get_my_support_point_summary'),
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
    const oshiName = profile?.oshi?.name ?? null
    const supportPointSummaries = normalizeSupportPointSummaries(
        supportPointResult.data,
        oshiName
    )

    if (supportPointResult.error) {
        console.error('Failed to fetch support point summary:', supportPointResult.error)
    }

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
                initialFavoriteColor={profile?.color_code ?? null}
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

            <SupportPointSummary
                summaries={supportPointSummaries}
                helpItems={pointHelpItems}
                defaultTab={resolveDefaultSupportPointTab(oshiName)}
            />

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

  .support-point-summary {
    margin-top: 4px;
  }
  .support-point-tabs {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 0 0 18px;
  }
  .support-point-tab {
    min-width: 92px;
    padding: 8px 18px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    color: var(--ink-soft);
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }
  .support-point-tab.active {
    border-color: var(--pink-main);
    background: var(--pink-pale);
    color: var(--pink-deep);
  }

  .total-pt-label {
    text-align: center;
    font-size: 15px;
    color: var(--ink-soft);
    margin: 0;
  }
  .total-pt-heading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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
    padding: 28px 16px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    position: relative;
  }
  .gift-panel-empty {
    min-height: 170px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 34px 28px;
    text-align: center;
  }
  .gift-empty-title {
    margin: 0;
    color: var(--ink);
    font-size: 17px;
    font-weight: 800;
  }
  .gift-empty-text {
    max-width: 360px;
    margin: 0;
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.8;
  }
  .legend {
    display: grid;
    grid-template-columns: 16px auto 140px;
    column-gap: 9px;
    row-gap: 14px;
    align-items: center;
    align-content: center;
    justify-content: start;
    justify-self: end;
    color: var(--ink);
  }
  .legend-heart {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .legend-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
  }
  .legend-count {
    text-align: right;
    font-weight: 800;
    color: var(--ink);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .gift-divider {
    width: 0;
    height: 160px;
    border-left: 2px dashed #f3cfdc;
    justify-self: center;
    transform: translateX(16px);
  }

  .gift-scene {
    position: relative;
    width: 300px;
    height: 260px;
    flex-shrink: 0;
    justify-self: start;
    transform: translateX(8px);
  }

  .point-help-button {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--pink-stripe);
    border-radius: 50%;
    background: #fff;
    color: var(--pink-deep);
    font-size: 13px;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
  }
  .point-help-button:hover {
    background: var(--pink-pale);
  }
  .point-help-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
    background: rgba(43, 39, 48, .32);
  }
  .point-help-modal {
    width: min(420px, 100%);
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 20px 54px rgba(43, 39, 48, .2);
    overflow: hidden;
  }
  .point-help-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--line);
  }
  .point-help-title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: var(--ink);
  }
  .point-help-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: #f8eef2;
    color: var(--ink-soft);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .point-help-body {
    padding: 16px 20px 20px;
  }
  .point-help-lead {
    margin: 0 0 14px;
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.8;
  }
  .point-help-list {
    display: grid;
    gap: 10px;
  }
  .point-help-row {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 12px;
    align-items: start;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .point-help-row:first-child {
    border-top: 0;
  }
  .point-help-term {
    font-size: 13px;
    font-weight: 800;
    color: var(--ink);
  }
  .point-help-description {
    margin: 0;
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.7;
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
    .gift-panel {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      padding: 28px 12px;
      gap: 8px;
    }
    .legend {
      grid-template-columns: 16px auto minmax(82px, 1fr);
      row-gap: 12px;
    }
    .legend-label {
      font-size: 13px;
    }
    .legend-count {
      font-size: 12px;
    }
    .gift-divider {
      transform: translateX(8px);
    }
    .gift-scene {
      width: 220px;
      height: 200px;
      transform: translateX(4px);
    }
    .point-help-row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
`
