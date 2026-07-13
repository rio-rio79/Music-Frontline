"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import PageHeading from "@/components/PageHeading";
import PageShell from "@/components/PageShell";
import PageTabs, { type PageTabItem } from "@/components/PageTabs";
import { sendFanLetter } from "./actions";
import styles from "./page.module.css";

type Tab = "compose" | "history";

export type TipJunior = {
  id: string;
  name: string;
  nameKana: string;
  imageUrl: string | null;
  affiliation: string;
};

type TipPageClientProps = {
  juniors: TipJunior[];
  initialOshiId: string | null;
  initialHistory: FanLetterHistoryEntry[];
  defaultJuniorId?: string;
};

type HistoryEntry = {
  id: string;
  juniorId: string;
  date: string;
  message: string;
  amount: number;
};

export type FanLetterHistoryEntry = {
  id: string;
  juniorId: string;
  amount: number;
  message: string;
  createdAt: string;
};

const PRESET_AMOUNTS = [100, 500, 1000, 3000, 5000, 10000, 50000] as const;
const DEFAULT_TIER_INDEX = 2;
const MIN_AMOUNT = PRESET_AMOUNTS[0];
const MAX_AMOUNT = PRESET_AMOUNTS[PRESET_AMOUNTS.length - 1];
const PAGE_SIZE = 5;

function initials(name: string) {
  return name.replace(/\s/g, "").slice(0, 2);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function nearestTierIndex(amount: number) {
  return PRESET_AMOUNTS.reduce((nearest, preset, index) =>
    Math.abs(preset - amount) < Math.abs(PRESET_AMOUNTS[nearest] - amount) ? index : nearest, 0);
}

function amountToPercent(amount: number) {
  if (amount <= MIN_AMOUNT) return 0;
  if (amount >= MAX_AMOUNT) return 100;

  for (let index = 0; index < PRESET_AMOUNTS.length - 1; index += 1) {
    const lower = PRESET_AMOUNTS[index];
    const upper = PRESET_AMOUNTS[index + 1];
    if (amount >= lower && amount <= upper) {
      const segmentProgress = (amount - lower) / (upper - lower);
      return ((index + segmentProgress) / (PRESET_AMOUNTS.length - 1)) * 100;
    }
  }

  return 0;
}

function JuniorAvatar({ junior, sizes }: { junior: TipJunior; sizes: string }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!junior.imageUrl || hasImageError) {
    return <>{initials(junior.name)}</>;
  }

  return (
    <Image
      src={junior.imageUrl}
      alt=""
      fill
      sizes={sizes}
      className={styles.avatarImage}
      unoptimized
      onError={() => setHasImageError(true)}
    />
  );
}

