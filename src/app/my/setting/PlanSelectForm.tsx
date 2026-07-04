'use client'

import { useActionState } from 'react'
import { changePlan, type ChangePlanState } from './actions'

const initialState: ChangePlanState = {
    status: 'idle',
    message: '',
}

type PlanOption = {
    id: string
    label: string
}

type PlanSelectFormProps = {
    plans: PlanOption[]
    initialPlanId: string | null
}

export default function PlanSelectForm({
    plans,
    initialPlanId,
}: PlanSelectFormProps) {
    const [state, formAction, pending] = useActionState(changePlan, initialState)

    return (
        <form action={formAction}>
            <label htmlFor="planId">会員プラン</label>
            <select
                id="planId"
                name="planId"
                defaultValue={initialPlanId ?? ''}
                required
                aria-describedby="plan-help plan-message"
            >
                <option value="" disabled>プランを選択してください</option>
                {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                        {plan.label}
                    </option>
                ))}
            </select>

            <p id="plan-help">
                デモ用の切り替えです。実際の料金は発生しません。
            </p>

            {state.message && (
                <p
                    id="plan-message"
                    role="status"
                    style={{ color: state.status === 'error' ? '#c62828' : '#237a3b' }}
                >
                    {state.message}
                </p>
            )}

            <button type="submit" disabled={pending}>
                {pending ? '変更中...' : 'プランを変更する'}
            </button>
        </form>
    )
}
