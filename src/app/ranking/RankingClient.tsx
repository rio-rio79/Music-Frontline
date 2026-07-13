"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeading from "@/components/PageHeading";
import PageShell from "@/components/PageShell";
import PageTabs from "@/components/PageTabs";
import { ChevronDownSvg, ChevronRightSvg, CrownSvg } from "@/components/Svgs";

type RankingCategory = "group_affiliated" | "independent";

export type RankingItem = {
  rank: number;
  category: RankingCategory;
  juniorId: string;
  name: string;
  imageUrl: string;
  affiliation: string;
  totalPoints: number;
  isOshi?: boolean;
};

type RankingClientProps = {
  rankings: RankingItem[];
};

const PAGE_SIZE = 10;

const TABS: { key: RankingCategory; label: string; empty: string }[] = [
  {
    key: "group_affiliated",
    label: "グループ所属組",
    empty: "グループ所属組のランキングデータはまだありません。",
  },
  {
    key: "independent",
    label: "無所属組",
    empty: "無所属組のランキングデータはまだありません。",
  },
];

function renderRankMarker(rank: number) {
  if (rank >= 1 && rank <= 3) {
    return <CrownSvg rank={rank} />;
  }
  return <span>{rank}</span>;
}

export default function RankingClient({ rankings }: RankingClientProps) {
  const [currentTab, setCurrentTab] = useState<RankingCategory>("group_affiliated");
  const [visibleCounts, setVisibleCounts] = useState<Record<RankingCategory, number>>({
    group_affiliated: PAGE_SIZE,
    independent: PAGE_SIZE,
  });

  const groupedRankings = useMemo(() => ({
    group_affiliated: rankings.filter((item) => item.category === "group_affiliated"),
    independent: rankings.filter((item) => item.category === "independent"),
  }), [rankings]);

  const currentTabInfo = TABS.find((tab) => tab.key === currentTab)!;
  const currentList = groupedRankings[currentTab];
  const visibleCount = visibleCounts[currentTab];
  const visibleRankings = currentList.slice(0, visibleCount);
  const hasMore = visibleCount < currentList.length;

  const handleMoreClick = () => {
    setVisibleCounts((current) => ({
      ...current,
      [currentTab]: Math.min(current[currentTab] + PAGE_SIZE, currentList.length),
    }));
  };

  return (
    <PageShell className="ranking-page">
      <style>{`
        .ranking-page {
          --pink: #e8447a;
          --pink-soft: #fff0f6;
          --ink: #22202a;
          --muted: #77717d;
          --line: #ece6ee;
          --surface: #ffffff;
          --surface-soft: #faf8fb;
          color: var(--ink);
          box-sizing: border-box;
        }

        .ranking-page * {
          box-sizing: border-box;
        }

        .ranking-heading p {
          margin: -14px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .ranking-meta {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin: 0 0 12px;
          color: var(--muted);
          font-size: 12px;
        }

        .ranking-list {
          border-top: 1px solid var(--line);
        }

        .ranking-row {
          display: grid;
          grid-template-columns: 42px 52px minmax(0, 1fr) auto 20px;
          align-items: center;
          gap: 12px;
          padding: 16px 2px;
          border-bottom: 1px solid var(--line);
          color: inherit;
          text-decoration: none;
        }

        .ranking-row:hover {
          background: var(--surface-soft);
        }

        .ranking-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .ranking-rank svg {
          display: block;
        }

        .ranking-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          background: #e6e1e8;
        }

        .ranking-name {
          min-width: 0;
        }

        .ranking-name-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ranking-name strong {
          flex: 0 1 auto;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 16px;
          line-height: 1.35;
        }

        .ranking-name span {
          display: block;
          margin-top: 3px;
          color: #111;
          font-size: 12px;
        }

        .oshi-badge {
          flex: 0 0 auto;
          padding: 2px 8px;
          border-radius: 10px;
          background: #e8b64f;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        span.oshi-badge {
          color: #fff;
        }

        .ranking-score {
          text-align: right;
          white-space: nowrap;
          color: var(--pink);
          font-size: 20px;
          font-weight: 900;
        }

        .ranking-score span {
          margin-left: 2px;
          font-size: 12px;
          font-weight: 800;
        }

        .ranking-chevron {
          color: var(--muted);
        }

        .ranking-empty {
          padding: 56px 14px;
          border: 1px dashed var(--line);
          border-radius: 12px;
          color: var(--muted);
          text-align: center;
          font-size: 14px;
          line-height: 1.7;
        }

        .ranking-more {
          display: flex;
          justify-content: center;
          margin-top: 26px;
        }

        .ranking-more button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 26px;
          border: 1.5px solid var(--pink);
          border-radius: 999px;
          background: #fff;
          color: var(--pink);
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .ranking-more button:hover {
          background: var(--pink-soft);
        }

        @media (max-width: 560px) {
          .ranking-row {
            grid-template-columns: 34px 46px minmax(0, 1fr) 18px;
          }

          .ranking-avatar {
            width: 46px;
            height: 46px;
          }

          .ranking-score {
            grid-column: 3 / 4;
            text-align: left;
            margin-top: 4px;
            font-size: 18px;
          }

          .ranking-chevron {
            grid-column: 4 / 5;
            grid-row: 1 / 3;
          }
        }

      `}</style>

      <div className="ranking-heading">
        <PageHeading title="Ranking" />
        <p>応援行動から集計したジュニア個人の総合ランキングです。</p>
      </div>

      <PageTabs
        items={TABS}
        activeKey={currentTab}
        ariaLabel="ランキングカテゴリ"
        onChange={setCurrentTab}
      />

      <div className="ranking-meta">
        <span>{currentTabInfo.label} / {currentList.length}人</span>
      </div>

      {visibleRankings.length === 0 ? (
        <div className="ranking-empty">{currentTabInfo.empty}</div>
      ) : (
        <div className="ranking-list">
          {visibleRankings.map((item) => (
            <Link className="ranking-row" href={`/junior/${item.juniorId}?from=ranking`} key={`${item.category}-${item.juniorId}`}>
              <div className="ranking-rank">{renderRankMarker(item.rank)}</div>
              <img className="ranking-avatar" src={item.imageUrl} alt={`${item.name}の画像`} />
              <div className="ranking-name">
                <div className="ranking-name-container">
                  <strong>{item.name}</strong>
                  {item.isOshi && <span className="oshi-badge">推し</span>}
                </div>
                <span>{item.affiliation}</span>
              </div>
              <div className="ranking-score">
                {item.totalPoints.toLocaleString("ja-JP")}<span>pt</span>
              </div>
              <div className="ranking-chevron" aria-hidden="true">
                <ChevronRightSvg />
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="ranking-more">
          <button type="button" onClick={handleMoreClick}>
            <span>もっと見る</span>
            <ChevronDownSvg />
          </button>
        </div>
      )}
    </PageShell>
  );
}
