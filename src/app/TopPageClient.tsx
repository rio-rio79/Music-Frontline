"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import styles from "./TopPage.module.css";

export type FeaturedTabKey = "music" | "blog" | "ranking";

export type FeaturedItem = {
  id: string;
  title: string;
  sub: string;
  meta: string;
  href: string;
  imageUrl: string | null;
  imageLabel: string;
  badge: string;
  rank?: number;
};

type TopPageClientProps = {
  featuredItems: Record<FeaturedTabKey, FeaturedItem[]>;
  showOshiCard: boolean;
  showPlanCard: boolean;
  showLimitedBlogBenefit: boolean;
  planCtaLabel: string;
};

const FEATURED_TABS: {
  key: FeaturedTabKey;
  label: string;
  moreLabel: string;
  href: string;
  empty: string;
}[] = [
  {
    key: "music",
    label: "人気楽曲",
    moreLabel: "楽曲一覧を見る",
    href: "/music",
    empty: "人気楽曲はまだありません。",
  },
  {
    key: "blog",
    label: "新着ブログ",
    moreLabel: "ブログ一覧を見る",
    href: "/blog",
    empty: "新着ブログはまだありません。",
  },
  {
    key: "ranking",
    label: "ランキング上位",
    moreLabel: "ランキングを見る",
    href: "/ranking",
    empty: "ランキングデータはまだありません。",
  },
];

function IconMusic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18V5l11-2v13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="16" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5v14l12-7z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m19.5 19.5-3.8-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 14v3.5M9 20.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBlog() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20s-7.5-4.6-9.3-9C1.4 7.6 3.5 4.5 6.8 4.5c2 0 3.6 1.1 4.4 2.7l.8 1.6.8-1.6c.8-1.6 2.4-2.7 4.4-2.7 3.3 0 5.4 3.1 4.1 6.5-1.8 4.4-9.3 9-9.3 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconComment() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5c-1.2 0-2.4-.3-3.4-.8L4 19.5l1.4-4.4A7.5 7.5 0 1 1 20 11.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3.5 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconLetter() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 6.5 12 13l8-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconCrown() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5 8 12l4-6 4 6 4-3.5V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V8.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function ActionChip({
  children,
  icon,
  side,
}: {
  children: string;
  icon: ReactNode;
  side: "left" | "right";
}) {
  return (
    <div className={styles.actionConnector}>
      {side === "right" && <i aria-hidden="true" />}
      <span className={styles.actionChip}>
        {icon}
        {children}
      </span>
      {side === "left" && <i aria-hidden="true" />}
    </div>
  );
}

function FeaturedCard({ item }: { item: FeaturedItem }) {
  const isRanking = typeof item.rank === "number";

  return (
    <Link className={styles.featuredCard} href={item.href}>
      <span className={isRanking ? `${styles.rankBadge} ${styles[`rank${item.rank}`]}` : styles.newBadge}>
        {item.badge}
      </span>
      <span className={styles.featuredThumb}>
        {item.imageUrl ? (
          <Image className={styles.featuredImage} src={item.imageUrl} alt="" width={52} height={52} />
        ) : (
          <span>{item.imageLabel}</span>
        )}
      </span>
      <span className={styles.featuredText}>
        <strong>{item.title}</strong>
        <small>{item.sub}</small>
      </span>
      <span className={styles.featuredMeta}>{item.meta}</span>
    </Link>
  );
}