export default function TipPageClient({ juniors, initialOshiId, initialHistory, defaultJuniorId }: TipPageClientProps) {
  const oshiId = juniors.some((junior) => junior.id === initialOshiId) ? initialOshiId : null;
  const initialEntries = initialHistory.map<HistoryEntry>((entry) => ({
    id: entry.id,
    juniorId: entry.juniorId,
    date: formatDate(entry.createdAt),
    message: entry.message,
    amount: entry.amount,
  }));
  const [activeTab, setActiveTab] = useState<Tab>("compose");
  const [currentJuniorId, setCurrentJuniorId] = useState<string | null>(
    defaultJuniorId && juniors.some((junior) => junior.id === defaultJuniorId) ? defaultJuniorId : oshiId
  );
  const [message, setMessage] = useState("");
  const [tierIndex, setTierIndex] = useState(DEFAULT_TIER_INDEX);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountDraft, setAmountDraft] = useState("");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(initialEntries);
  const [historyJuniorId, setHistoryJuniorId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentJunior = juniors.find((junior) => junior.id === currentJuniorId) ?? null;
  const oshiJunior = juniors.find((junior) => junior.id === oshiId) ?? null;
  const amount = customAmount ?? PRESET_AMOUNTS[tierIndex];
  const sliderPercent = amountToPercent(amount);
  const filteredHistory = historyJuniorId === "all"
    ? historyEntries
    : historyEntries.filter((entry) => entry.juniorId === historyJuniorId);
  const totalAmount = filteredHistory.reduce((sum, item) => sum + item.amount, 0);
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const visibleHistory = filteredHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const canSend = currentJunior !== null && message.trim().length > 0;

  const juniorsById = useMemo(
    () => new Map(juniors.map((junior) => [junior.id, junior])),
    [juniors],
  );

  const filteredJuniors = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("ja");
    return juniors
      .filter((junior) => !query ||
        `${junior.name} ${junior.nameKana} ${junior.affiliation}`.toLocaleLowerCase("ja").includes(query))
      .sort((left, right) => {
        if (left.id === oshiId) return -1;
        if (right.id === oshiId) return 1;
        return left.nameKana.localeCompare(right.nameKana, "ja") || left.name.localeCompare(right.name, "ja");
      });
  }, [juniors, oshiId, searchQuery]);

  const selectJunior = (juniorId: string) => {
    setCurrentJuniorId(juniorId);
    setIsModalOpen(false);
  };

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  };

  const beginAmountEdit = () => {
    setAmountDraft(String(amount));
    setIsEditingAmount(true);
  };

  const cancelAmountEdit = () => {
    setAmountDraft("");
    setIsEditingAmount(false);
  };

  const commitAmount = () => {
    const parsedAmount = Number(amountDraft);
    const nextAmount = Number.isFinite(parsedAmount) && amountDraft !== ""
      ? Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, Math.round(parsedAmount)))
      : amount;
    setCustomAmount(nextAmount);
    setTierIndex(nearestTierIndex(nextAmount));
    setAmountDraft("");
    setIsEditingAmount(false);
  };

  const openConfirmation = () => {
    if (!canSend || !currentJunior || !currentJuniorId) return;
    setFormError("");
    setIsConfirmOpen(true);
  };

  const handleSend = () => {
    if (!canSend || !currentJunior || !currentJuniorId) return;

    startTransition(async () => {
      const result = await sendFanLetter({
        juniorId: currentJuniorId,
        amount,
        message,
      });

      if (result.status === "error") {
        setFormError(result.message);
        return;
      }

      const entry: HistoryEntry = {
        id: result.entry.id,
        juniorId: currentJuniorId,
        date: formatDate(result.entry.createdAt),
        message: result.entry.message,
        amount: result.entry.amount,
      };

      setHistoryEntries((current) => [entry, ...current]);
      setMessage("");
      setTierIndex(DEFAULT_TIER_INDEX);
      setCustomAmount(null);
      setCurrentPage(1);
      setIsConfirmOpen(false);
      setFormError("");
      showToast(`${currentJunior.name}さんにファンレターを送信しました（¥${entry.amount.toLocaleString()}）`);
    });
  };

  const tabItems = useMemo<PageTabItem<Tab>[]>(
    () => [
      { key: "compose", label: "メッセージ作成" },
      { key: "history", label: `送信履歴（${historyEntries.length}）` },
    ],
    [historyEntries.length],
  );

  return (
    <PageShell className={styles.page}>
      <PageHeading title="FanLetter" />

      <PageTabs
        items={tabItems}
        activeKey={activeTab}
        ariaLabel="ファンレターメニュー"
        onChange={setActiveTab}
      />

      {activeTab === "compose" ? (
        <div role="tabpanel">
          <div className={styles.hero}>
            <button type="button" className={styles.heroSelector} onClick={() => setIsModalOpen(true)}>
              {currentJunior ? (
                <>
                  <span className={styles.heroThumb}>
                    <JuniorAvatar
                      key={currentJunior.imageUrl ?? currentJunior.id}
                      junior={currentJunior}
                      sizes="72px"
                    />
                  </span>
                  <span className={styles.heroBody}>
                    <span className={styles.group}>{currentJunior.affiliation}</span>
                    <span className={styles.nameRow}>
                      <span className={styles.name}>{currentJunior.name}</span>
                      {currentJunior.id === oshiId && <span className={styles.oshiTag}>推し</span>}
                    </span>
                    <span className={styles.switchHint}>タップして送る相手を変更 ›</span>
                  </span>
                </>
              ) : (
                <span className={styles.emptyRecipient}>送るジュニアを選択してください</span>
              )}
            </button>
          </div>

          <div className={styles.sectionLabel}><span>・ ・ ・</span>LETTER<span>・ ・ ・</span></div>
          <div className={styles.composeCard}>
            <div className={styles.messageZone}>
              <textarea
                className={styles.messageInput}
                maxLength={300}
                placeholder="メッセージを入力してください"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <div className={styles.charCount}>{message.length} / 300</div>
            </div>

            <div className={styles.amountZone}>
              <label className={styles.amountLabel} htmlFor="fan-letter-amount">金額</label>
              <div className={styles.amountDisplayRow}>
                <span className={styles.currencyMark}>¥</span>
                {isEditingAmount ? (
                  <input
                    className={styles.directAmountInput}
                    type="text"
                    inputMode="numeric"
                    aria-label="金額を直接入力"
                    value={amountDraft}
                    autoFocus
                    onChange={(event) => setAmountDraft(event.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={commitAmount}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                      if (event.key === "Escape") cancelAmountEdit();
                    }}
                  />
                ) : (
                  <button type="button" className={styles.amountDisplay} onClick={beginAmountEdit}>
                    {amount.toLocaleString()}
                  </button>
                )}
                <span className={styles.currencyUnit}>円</span>
              </div>

              <div className={styles.sliderWrap}>
                <div className={styles.sliderTrack}>
                  <span className={styles.sliderFill} style={{ width: `${sliderPercent}%` }} />
                  {PRESET_AMOUNTS.map((preset, index) => (
                    <span
                      key={preset}
                      className={styles.sliderTick}
                      style={{ left: `${(index / (PRESET_AMOUNTS.length - 1)) * 100}%` }}
                    />
                  ))}
                  <span className={styles.sliderThumb} style={{ left: `${sliderPercent}%` }} />
                </div>
                <input
                  id="fan-letter-amount"
                  className={styles.sliderInput}
                  type="range"
                  min={0}
                  max={PRESET_AMOUNTS.length - 1}
                  step={1}
                  value={tierIndex}
                  aria-label="金額"
                  onChange={(event) => {
                    setTierIndex(Number(event.target.value));
                    setCustomAmount(null);
                  }}
                />
              </div>
              <div className={styles.sliderLabels} aria-hidden="true">
                {PRESET_AMOUNTS.map((preset) => (
                  <span key={preset}>¥{preset.toLocaleString()}</span>
                ))}
              </div>
              <p className={styles.amountHint}>金額をクリックすると1円単位で入力できます</p>
            </div>
          </div>

          <div className={styles.sendRow}>
            <button type="button" className={styles.sendButton} disabled={!canSend || isPending} onClick={openConfirmation}>確認する</button>
          </div>
        </div>
      ) : (
        <div role="tabpanel">
          <div className={styles.sectionLabel}><span>・ ・ ・</span>HISTORY<span>・ ・ ・</span></div>
          <div className={styles.historyFilter}>
            <label htmlFor="history-junior">ジュニア別に絞り込み</label>
            <select
              id="history-junior"
              value={historyJuniorId}
              onChange={(event) => {
                setHistoryJuniorId(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">すべてのジュニア</option>
              {oshiJunior && <option value={oshiJunior.id}>推し：{oshiJunior.name}</option>}
              {juniors.filter((junior) => junior.id !== oshiId).map((junior) => (
                <option key={junior.id} value={junior.id}>{junior.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.stats}>
            <div className={styles.statBox}><strong>{filteredHistory.length}</strong><span>送信メッセージ数</span></div>
            <div className={styles.statBox}><strong>¥{totalAmount.toLocaleString()}</strong><span>金額合計</span></div>
          </div>

          {visibleHistory.length > 0 ? (
            <div className={styles.historyList}>
              {visibleHistory.map((entry) => {
                const junior = juniorsById.get(entry.juniorId);
                return (
                  <article key={entry.id} className={styles.historyItem}>
                    <div className={styles.historyTop}>
                      <time>{entry.date}</time>
                      <span className={styles.historyBadge}>¥{entry.amount.toLocaleString()}</span>
                    </div>
                    <div className={styles.historyRecipient}>
                      <strong>{junior?.name ?? "不明なジュニア"}</strong>
                      {junior && <span>{junior.affiliation}</span>}
                    </div>
                    <p>{entry.message}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>該当する送信履歴はありません。</div>
          )}

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="送信履歴のページ">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>&lt;</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                page === currentPage
                  ? <span key={page} className={styles.currentPage}>{page}</span>
                  : <button type="button" key={page} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>&gt;</button>
            </nav>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsModalOpen(false);
        }}>
          <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="recipient-dialog-title">
            <div className={styles.modalHead}>
              <div className={styles.modalTitleRow}>
                <h2 id="recipient-dialog-title">送る相手を選ぶ</h2>
                <button type="button" className={styles.closeButton} aria-label="閉じる" onClick={() => setIsModalOpen(false)}>×</button>
              </div>
              <div className={styles.searchBox}>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="名前・グループ名で検索"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalBody}>
              {filteredJuniors.length === 0 ? (
                <div className={styles.noResult}>「{searchQuery}」に一致するジュニアが見つかりません</div>
              ) : (
                filteredJuniors.map((junior) => (
                  <div key={junior.id} className={`${styles.juniorRow} ${junior.id === currentJuniorId ? styles.currentJunior : ""}`}>
                    <button type="button" className={styles.juniorSelector} onClick={() => selectJunior(junior.id)}>
                      <span className={styles.miniThumb}>
                        <JuniorAvatar
                          key={junior.imageUrl ?? junior.id}
                          junior={junior}
                          sizes="44px"
                        />
                      </span>
                      <span className={styles.juniorMeta}>
                        <span className={styles.modalNameRow}>
                          <strong>{junior.name}</strong>
                          {junior.id === oshiId && <span className={styles.oshiTag}>推し</span>}
                        </span>
                        <small>{junior.affiliation}</small>
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isConfirmOpen && currentJunior && (
        <div className={styles.modalOverlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isPending) setIsConfirmOpen(false);
        }}>
          <div className={styles.confirmPanel} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <div className={styles.confirmHead}>
              <h2 id="confirm-dialog-title">送信内容の確認</h2>
              <button type="button" className={styles.closeButton} aria-label="閉じる" disabled={isPending} onClick={() => setIsConfirmOpen(false)}>×</button>
            </div>
            <div className={styles.confirmContent}>
              <div className={styles.confirmRecipient}>
                <span>宛先</span>
                <strong>{currentJunior.name}</strong>
              </div>
              <div className={styles.confirmMessage}>
                <p>{message.trim()}</p>
              </div>
              <div className={styles.confirmAmount}>
                <span>金額</span>
                <strong>¥{amount.toLocaleString()}</strong>
              </div>
            </div>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            <div className={styles.confirmActions}>
              <button type="button" className={styles.backButton} disabled={isPending} onClick={() => setIsConfirmOpen(false)}>キャンセル</button>
              <button type="button" className={styles.sendButton} disabled={isPending} onClick={handleSend}>
                {isPending ? "送信中..." : "送信する"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.toast} ${toast ? styles.toastVisible : ""}`} role="status">{toast}</div>
    </PageShell>
  );
}
