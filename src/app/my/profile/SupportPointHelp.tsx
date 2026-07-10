'use client'

import { useEffect, useState } from 'react'

export type SupportPointHelpItem = {
    label: string
    description: string
}

type SupportPointHelpProps = {
    items: SupportPointHelpItem[]
}

export default function SupportPointHelp({ items }: SupportPointHelpProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open])

    return (
        <>
            <button
                type="button"
                className="point-help-button"
                onClick={() => setOpen(true)}
                aria-label="応援ポイントの内訳を確認"
            >
                ?
            </button>

            {open && (
                <div
                    className="point-help-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setOpen(false)
                    }}
                >
                    <section
                        className="point-help-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="point-help-title"
                    >
                        <div className="point-help-header">
                            <h2 id="point-help-title" className="point-help-title">応援ptの内訳</h2>
                            <button
                                type="button"
                                className="point-help-close"
                                onClick={() => setOpen(false)}
                                aria-label="閉じる"
                            >
                                ×
                            </button>
                        </div>

                        <div className="point-help-body">
                            <p className="point-help-lead">
                                総応援ptは、選択中のタブに含まれるポイントの合計です。下の内訳は、その合計を応援行動ごとに分けたものです。
                            </p>
                            <div className="point-help-list">
                                {items.map((item) => (
                                    <div className="point-help-row" key={item.label}>
                                        <div className="point-help-term">{item.label}</div>
                                        <p className="point-help-description">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}
