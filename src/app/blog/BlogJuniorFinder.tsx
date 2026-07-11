"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type BlogJuniorLink } from "@/lib/blog-data";
import styles from "./Blog.module.css";

type BlogJuniorFinderProps = {
    juniors: BlogJuniorLink[];
};

const ITEMS_PER_SLIDE = 3;

function chunkJuniors(juniors: BlogJuniorLink[]) {
    const chunks: BlogJuniorLink[][] = [];
    for (let index = 0; index < juniors.length; index += ITEMS_PER_SLIDE) {
        chunks.push(juniors.slice(index, index + ITEMS_PER_SLIDE));
    }
    return chunks;
}

export default function BlogJuniorFinder({ juniors }: BlogJuniorFinderProps) {
    const [activeSlide, setActiveSlide] = useState(0);
    const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
    const juniorSlides = useMemo(() => chunkJuniors(juniors), [juniors]);

    useEffect(() => {
        if (juniorSlides.length <= 1) return;

        const timerId = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % juniorSlides.length);
        }, 5200);

        return () => window.clearInterval(timerId);
    }, [juniorSlides.length]);

    if (juniors.length === 0) return null;

    const visibleSlide = Math.min(activeSlide, juniorSlides.length - 1);
    const hasMultipleSlides = juniorSlides.length > 1;

    const showPrevious = () => {
        setActiveSlide((current) => (current - 1 + juniorSlides.length) % juniorSlides.length);
    };

    const showNext = () => {
        setActiveSlide((current) => (current + 1) % juniorSlides.length);
    };

    return (
        <section className={styles.juniorFinder} aria-labelledby="blog-junior-finder-title">
            <div className={styles.juniorFinderHeader}>
                <div>
                    <span className={styles.juniorFinderLabel}>JUNIOR</span>
                    <h2 id="blog-junior-finder-title" className={styles.juniorFinderTitle}>
                        ジュニアから探す
                    </h2>
                </div>
                <Link href="/junior" className={styles.juniorFinderAllLink}>
                    一覧へ
                </Link>
            </div>

            <div className={styles.juniorFinderSlider} aria-label="ブログ投稿者のジュニア">
                {hasMultipleSlides && (
                    <button
                        type="button"
                        className={`${styles.juniorFinderNavButton} ${styles.juniorFinderNavButtonPrev}`}
                        onClick={showPrevious}
                        aria-label="前のジュニア"
                    >
                        ‹
                    </button>
                )}

                <div className={styles.juniorFinderViewport}>
                    <div
                        className={styles.juniorFinderTrack}
                        style={{ transform: `translateX(-${visibleSlide * 100}%)` }}
                    >
                        {juniorSlides.map((slide, slideIndex) => (
                            <div
                                key={slide.map((junior) => junior.id).join("-")}
                                className={styles.juniorFinderSlideGroup}
                                aria-hidden={slideIndex !== visibleSlide}
                            >
                                {slide.map((junior) => (
                                    <Link
                                        key={junior.id}
                                        href={`/junior/${junior.id}?tab=blog`}
                                        className={styles.juniorFinderCard}
                                        tabIndex={slideIndex === visibleSlide ? undefined : -1}
                                    >
                                        <span className={styles.juniorFinderPhoto}>
                                            {junior.imageUrl && !failedImageIds.has(junior.id) ? (
                                                <Image
                                                    src={junior.imageUrl}
                                                    alt={junior.name}
                                                    width={160}
                                                    height={160}
                                                    className={styles.juniorFinderImage}
                                                    onError={() => {
                                                        setFailedImageIds((current) => new Set(current).add(junior.id));
                                                    }}
                                                />
                                            ) : (
                                                <span className={styles.juniorFinderInitials}>{junior.initials}</span>
                                            )}
                                        </span>
                                        <span className={styles.juniorFinderText}>
                                            <span className={styles.juniorFinderName}>{junior.name}</span>
                                            <span className={styles.juniorFinderAffiliation}>{junior.affiliation}</span>
                                            <span className={styles.juniorFinderAction}>ブログを見る</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {hasMultipleSlides && (
                    <button
                        type="button"
                        className={`${styles.juniorFinderNavButton} ${styles.juniorFinderNavButtonNext}`}
                        onClick={showNext}
                        aria-label="次のジュニア"
                    >
                        ›
                    </button>
                )}
            </div>

            {hasMultipleSlides && (
                <div className={styles.juniorFinderDots} aria-label="表示するジュニアグループを選択">
                    {juniorSlides.map((slide, index) => (
                        <button
                            key={slide.map((junior) => junior.id).join("-")}
                            type="button"
                            className={`${styles.juniorFinderDot} ${index === visibleSlide ? styles.juniorFinderDotActive : ""}`}
                            onClick={() => setActiveSlide(index)}
                            aria-label={`${index + 1}番目のジュニアグループを表示`}
                            aria-current={index === visibleSlide ? "true" : undefined}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
