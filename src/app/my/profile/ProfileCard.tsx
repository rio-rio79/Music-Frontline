'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import {
    applyFavoriteColor,
    DEFAULT_FAVORITE_COLOR,
    FAVORITE_COLOR_OPTIONS,
    FAVORITE_COLOR_STORAGE_KEY,
} from '@/lib/favorite-color'
import {
    changePlan,
    registerOshi,
    updateFavoriteColor,
    updateUsername,
    type ChangePlanState,
    type RegisterOshiState,
    type UpdateFavoriteColorState,
    type UpdateUsernameState,
} from './actions'
import styles from './ProfileCard.module.css'

type Plan = {
    id: string
    name: string
    monthly_price: number
    point_multiplier: number
}

type Junior = {
    id: string
    name: string
    imageUrl: string | null
    affiliation: string
}

type ProfileCardProps = {
    initialName: string
    initialPlan: Plan | null
    initialOshi: Junior | null
    initialFavoriteColor: string | null
    plans: Plan[]
    juniors: Junior[]
}

type ProfileModal = 'username' | 'plan' | 'oshi' | 'color' | null

const initialUsernameState: UpdateUsernameState = { status: 'idle', message: '' }
const initialPlanState: ChangePlanState = { status: 'idle', message: '' }
const initialOshiState: RegisterOshiState = { status: 'idle', message: '' }
const initialFavoriteColorState: UpdateFavoriteColorState = { status: 'idle', message: '' }

