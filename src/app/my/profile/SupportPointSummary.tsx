'use client'

import { useMemo, useState } from 'react'
import GiftPanel, { type BreakdownItem } from '../../../components/GiftPanel/GiftPanel'
import SupportPointHelp, { type SupportPointHelpItem } from './SupportPointHelp'

export type SupportPointTabKey = 'oshi' | 'all'

export type SupportPointSummaryItem = {
    key: SupportPointTabKey
    label: string
    targetLabel: string
    breakdown: BreakdownItem[]
}

type SupportPointSummaryProps = {
    summaries: SupportPointSummaryItem[]
    helpItems: SupportPointHelpItem[]
    defaultTab?: SupportPointTabKey
}

export default function SupportPointSummary({
    summaries,
    helpItems,
    defaultTab = 'oshi',
}: SupportPointSummaryProps) {
    const initialTab = summaries.some((summary) => summary.key === defaultTab)
        ? defaultTab
        : summaries[0]?.key ?? 'oshi'
    const [activeTab, setActiveTab] = useState<SupportPointTabKey>(initialTab)

    const activeSummary = useMemo(
        () => summaries.find((summary) => summary.key === activeTab) ?? summaries[0],
        [activeTab, summaries]
    )
    const total = activeSummary?.breakdown.reduce((sum, item) => sum + item.value, 0) ?? 0

    if (!activeSummary) return null

    return (
        <section className="support-point-summary" aria-label="応援ポイント">
            <div className="support-point-tabs" role="tablist" aria-label="応援ポイントの表示範囲">
                {summaries.map((summary) => (
                    <button
                        key={summary.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === summary.key}
                        className={`support-point-tab ${activeTab === summary.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(summary.key)}
                    >
                        {summary.label}
                    </button>
                ))}
            </div>

            <div className="total-pt-heading">
                <p className="total-pt-label">
                    <span className="name">{activeSummary.targetLabel}</span> の総応援pt数
                </p>
            </div>
            <p className="total-pt-value">
                <span>{total.toLocaleString('ja-JP')}</span>
                <span className="unit">pt</span>
            </p>

            <GiftPanel
                breakdown={activeSummary.breakdown}
                helpButton={<SupportPointHelp items={helpItems} />}
            />
        </section>
    )
}