export default function TopPageClient({
  featuredItems,
  showOshiCard,
  showPlanCard,
  showLimitedBlogBenefit,
  planCtaLabel,
}: TopPageClientProps) {
  const [currentTab, setCurrentTab] = useState<FeaturedTabKey>("music");
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!autoRotate) return;

    const timer = window.setInterval(() => {
      setCurrentTab((current) => {
        const currentIndex = FEATURED_TABS.findIndex((tab) => tab.key === current);
        const nextIndex = (currentIndex + 1) % FEATURED_TABS.length;
        return FEATURED_TABS[nextIndex].key;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [autoRotate]);

  const currentTabInfo = useMemo(
    () => FEATURED_TABS.find((tab) => tab.key === currentTab) ?? FEATURED_TABS[0],
    [currentTab],
  );
  const currentItems = featuredItems[currentTab] ?? [];

  const handleTabClick = (tab: FeaturedTabKey) => {
    setCurrentTab(tab);
    setAutoRotate(false);
  };

  return (
    <PageShell className={styles.topPage}>
      <section className={styles.hero} aria-labelledby="top-hero-title">
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>♪ ジュニア応援ミュージックアプリ</span>
          <div>
            <h1 id="top-hero-title">MUSIC FRONTLINE</h1>
            <p>きょうの応援が、ジュニアの明日をつくる。</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/music">
              <IconPlay />
              楽曲を聴く
            </Link>
            <Link className={styles.secondaryButton} href="/ranking">
              <IconTrophy />
              ランキングを見る
            </Link>
            <Link className={styles.secondaryButton} href="/junior">
              <IconSearch />
              ジュニアを探す
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.sectionTitleRow}>
          <h2 id="featured-title">注目コンテンツ</h2>
          <span>FEATURED</span>
        </div>

        <div className={styles.featuredTabs} role="tablist" aria-label="注目コンテンツ">
          {FEATURED_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={currentTab === tab.key ? styles.activeTab : ""}
              role="tab"
              aria-selected={currentTab === tab.key}
              onClick={() => handleTabClick(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.featuredList}>
          {currentItems.length > 0 ? (
            currentItems.map((item) => <FeaturedCard item={item} key={`${currentTab}-${item.id}`} />)
          ) : (
            <p className={styles.emptyFeatured}>{currentTabInfo.empty}</p>
          )}
          <Link className={styles.moreLink} href={currentTabInfo.href}>
            {currentTabInfo.moreLabel} →
          </Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="point-title">
        <div className={styles.sectionTitleRow}>
          <h2 id="point-title">応援ポイントのしくみ</h2>
          <span>HOW IT WORKS</span>
        </div>

        <div className={styles.pointCard}>
          <div className={styles.pointDiagram}>
            <div className={styles.actionColumn}>
              <ActionChip icon={<IconMusic />} side="left">楽曲を聴く</ActionChip>
              <ActionChip icon={<IconBlog />} side="left">ブログを読む</ActionChip>
              <ActionChip icon={<IconHeart />} side="left">いいね</ActionChip>
            </div>

            <div className={styles.pointCircle}>
              <IconHeart />
              <strong>応援ポイント</strong>
              <span>応援するほどたまる</span>
            </div>

            <div className={styles.actionColumn}>
              <ActionChip icon={<IconComment />} side="right">コメント</ActionChip>
              <ActionChip icon={<IconStar />} side="right">推し登録</ActionChip>
              <ActionChip icon={<IconLetter />} side="right">ファンレター</ActionChip>
            </div>
          </div>

          <div className={styles.downFlow} aria-hidden="true">
            <i />
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className={styles.rankingBar}>
            <IconTrophy />
            <strong>ランキングに反映</strong>
            <span>みんなの応援でジュニアの順位が決まる</span>
          </div>
        </div>
      </section>

      {showOshiCard && (
        <section className={styles.oshiCard} aria-labelledby="oshi-card-title">
          <span className={styles.oshiIcon}>
            <IconHeart />
            <i aria-hidden="true">＋</i>
          </span>
          <div>
            <h2 id="oshi-card-title">まだ推しが登録されていません</h2>
            <p>気になるジュニアを見つけて、あなたの応援を届けよう。</p>
          </div>
          <Link className={styles.oshiButton} href="/junior">
            <IconSearch />
            ジュニアを探す
          </Link>
        </section>
      )}

      {showPlanCard && (
        <section className={styles.planCard} aria-labelledby="plan-card-title">
          <span className={styles.planIcon}>
            <IconCrown />
          </span>
          <div className={styles.planContent}>
            <p>PLAN</p>
            <h2 id="plan-card-title">プランをアップグレードして、応援をもっと届けよう</h2>
            <ul>
              {showLimitedBlogBenefit && <li>限定ブログの本文が読める</li>}
              <li>再生・閲覧・いいね・コメントの応援ポイント倍率がアップ</li>
              <li>推しへの応援をもっと届けられる</li>
            </ul>
          </div>
          <Link className={styles.planButton} href="/my/profile?modal=plan">
            {planCtaLabel} →
          </Link>
        </section>
      )}
    </PageShell>
  );
}
