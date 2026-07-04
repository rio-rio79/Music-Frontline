'use client'

import { useActionState } from 'react'
import { registerOshi, type RegisterOshiState } from './actions'

const initialState: RegisterOshiState = {
    status: 'idle',
    message: '',
}

type JuniorOption = {
    id: string
    label: string
}

type OshiSelectFormProps = {
    juniors: JuniorOption[]
    initialOshiId: string | null
}

export default function OshiSelectForm({
    juniors,
    initialOshiId,
}: OshiSelectFormProps) {
    const [state, formAction, pending] = useActionState(registerOshi, initialState)

    return (
        <form action={formAction}>
            <label htmlFor="juniorId">登録するジュニア</label>
            <select
                id="juniorId"
                name="juniorId"
                defaultValue={initialOshiId ?? ''}
                required
                aria-describedby="oshi-message"
            >
                <option value="" disabled>ジュニアを選択してください</option>
                {juniors.map((junior) => (
                    <option key={junior.id} value={junior.id}>
                        {junior.label}
                    </option>
                ))}
            </select>

            {state.message && (
                <p
                    id="oshi-message"
                    role="status"
                    style={{ color: state.status === 'error' ? '#c62828' : '#237a3b' }}
                >
                    {state.message}
                </p>
            )}

            <button type="submit" disabled={pending}>
                {pending ? '登録中...' : '推しを登録する'}
            </button>
        </form>
    )
}