export default function ProfileCard({
    initialName,
    initialPlan,
    initialOshi,
    initialFavoriteColor,
    plans,
    juniors,
}: ProfileCardProps) {
    const [username, setUsername] = useState(initialName)
    const [currentPlan, setCurrentPlan] = useState(initialPlan)
    const [currentOshi, setCurrentOshi] = useState(initialOshi)
    const [favoriteColor, setFavoriteColor] = useState(initialFavoriteColor ?? DEFAULT_FAVORITE_COLOR)
    const [openModal, setOpenModal] = useState<ProfileModal>(null)

    useEffect(() => {
        if (!openModal) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenModal(null)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [openModal])

    return (
        <>
            <section className={styles.card}>
                <div className={styles.banner}>profile</div>
                <div className={styles.headerRow}>
                    <div className={styles.avatar}>{username.charAt(0).toUpperCase()}</div>

                    <div className={styles.nameRow}>
                        <span className={styles.name}>{username}</span>
                        <button
                            type="button"
                            className={styles.editNameButton}
                            onClick={() => setOpenModal('username')}
                            aria-label="ユーザーネームを編集"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                <path d="M4 19l1.2-4L16 4.2c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8L9 18.8 4 19z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={styles.settingList}>
                    <div className={styles.settingItem}>
                        <div className={styles.settingCaption}>プラン</div>
                        <div className={styles.settingContent}>
                            <span className={styles.settingValue}>{currentPlan?.name ?? '未設定'}</span>
                            <button
                                type="button"
                                className={styles.changeButton}
                                onClick={() => setOpenModal('plan')}
                            >
                                変更
                            </button>
                        </div>
                    </div>

                    <div className={styles.settingDivider} />

                    <div className={styles.settingItem}>
                        <div className={styles.settingCaption}>推し</div>
                        <div className={styles.settingContent}>
                            <span className={styles.oshiValue}>
                                <span className={currentOshi ? styles.oshiName : styles.unsetValue}>
                                    {currentOshi ? currentOshi.name : '未登録'}
                                </span>
                                {currentOshi && (
                                    <span className={styles.oshiTag}>{currentOshi.affiliation}</span>
                                )}
                            </span>
                            <button
                                type="button"
                                className={styles.changeButton}
                                onClick={() => setOpenModal('oshi')}
                            >
                                {currentOshi ? '変更' : '登録'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.settingDivider} />

                    <div className={styles.settingItem}>
                        <div className={styles.settingCaption}>推しカラー</div>
                        <div className={styles.settingContent}>
                            <span className={styles.colorValue}>
                                <span
                                    className={styles.colorSwatch}
                                    style={{ backgroundColor: favoriteColor }}
                                    aria-hidden="true"
                                />
                                {FAVORITE_COLOR_OPTIONS.find((color) => color.value === favoriteColor)?.label ?? favoriteColor}
                            </span>
                            <button
                                type="button"
                                className={styles.changeButton}
                                onClick={() => setOpenModal('color')}
                            >
                                変更
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {openModal === 'username' && (
                <UsernameModal
                    currentName={username}
                    onClose={() => setOpenModal(null)}
                    onSaved={(name) => {
                        setUsername(name)
                        setOpenModal(null)
                    }}
                />
            )}

            {openModal === 'plan' && (
                <PlanModal
                    plans={plans}
                    currentPlanId={currentPlan?.id ?? null}
                    onClose={() => setOpenModal(null)}
                    onSaved={(plan) => {
                        setCurrentPlan(plan)
                        setOpenModal(null)
                    }}
                />
            )}

            {openModal === 'oshi' && (
                <OshiModal
                    juniors={juniors}
                    currentOshiId={currentOshi?.id ?? null}
                    onClose={() => setOpenModal(null)}
                    onSaved={(oshi) => {
                        setCurrentOshi(oshi)
                        setOpenModal(null)
                    }}
                />
            )}

            {openModal === 'color' && (
                <FavoriteColorModal
                    currentColor={favoriteColor}
                    onClose={() => setOpenModal(null)}
                    onSaved={(color) => {
                        setFavoriteColor(color)
                        setOpenModal(null)
                    }}
                />
            )}
        </>
    )
}

function UsernameModal({
    currentName,
    onClose,
    onSaved,
}: {
    currentName: string
    onClose: () => void
    onSaved: (name: string) => void
}) {
    const [draft, setDraft] = useState(currentName)
    const [state, formAction, pending] = useActionState(updateUsername, initialUsernameState)

    useEffect(() => {
        if (state.status === 'success') onSaved(draft.trim())
    }, [draft, onSaved, state.status])

    return (
        <div className={styles.overlay} onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) onClose()
        }}>
            <form action={formAction} className={`${styles.modal} ${styles.usernameModal}`} role="dialog" aria-modal="true" aria-labelledby="username-modal-title">
                <ModalHeader id="username-modal-title" title="ユーザーネームを編集" onClose={onClose} disabled={pending} />

                <div className={styles.usernameBody}>
                    <label className={styles.fieldLabel} htmlFor="modal-username">ユーザーネーム</label>
                    <input
                        id="modal-username"
                        name="username"
                        type="text"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={30}
                        className={styles.textInput}
                        disabled={pending}
                        autoFocus
                    />
                    <p className={styles.helpText}>1〜30文字で入力してください。</p>
                    <ActionError message={state.status === 'error' ? state.message : ''} />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    confirmLabel={pending ? '変更中...' : '変更する'}
                    disabled={!draft.trim() || pending}
                />
            </form>
        </div>
    )
}

