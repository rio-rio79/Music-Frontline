"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./JuniorList.module.css";
import Image from "next/image";
import PageHeading from "@/components/PageHeading";
import PageShell from "@/components/PageShell";
import PageTabs from "@/components/PageTabs";
import { Heart } from "@/components/Svgs";
import { useLikeStore } from "@/stores/likeStore";

// グラデーションの定義（oshi_list.html から移植）
const gradients = [
  "linear-gradient(160deg,#7c6fd6 0%,#e79fc4 55%,#f6c9d9 100%)",
  "linear-gradient(160deg,#8b7fe0 0%,#d98fc0 55%,#f3c6cf 100%)",
  "linear-gradient(160deg,#6f8fd6 0%,#c79fd6 55%,#f0cfe0 100%)",
  "linear-gradient(160deg,#9a7bd0 0%,#e08aa8 55%,#f7c9c9 100%)",
  "linear-gradient(160deg,#5f7fce 0%,#a888d6 55%,#e7b9d6 100%)",
  "linear-gradient(160deg,#7c6fd6 0%,#d67ca0 55%,#f6b9c9 100%)",
];

// IDから決定論的にグラデーションインデックスを選択するハッシュ関数
const getGradientIndex = (id: string, length: number) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % length;
};

const personIconSvg = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.6 0-9.8 2.4-9.8 6.9v1.6h19.6v-1.6c0-4.5-6.2-6.9-9.8-6.9z" />
  </svg>
);

const JUNIOR_LIST_TABS = [
  { key: "personal", label: "個人" },
  { key: "group", label: "グループ" },
] as const;

export interface JuniorItem {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  score: number;
  groupName: string | null;
}

export interface GroupItem {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
}

interface JuniorListClientProps {
  initialJuniors: JuniorItem[];
  initialGroups: GroupItem[];
}

export default function JuniorListClient({ initialJuniors, initialGroups }: JuniorListClientProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new");

  const [juniors, setJuniors] = useState<JuniorItem[]>(initialJuniors);
  const [groups, setGroups] = useState<GroupItem[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJuniorLikes = useLikeStore((state) => state.fetchJuniorLikes);
  const toggleJuniorLike = useLikeStore((state) => state.toggleJuniorLike);
  const likedJuniorIds = useLikeStore((state) => state.likedJuniorIds);

  // 初回マウント時にお気に入り情報を取得
  useEffect(() => {
    fetchJuniorLikes();
  }, [fetchJuniorLikes]);

  // マウント後のAPI再取得判定用（初回読み込み時はサーバーサイドから渡された initial データを表示）
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("tab", activeTab);
        params.set("sort", sortBy);
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }

        const res = await fetch(`/api/juniors?${params.toString()}`);
        if (!res.ok) {
          throw new Error("データの取得に失敗しました。");
        }
        const data = await res.json();
        if (activeTab === "personal") {
          setJuniors(data.juniors || []);
        } else {
          setGroups(data.groups || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    // 入力のチャタリング防止用デバウンス（300ms）
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, activeTab]);

  // タブが切り替わったときに検索クエリとソートを初期化
  const handleTabChange = (tab: "personal" | "group") => {
    setActiveTab(tab);
    setSearchQuery("");
    setSortBy("new");
    if (tab === "personal") {
      setJuniors(initialJuniors);
    } else {
      setGroups(initialGroups);
    }
  };

  return (
    <PageShell className={styles.page}>
      <PageHeading title="Junior" />

      <PageTabs
        items={JUNIOR_LIST_TABS}
        activeKey={activeTab}
        ariaLabel="ジュニア表示種別"
        onChange={handleTabChange}
      />

      {/* 検索とソート */}
      <div className={styles.searchContainer}>
        <select
          className={styles.dropdown}
          aria-label="並び替え"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="new">登録日が新しい順</option>
          <option value="fifty">50音順</option>
          {activeTab === "personal" && <option value="popular">人気順</option>}
        </select>

        <div className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="#bbb" strokeWidth="2">
            <circle cx="9" cy="9" r="7" />
            <path d="M14.5 14.5 L20 20" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder={activeTab === "personal" ? "ジュニア名、グループ名で検索" : "グループ名で検索"}
            aria-label="検索ワード"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>
          読み込み中...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          {error}
        </div>
      ) : (
        <div className={styles.grid}>
          {activeTab === "personal" ? (
            juniors.map((junior) => {
              // IDベースで一貫したグラデーション背景を決定論的に割り当てる
              const gradIndex = getGradientIndex(junior.id, gradients.length);
              const gradientStyle = {
                background: gradients[gradIndex],
              };

              return (
                <Link href={`/junior/${junior.id}`} key={junior.id} className={styles.card}>
                  <div className={styles.cardPhoto} style={junior.imageUrl ? undefined : gradientStyle}>
                    {junior.imageUrl ? (
                      <Image
                        src={junior.imageUrl}
                        alt={junior.name}
                        fill
                        sizes="(max-width: 480px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      personIconSvg
                    )}
                  </div>
                  <p className={styles.cardName}>{junior.name}</p>
                  <div className={styles.cardPointsRow}>
                    <span className={styles.cardPoints}>
                      推しポイント <b>{junior.score.toLocaleString()}pt</b>
                    </span>
                    <button
                      type="button"
                      className={styles.heartBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleJuniorLike(junior.id);
                      }}
                      aria-label="お気に入り登録・解除"
                    >
                      <Heart filled={likedJuniorIds.includes(junior.id)} />
                    </button>
                  </div>
                </Link>
              );
            })
          ) : (
            groups.map((group) => {
              const gradIndex = getGradientIndex(group.id, gradients.length);
              const gradientStyle = {
                background: gradients[gradIndex],
              };

              return (
                <Link href={`/group/${group.id}`} key={group.id} className={styles.card}>
                  <div className={styles.cardPhoto} style={group.imageUrl ? undefined : gradientStyle}>
                    {group.imageUrl ? (
                      <Image
                        src={group.imageUrl}
                        alt={group.name}
                        fill
                        sizes="(max-width: 480px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      personIconSvg
                    )}
                  </div>
                  <p className={styles.cardName}>{group.name}</p>
                  <div className={styles.cardPointsRow}>
                    <span className={styles.cardPoints} style={{ fontSize: "9px" }}>
                      {group.description || "グループ"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </PageShell>
  );
}
