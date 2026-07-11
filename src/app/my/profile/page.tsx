import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import PageHeading from '@/components/PageHeading'
import PageShell from '@/components/PageShell'
import { createSupabaseServer } from '@/lib/supabase-server'
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

type MyProfilePageProps = {
    searchParams: Promise<{
        modal?: string
    }>
}

function resolveDefaultSupportPointTab(oshiName: string | null): SupportPointTabKey {
    return oshiName ? 'oshi' : 'all'
}

function getRegionLabel(region: string | null) {
    if (region === 'kanto') return '関東ジュニア'
    if (region === 'kansai') return '関西ジュニア'
    return '無所属'
}

export default async function MyProfilePage({ searchParams }: MyProfilePageProps) {
    const query = await searchParams
    const supabase = await createSupabaseServer()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [
        profileResult,
        plansResult,
        juniorsResult,
        supportPointResult,
        followCountResult,
        blogLikeCountResult,
        songLikeCountResult,
    ] = await Promise.all([
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
        supabase
            .from('follow_juniors')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        supabase
            .from('blog_likes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        supabase
            .from('song_likes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
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
    if (followCountResult.error) {
        console.error('Failed to fetch follow count:', followCountResult.error)
    }
    if (blogLikeCountResult.error) {
        console.error('Failed to fetch blog like count:', blogLikeCountResult.error)
    }
    if (songLikeCountResult.error) {
        console.error('Failed to fetch song like count:', songLikeCountResult.error)
    }

    return (
        <PageShell className="page-wrap">
            <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

            <PageHeading title="My Page" />

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
                initialOpenModal={query.modal === 'plan' ? 'plan' : null}
                plans={plans}
                juniors={juniors}
                initialFavoriteColor={profile?.color_code ?? null}
            />

            <h2 className="section-title">マイアクティビティ</h2>
            <div className="activity-panel">
                <div className="activity-row">
                    <ActivityMetric
                        icon={<PeopleIcon />}
                        label="フォロー"
                        value={followCountResult.count ?? 0}
                        unit="人"
                    />
                    <div className="activity-divider" aria-hidden="true" />
                    <ActivityMetric
                        icon={<PenIcon />}
                        label="いいねしたブログ"
                        value={blogLikeCountResult.count ?? 0}
                        unit="件"
                    />
                    <ActivityMetric
                        icon={<NoteIcon />}
                        label="いいねした楽曲"
                        value={songLikeCountResult.count ?? 0}
                        unit="曲"
                    />
                </div>
            </div>

            <SupportPointSummary
                summaries={supportPointSummaries}
                helpItems={pointHelpItems}
                defaultTab={resolveDefaultSupportPointTab(oshiName)}
            />

            <a className="withdraw-link">退会する</a>
            <LogoutButton />
        </PageShell>
    )
}

function ActivityMetric({
    icon,
    label,
    value,
    unit,
}: {
    icon: ReactNode
    label: string
    value: number
    unit: string
}) {
    return (
        <div className="activity-metric">
            <span className="activity-label">
                {icon}
                {label}
            </span>
            <div className="activity-value">
                <span className="activity-number">{value.toLocaleString('ja-JP')}</span>
                <span className="activity-unit">{unit}</span>
            </div>
        </div>
    )
}

function PeopleIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4f8b" strokeWidth="1.7" aria-hidden="true">
            <circle cx="9" cy="7" r="3" />
            <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
            <circle cx="17" cy="8" r="2.4" />
            <path d="M15 13.3c2.4.2 4 1.9 4 4.2" />
        </svg>
    )
}

function PenIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4f8b" strokeWidth="1.7" aria-hidden="true">
            <path d="M4 19l1.2-4L16 4.2c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8L9 18.8 4 19z" />
        </svg>
    )
}

function NoteIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4f8b" strokeWidth="1.7" aria-hidden="true">
            <path d="M9 18V5l11-2v13" />
            <circle cx="6" cy="18" r="2.4" />
            <circle cx="17" cy="16" r="2.4" />
        </svg>
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
    color: var(--ink);
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

  .activity-panel {
    background: var(--card);
    border-radius: 18px;
    padding: 28px 20px;
    margin-bottom: 40px;
  }

  .activity-row {
    display: flex;
    align-items: center;
  }

  .activity-metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    min-width: 0;
  }

  .activity-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
    white-space: nowrap;
  }

  .activity-value {
    font-weight: 800;
    color: var(--ink);
    white-space: nowrap;
  }

  .activity-number {
    font-size: 28px;
  }

  .activity-unit {
    margin-left: 2px;
    color: var(--ink-soft);
    font-size: 13px;
  }

  .activity-divider {
    width: 1px;
    align-self: stretch;
    background: var(--line);
    margin: 2px 8px;
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
    .activity-panel {
      padding: 24px 10px;
    }

    .activity-row {
      align-items: stretch;
    }

    .activity-metric {
      padding: 4px 6px;
    }

    .activity-label {
      flex-direction: column;
      gap: 5px;
      font-size: 11px;
      text-align: center;
      white-space: normal;
    }

    .activity-number {
      font-size: 24px;
    }

    .activity-unit {
      font-size: 12px;
    }

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
