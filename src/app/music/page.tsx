"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MusicList from "../../components/MusicList/MusicList";
import PageHeading from "@/components/PageHeading";
import PageShell from "@/components/PageShell";
import PageTabs from "@/components/PageTabs";
import { type Song } from "../../stores/playerStore";
import styles from "./MyComponent.module.css"; // スタイルのインポート

type ModalTab = "personal" | "group";

type MusicSearchTarget = {
    id: string;
    name: string;
    type: "junior" | "group";
    imageUrl: string | null;
    groupName?: string | null;
    affiliation?: string;
    description?: string | null;
    isOshi?: boolean;
};

type JuniorApiItem = {
    id: string;
    name: string;
    imageUrl: string | null;
    groupName: string | null;
    affiliation: string;
    isOshi?: boolean;
};

type GroupApiItem = {
    id: string;
    name: string;
    imageUrl: string | null;
    description: string | null;
};

const MODAL_TABS = [
    { key: "personal", label: "個人" },
    { key: "group", label: "グループ" },
] as const;

export default function Music() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<string>("group");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedTarget, setSelectedTarget] = useState<MusicSearchTarget | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<ModalTab>("personal");
    const [modalQuery, setModalQuery] = useState("");
    const [modalItems, setModalItems] = useState<MusicSearchTarget[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const closeSearchModal = () => {
        setIsSearchModalOpen(false);
        setModalQuery("");
    };

    const handleSelectTarget = (target: MusicSearchTarget) => {
        setSelectedTarget(target);
        setSearchQuery(target.name);
        closeSearchModal();
    };

    const handleSearchInputChange = (value: string) => {
        setSelectedTarget(null);
        setSearchQuery(value);
    };

    const handleClearTarget = () => {
        setSelectedTarget(null);
        setSearchQuery("");
    };

    useEffect(() => {
        const fetchSongs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery.trim()) {
                    params.set("q", searchQuery.trim());
                }
                if (sortBy) {
                    params.set("sort", sortBy);
                }

                const res = await fetch(`/api/songs?${params.toString()}`);
                if (!res.ok) {
                    throw new Error("楽曲の取得に失敗しました。");
                }
                const data = await res.json();
                setSongs(data.songs || []);
                setError(null);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "エラーが発生しました。");
            } finally {
                setLoading(false);
            }
        };

        // 入力のチャタリング防止用デバウンス（300ms）
        const timer = setTimeout(() => {
            fetchSongs();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, sortBy]);

    useEffect(() => {
        if (!isSearchModalOpen) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setModalLoading(true);
            setModalError(null);

            try {
                const params = new URLSearchParams({
                    tab: modalTab,
                    sort: "fifty",
                });

                if (modalTab === "personal") {
                    params.set("prioritizeOshi", "true");
                }

                if (modalQuery.trim()) {
                    params.set("q", modalQuery.trim());
                }

                const res = await fetch(`/api/juniors?${params.toString()}`, {
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error("候補の取得に失敗しました。");
                }

                const data: {
                    juniors?: JuniorApiItem[];
                    groups?: GroupApiItem[];
                    error?: string;
                } = await res.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                const items: MusicSearchTarget[] = modalTab === "personal"
                    ? (data.juniors || []).map((junior) => ({
                        id: junior.id,
                        name: junior.name,
                        type: "junior",
                        imageUrl: junior.imageUrl,
                        groupName: junior.groupName,
                        affiliation: junior.affiliation,
                        isOshi: junior.isOshi,
                    }))
                    : (data.groups || []).map((group) => ({
                        id: group.id,
                        name: group.name,
                        type: "group",
                        imageUrl: group.imageUrl,
                        description: group.description,
                    }));

                setModalItems(items);
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                setModalError(err instanceof Error ? err.message : "エラーが発生しました。");
                setModalItems([]);
            } finally {
                setModalLoading(false);
            }
        }, 200);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [isSearchModalOpen, modalQuery, modalTab]);

    useEffect(() => {
        if (!isSearchModalOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeSearchModal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSearchModalOpen]);

    return (
        <PageShell className={styles.container}>
            <PageHeading title="Music" />

            {/* 検索ボックスとドロップダウンのラッパー */}
            <div className={styles.searchContainer}>
                <div className={styles.toolbar}>
                    {/* 検索ボックス */}
                    <div className={styles.searchBox}>
                        <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="#bbb" strokeWidth="2" aria-hidden="true">
                            <circle cx="9" cy="9" r="7"/>
                            <path d="M14.5 14.5 L20 20" strokeLinecap="round"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="曲名・ジュニア名・グループ名で検索"
                            aria-label="検索ワード"
                            value={searchQuery}
                            onChange={(e) => handleSearchInputChange(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className={styles.targetSearchButton}
                        onClick={() => setIsSearchModalOpen(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="9" cy="9" r="7"/>
                            <path d="M14.5 14.5 L20 20" strokeLinecap="round"/>
                        </svg>
                        ジュニア / グループから探す
                    </button>

                    {/* 右上のドロップダウンリスト */}
                    <select
                        className={styles.dropdown}
                        aria-label="並び替え"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="group">グループ順</option>
                        <option value="fifty">50音順</option>
                        <option value="new">新着順</option>
                        <option value="popular">人気順</option>
                    </select>
                </div>

                {selectedTarget && (
                    <div className={styles.selectedTarget}>
                        <span className={styles.selectedTargetLabel}>
                            {selectedTarget.type === "group" ? "グループ" : "個人"}: {selectedTarget.name}
                        </span>
                        <button
                            type="button"
                            className={styles.clearTargetButton}
                            onClick={handleClearTarget}
                            aria-label="選択した検索条件を解除"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            {/* MUSIC LIST */}
            {loading ? (
                <div className={styles.stateMessage}>
                    読み込み中...
                </div>
            ) : error ? (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            ) : songs.length === 0 ? (
                <div className={styles.emptyState}>
                    条件に合う楽曲が見つかりませんでした。
                </div>
            ) : (
                <MusicList songs={songs} />
            )}

            {isSearchModalOpen && (
                <div className={styles.modalOverlay} onClick={closeSearchModal}>
                    <div
                        className={styles.searchModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="music-search-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h2 id="music-search-modal-title">ジュニア / グループから探す</h2>
                            <button
                                type="button"
                                className={styles.modalCloseButton}
                                onClick={closeSearchModal}
                                aria-label="閉じる"
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.modalSearchBox}>
                            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="#bbb" strokeWidth="2" aria-hidden="true">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M14.5 14.5 L20 20" strokeLinecap="round"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="名前で候補を絞り込み"
                                aria-label="候補の絞り込み"
                                value={modalQuery}
                                onChange={(e) => setModalQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <PageTabs
                            items={MODAL_TABS}
                            activeKey={modalTab}
                            ariaLabel="候補の種類"
                            onChange={setModalTab}
                            className={styles.modalTabs}
                        />

                        {modalLoading ? (
                            <div className={styles.modalState}>候補を読み込み中...</div>
                        ) : modalError ? (
                            <div className={styles.modalError}>{modalError}</div>
                        ) : modalItems.length === 0 ? (
                            <div className={styles.modalState}>候補が見つかりませんでした。</div>
                        ) : (
                            <div className={styles.modalGrid}>
                                {modalItems.map((item) => (
                                    <button
                                        type="button"
                                        key={`${item.type}-${item.id}`}
                                        className={styles.selectorCard}
                                        onClick={() => handleSelectTarget(item)}
                                    >
                                        <span className={styles.selectorImageWrap}>
                                            {item.imageUrl ? (
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={`${item.name}の画像`}
                                                    width={56}
                                                    height={56}
                                                    className={styles.selectorImage}
                                                />
                                            ) : (
                                                <span className={styles.selectorFallback}>
                                                    {item.name.slice(0, 1)}
                                                </span>
                                            )}
                                        </span>
                                        <span className={styles.selectorText}>
                                            <span className={styles.selectorName}>{item.name}</span>
                                            <span className={styles.selectorMeta}>
                                                {item.type === "junior"
                                                    ? `${item.isOshi ? "推し / " : ""}${item.affiliation || "無所属"}`
                                                    : "グループ"}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageShell>
    );
}
