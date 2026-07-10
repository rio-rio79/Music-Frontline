'use client'

import { Fragment, useMemo, type ReactNode } from 'react'

// 他のファイルでも再利用できるように export しておくと便利です
export type BreakdownItem = {
    key: string
    label: string
    value: number
    color: string
}

type GiftPanelProps = {
    breakdown: BreakdownItem[] // 引数（Props）として受け取るように追加
    helpButton?: ReactNode
}

type HeartData = {
    color: string
    px: number
    y: number
    rot: number
    scale: number
    delay: string
    isInsideBox: boolean
}

function hashString(value: string) {
    let hash = 2166136261

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }

    return hash >>> 0
}

function createSeededRandom(seed: number) {
    let value = seed || 1

    return (min: number, max: number) => {
        value = (Math.imul(value, 1664525) + 1013904223) >>> 0
        return min + (value / 4294967296) * (max - min)
    }
}

export default function GiftPanel({ breakdown, helpButton }: GiftPanelProps) {
    const visibleBreakdown = breakdown.filter((item) => item.value > 0)
    const total = visibleBreakdown.reduce((s, b) => s + b.value, 0)
    const MAX_HEARTS = 46

    const hearts = useMemo<HeartData[]>(() => {
        if (total === 0) return []

        const heartUnits: string[] = []

        visibleBreakdown.forEach(b => {
            const ratio = b.value / total
            const count = Math.max(1, Math.round(ratio * MAX_HEARTS))
            for (let i = 0; i < count; i++) {
                heartUnits.push(b.color)
            }
        })

        const seed = hashString(visibleBreakdown.map((item) => `${item.key}:${item.value}`).join('|'))
        const rand = createSeededRandom(seed)

        // シャッフル
        for (let i = heartUnits.length - 1; i > 0; i--) {
            const j = Math.floor(rand(0, i + 1));
            [heartUnits[i], heartUnits[j]] = [heartUnits[j], heartUnits[i]];
        }

        const RIM_Y = 150
        const moundXMin = 70
        const moundXMax = 250
        const moundYTop = 70
        const moundYBottom = RIM_Y + 18

        const generatedHearts: HeartData[] = heartUnits.map((color, idx) => {
            const x = rand(moundXMin, moundXMax)
            const liftRatio = idx / heartUnits.length
            const centerPull = (x - 160) * (1 - liftRatio) * 0.4
            const px = x - centerPull
            const y = rand(moundYBottom, moundYBottom - (moundYBottom - moundYTop) * Math.min(1, liftRatio + 0.25))
            const scale = rand(0.68, 1.05)
            const rot = rand(-22, 22)
            const delay = (idx * 0.025).toFixed(3)

            return {
                color,
                px,
                y,
                rot,
                scale,
                delay,
                isInsideBox: y >= RIM_Y,
            }
        })

        return generatedHearts
    }, [visibleBreakdown, total])

    if (total === 0) {
        return (
            <div className="gift-panel gift-panel-empty">
                <p className="gift-empty-title">まだ応援ptはありません</p>
                <p className="gift-empty-text">
                    楽曲を聴いたり、ブログを読んだり、ファンレターを送るとここに内訳が表示されます。
                </p>
            </div>
        )
    }

    const hasVisibleHearts = hearts.some(h => !h.isInsideBox || h.y < 150)
    const showBox = hasVisibleHearts && hearts.length > 0

    const hiddenHearts = hearts.filter(h => h.isInsideBox)
    const visibleHearts = showBox ? hearts.filter(h => !h.isInsideBox) : hearts

    return (
        <>
            <div className="gift-panel">
                {helpButton}

                {/* 凡例セクション */}
                <div className="legend">
                    {visibleBreakdown.map((b) => (
                        <Fragment key={b.key}>
                            <svg className="legend-heart" viewBox="0 0 24 24" fill={b.color}>
                                <path d="M12 21s-7.4-4.6-10-9.1C.4 8.7 1.9 5.3 5.3 4.7c2.2-.4 4.1.9 5 2.6.9-1.7 2.8-3 5-2.6 3.4.6 4.9 4 3.3 7.2C19.4 16.4 12 21 12 21z"/>
                            </svg>
                            <span className="legend-label">{b.label}</span>
                            <span className="legend-count">{b.value.toLocaleString('ja-JP')}pt</span>
                        </Fragment>
                    ))}
                </div>

                <div className="gift-divider" aria-hidden="true" />

                {/* SVGアニメーションセクション */}
                <div className="gift-scene">
                    <svg viewBox="0 0 320 260" width="100%" height="100%" style={{ overflow: 'visible' }}>
                        {showBox && (
                            <>
                                <defs>
                                    <clipPath id="boxClip">
                                        <path d="M40 130 L160 158 L280 130 L280 235 L160 263 L40 235 Z"/>
                                    </clipPath>
                                    <linearGradient id="boxFront" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0" stopColor="#ffd3e3"/>
                                        <stop offset="1" stopColor="#ffb9d2"/>
                                    </linearGradient>
                                    <linearGradient id="boxSide" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0" stopColor="#ffc1d8"/>
                                        <stop offset="1" stopColor="#ff9fc0"/>
                                    </linearGradient>
                                </defs>

                                <g clipPath="url(#boxClip)">
                                    {hiddenHearts.map((h, i) => (
                                        <path 
                                            key={`hidden-${i}`}
                                            className="heart-piece" 
                                            d="M12 21s-7.4-4.6-10-9.1C.4 8.7 1.9 5.3 5.3 4.7c2.2-.4 4.1.9 5 2.6.9-1.7 2.8-3 5-2.6 3.4.6 4.9 4 3.3 7.2C19.4 16.4 12 21 12 21z"
                                            fill={h.color}
                                            transform={`translate(${h.px.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.rot.toFixed(1)}) scale(${h.scale.toFixed(2)}) translate(-12 -12)`}
                                            style={{ animationDelay: `${h.delay}s`, opacity: 0 }}
                                        />
                                    ))}
                                </g>

                                <path d="M40 130 L160 158 L280 130 L280 235 L160 263 L40 235 Z" fill="url(#boxFront)"/>
                                <g clipPath="url(#boxClip)" opacity="0.55">
                                    <rect x="40" y="120" width="20" height="150" fill="#ffffff"/>
                                    <rect x="85" y="120" width="20" height="150" fill="#ffffff"/>
                                    <rect x="130" y="120" width="20" height="150" fill="#ffffff"/>
                                    <rect x="175" y="120" width="20" height="150" fill="#ffffff"/>
                                    <rect x="220" y="120" width="20" height="150" fill="#ffffff"/>
                                    <rect x="265" y="120" width="20" height="150" fill="#ffffff"/>
                                </g>
                                <path d="M40 130 L160 158 L280 130" fill="none" stroke="#ff8fb6" strokeWidth="3"/>

                                <g transform="translate(0 -8)">
                                    <path d="M58 70 L165 40 L280 78 L165 112 Z" fill="url(#boxSide)"/>
                                    <path d="M58 70 L165 40 L165 112 Z" fill="#ffd6e7" opacity="0.5"/>
                                    <g opacity="0.5">
                                        <path d="M85 64 L92 80" stroke="#ffffff" strokeWidth="5"/>
                                        <path d="M115 56 L122 73" stroke="#ffffff" strokeWidth="5"/>
                                        <path d="M148 47 L155 65" stroke="#ffffff" strokeWidth="5"/>
                                        <path d="M182 50 L188 67" stroke="#ffffff" strokeWidth="5"/>
                                        <path d="M215 60 L221 77" stroke="#ffffff" strokeWidth="5"/>
                                        <path d="M248 70 L253 86" stroke="#ffffff" strokeWidth="5"/>
                                    </g>
                                    <path d="M58 70 L165 40 L280 78 L165 112 Z" fill="none" stroke="#ff8fb6" strokeWidth="3" strokeLinejoin="round"/>
                                </g>
                            </>
                        )}

                        <g>
                            {visibleHearts.map((h, i) => (
                                <path 
                                    key={`visible-${i}`}
                                    className="heart-piece" 
                                    d="M12 21s-7.4-4.6-10-9.1C.4 8.7 1.9 5.3 5.3 4.7c2.2-.4 4.1.9 5 2.6.9-1.7 2.8-3 5-2.6 3.4.6 4.9 4 3.3 7.2C19.4 16.4 12 21 12 21z"
                                    fill={h.color}
                                    transform={`translate(${h.px.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.rot.toFixed(1)}) scale(${h.scale.toFixed(2)}) translate(-12 -12)`}
                                    style={{ animationDelay: `${h.delay}s`, opacity: 0 }}
                                />
                            ))}
                        </g>

                        <g fill="#ffd9e8">
                            <path d="M28 60 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z" opacity="0.8"/>
                            <path d="M296 150 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" opacity="0.7"/>
                            <path d="M250 30 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" opacity="0.6"/>
                        </g>
                    </svg>
                </div>
            </div>
        </>
    )
}
