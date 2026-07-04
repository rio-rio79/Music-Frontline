'use client'

import { useActionState } from 'react'
import { updateUsername, type UpdateUsernameState } from './actions'

const initialState: UpdateUsernameState = {
    status: 'idle',
    message: '',
}

type UserNameFormProps = {
    initialName: string
}

export default function UserNameForm({ initialName }: UserNameFormProps) {
    const [state, formAction, pending] = useActionState(updateUsername, initialState)

    return (
        <form action={formAction}>
            <label htmlFor="username">ユーザーネーム</label>
            <input
                id="username"
                name="username"
                type="text"
                defaultValue={initialName}
                maxLength={30}
                required
                autoComplete="nickname"
                aria-describedby="username-help username-message"
            />
            <p id="username-help">1〜30文字で入力してください。</p>

            {state.message && (
                <p
                    id="username-message"
                    role="status"
                    style={{ color: state.status === 'error' ? '#c62828' : '#237a3b' }}
                >
                    {state.message}
                </p>
            )}

            <button type="submit" disabled={pending}>
                {pending ? '変更中...' : '変更する'}
            </button>
        </form>
    )
}