function PlanModal({
    plans,
    currentPlanId,
    onClose,
    onSaved,
}: {
    plans: Plan[]
    currentPlanId: string | null
    onClose: () => void
    onSaved: (plan: Plan) => void
}) {
    const [selectedId, setSelectedId] = useState(currentPlanId)
    const [state, formAction, pending] = useActionState(changePlan, initialPlanState)

    useEffect(() => {
        if (state.status !== 'success') return
        const selectedPlan = plans.find((plan) => plan.id === selectedId)
        if (selectedPlan) onSaved(selectedPlan)
    }, [onSaved, plans, selectedId, state.status])

    return (
        <div className={styles.overlay} onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) onClose()
        }}>
            <form action={formAction} className={`${styles.modal} ${styles.planModal}`} role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
                <input type="hidden" name="planId" value={selectedId ?? ''} />
                <ModalHeader id="plan-modal-title" title="プランを変更" onClose={onClose} disabled={pending} />

                <div className={styles.planList}>
                    {plans.map((plan) => {
                        const selected = plan.id === selectedId
                        return (
                            <button
                                key={plan.id}
                                type="button"
                                className={`${styles.choiceRow} ${selected ? styles.choiceRowSelected : ''}`}
                                onClick={() => setSelectedId(plan.id)}
                                aria-pressed={selected}
                                disabled={pending}
                            >
                                <span className={styles.choiceContent}>
                                    <span className={styles.planHeading}>
                                        <span className={styles.choiceName}>{plan.name}</span>
                                        <span className={styles.tag}>
                                            {plan.monthly_price === 0
                                                ? '無料'
                                                : `¥${plan.monthly_price.toLocaleString('ja-JP')}/月`}
                                        </span>
                                    </span>
                                    <span className={styles.choiceDetail}>
                                        応援ポイント x{plan.point_multiplier.toFixed(1)}
                                    </span>
                                </span>
                                <ChoiceIndicator selected={selected} />
                            </button>
                        )
                    })}
                    <ActionError message={state.status === 'error' ? state.message : ''} />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    confirmLabel={pending ? '変更中...' : 'このプランに変更'}
                    disabled={!selectedId || pending}
                />
            </form>
        </div>
    )
}

function OshiModal({
    juniors,
    currentOshiId,
    onClose,
    onSaved,
}: {
    juniors: Junior[]
    currentOshiId: string | null
    onClose: () => void
    onSaved: (junior: Junior) => void
}) {
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState(currentOshiId)
    const [errorMessage, setErrorMessage] = useState('')
    const [pending, startTransition] = useTransition()
    const filteredJuniors = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP')
        if (!normalizedQuery) return juniors

        return juniors.filter((junior) =>
            junior.name.toLocaleLowerCase('ja-JP').includes(normalizedQuery)
            || junior.affiliation.toLocaleLowerCase('ja-JP').includes(normalizedQuery)
        )
    }, [juniors, query])

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!selectedId) return

        setErrorMessage('')
        const formData = new FormData()
        formData.set('juniorId', selectedId)

        startTransition(async () => {
            const result = await registerOshi(initialOshiState, formData)

            if (result.status === 'error') {
                setErrorMessage(result.message)
                return
            }

            const selectedJunior = juniors.find((junior) => junior.id === selectedId)
            if (!selectedJunior) {
                setErrorMessage('選択したジュニアの情報を確認できませんでした。')
                return
            }

            onSaved(selectedJunior)
        })
    }

    return (
        <div className={styles.overlay} onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) onClose()
        }}>
            <form onSubmit={handleSubmit} className={`${styles.modal} ${styles.oshiModal}`} role="dialog" aria-modal="true" aria-labelledby="oshi-modal-title">
                <ModalHeader id="oshi-modal-title" title="推しを登録" onClose={onClose} disabled={pending} />

                <div className={styles.searchArea}>
                    <div className={styles.searchBox}>
                        <svg width="15" height="15" viewBox="0 0 22 22" fill="none" stroke="#bbb" strokeWidth="2" aria-hidden="true">
                            <circle cx="9" cy="9" r="7" />
                            <path d="M14.5 14.5 L20 20" strokeLinecap="round" />
                        </svg>
                        <input
                            type="search"
                            placeholder="名前・グループで検索"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className={styles.searchInput}
                            disabled={pending}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.juniorList}>
                    {filteredJuniors.map((junior) => {
                        const selected = junior.id === selectedId
                        return (
                            <button
                                key={junior.id}
                                type="button"
                                className={`${styles.juniorRow} ${selected ? styles.choiceRowSelected : ''}`}
                                onClick={() => setSelectedId(junior.id)}
                                aria-pressed={selected}
                                disabled={pending}
                            >
                                <span
                                    className={styles.juniorAvatar}
                                    style={junior.imageUrl ? { backgroundImage: `url("${junior.imageUrl}")` } : undefined}
                                    aria-hidden="true"
                                >
                                    {junior.imageUrl ? '' : junior.name.charAt(0)}
                                </span>
                                <span className={styles.choiceContent}>
                                    <span className={styles.juniorName}>{junior.name}</span>
                                    <span className={styles.tag}>{junior.affiliation}</span>
                                </span>
                                <ChoiceIndicator selected={selected} />
                            </button>
                        )
                    })}
                    {filteredJuniors.length === 0 && (
                        <p className={styles.emptyMessage}>該当するジュニアが見つかりません。</p>
                    )}
                </div>

                <div className={styles.modalStatus}>
                    <ActionError message={errorMessage} />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    confirmLabel={pending ? '登録中...' : 'この推しに決定'}
                    disabled={!selectedId || pending}
                />
            </form>
        </div>
    )
}

