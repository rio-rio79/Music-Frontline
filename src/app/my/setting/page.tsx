import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import UserNameForm from './UserNameForm'
import OshiSelectForm from './OshiSelectForm'
import PlanSelectForm from './PlanSelectForm'

function getRegionLabel(region: string | null) {
    if (region === 'kanto') return '関東ジュニア'
    if (region === 'kansai') return '関西ジュニア'
    return '無所属'
}

export default async function MySetting() {
    const supabase = await createSupabaseServer()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [profileResult, juniorsResult, plansResult] = await Promise.all([
        supabase
            .from('profiles')
            .select('name, oshi_junior_id, plan_id')
            .eq('id', user.id)
            .single(),
        supabase
            .from('juniors')
            .select('id, name, region, group:groups(name)')
            .order('name'),
        supabase
            .from('plans')
            .select('id, name, monthly_price, point_multiplier')
            .order('monthly_price'),
    ])

    const profile = profileResult.data
    const juniors = juniorsResult.data?.map((junior) => ({
        id: junior.id,
        label: `${junior.name} - ${junior.group?.name ?? getRegionLabel(junior.region)}`,
    })) ?? []
    const plans = plansResult.data?.map((plan) => ({
        id: plan.id,
        label: `${plan.name}（月額${plan.monthly_price.toLocaleString('ja-JP')}円・${plan.point_multiplier}倍）`,
    })) ?? []

    return (
        <section style={{ maxWidth: '520px', margin: '0 auto', padding: '44px 24px 80px' }}>
            <h1>個人設定ページ</h1>
            <h2>プロフィール設定</h2>

            {profile ? (
                <UserNameForm initialName={profile.name} />
            ) : (
                <p role="alert">プロフィール情報を取得できませんでした。</p>
            )}

            <h2>推し設定</h2>

            {profile && !juniorsResult.error ? (
                <OshiSelectForm
                    key={profile.oshi_junior_id ?? 'unregistered'}
                    juniors={juniors}
                    initialOshiId={profile.oshi_junior_id}
                />
            ) : (
                <p role="alert">推し設定に必要な情報を取得できませんでした。</p>
            )}

            <h2>会員プラン設定</h2>

            {profile && !plansResult.error ? (
                <PlanSelectForm
                    key={profile.plan_id ?? 'unset'}
                    plans={plans}
                    initialPlanId={profile.plan_id}
                />
            ) : (
                <p role="alert">会員プラン情報を取得できませんでした。</p>
            )}
        </section>
    )
}