function FavoriteColorModal({
    currentColor,
    onClose,
    onSaved,
}: {
    currentColor: string
    onClose: () => void
    onSaved: (color: string) => void
}) {
    const [selectedColor, setSelectedColor] = useState(currentColor)
    const [errorMessage, setErrorMessage] = useState('')
    const [pending, startTransition] = useTransition()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setErrorMessage('')
        const formData = new FormData()
        formData.set('colorCode', selectedColor)

        startTransition(async () => {
            const result = await updateFavoriteColor(initialFavoriteColorState, formData)

            if (result.status === 'error') {
                setErrorMessage(result.message)
                return
            }

            localStorage.setItem(FAVORITE_COLOR_STORAGE_KEY, selectedColor)
            applyFavoriteColor(selectedColor)
            onSaved(selectedColor)
        })
    }

    return (
        <div className={styles.overlay} onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) onClose()
        }}>
            <form onSubmit={handleSubmit} className={`${styles.modal} ${styles.colorModal}`} role="dialog" aria-modal="true" aria-labelledby="color-modal-title">
                <ModalHeader id="color-modal-title" title="推しカラーを変更" onClose={onClose} disabled={pending} />

                <div className={styles.colorModalBody}>
                    <div className={styles.colorGrid} role="radiogroup" aria-label="推しカラー">
                        {FAVORITE_COLOR_OPTIONS.map((color) => {
                            const selected = color.value === selectedColor

                            return (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={`${styles.colorOption} ${selected ? styles.colorOptionSelected : ''}`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => setSelectedColor(color.value)}
                                    role="radio"
                                    aria-checked={selected}
                                    aria-label={color.label}
                                    disabled={pending}
                                >
                                    {selected ? <span aria-hidden="true">✓</span> : null}
                                </button>
                            )
                        })}
                    </div>
                    <p className={styles.helpText}>ヘッダーやサイドメニューに反映されるカラーです。</p>
                    <ActionError message={errorMessage} />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    confirmLabel={pending ? '変更中...' : 'このカラーに変更'}
                    disabled={!selectedColor || pending}
                />
            </form>
        </div>
    )
}

function ModalHeader({
    id,
    title,
    onClose,
    disabled,
}: {
    id: string
    title: string
    onClose: () => void
    disabled: boolean
}) {
    return (
        <div className={styles.modalHeader}>
            <h2 id={id} className={styles.modalTitle}>{title}</h2>
            <button type="button" className={styles.closeButton} onClick={onClose} disabled={disabled} aria-label="閉じる">×</button>
        </div>
    )
}

function ModalFooter({
    onCancel,
    confirmLabel,
    disabled,
}: {
    onCancel: () => void
    confirmLabel: string
    disabled: boolean
}) {
    return (
        <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>キャンセル</button>
            <button type="submit" className={styles.confirmButton} disabled={disabled}>{confirmLabel}</button>
        </div>
    )
}

function ChoiceIndicator({ selected }: { selected: boolean }) {
    return (
        <span className={`${styles.indicator} ${selected ? styles.indicatorSelected : ''}`} aria-hidden="true">
            {selected ? '✓' : ''}
        </span>
    )
}

function ActionError({ message }: { message: string }) {
    if (!message) return null
    return <p className={styles.errorMessage} role="alert">{message}</p>
}
