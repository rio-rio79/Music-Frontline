"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { sendFanLetter } from "./actions";
import styles from "./page.module.css";

type Tab = "compose" | "history";

export type TipJunior = {
  id: string;
  name: string;
  imageUrl: string | null;
  affiliation: string;
};

type TipPageClientProps = {
  juniors: TipJunior[];
  initialOshiId: string | null;
  initialHistory: FanLetterHistoryEntry[];
};

type SuperchatTier = {
  id: number;
  amount: number;
};

type HistoryEntry = {
  id: string;
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

const SUPERCHAT_TIERS: SuperchatTier[] = [
  { id: 1, amount: 100 },
  { id: 2, amount: 500 },
  { id: 3, amount: 1000 },
  { id: 4, amount: 3000 },
  { id: 5, amount: 5000 },
  { id: 6, amount: 10000 },
  { id: 7, amount: 50000 },
];

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

export default function TipPageClient({ juniors, initialOshiId, initialHistory }: TipPageClientProps) {
  const oshiId = juniors.some((junior) => junior.id === initialOshiId) ? initialOshiId : null;
  const initialHistoryByJunior = initialHistory.reduce<Record<string, HistoryEntry[]>>((history, entry) => {
    (history[entry.juniorId] ??= []).push({
      id: entry.id,
      date: formatDate(entry.createdAt),
      message: entry.message,
      amount: entry.amount,
    });
    return history;
  }, {});
  const [activeTab, setActiveTab] = useState<Tab>("compose");
  const [currentJuniorId, setCurrentJuniorId] = useState<string | null>(oshiId);
  const [message, setMessage] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [selectedTier, setSelectedTier] = useState<SuperchatTier | null>(null);
  const [historyByJunior, setHistoryByJunior] = useState<Record<string, HistoryEntry[]>>(initialHistoryByJunior);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentJunior = juniors.find((junior) => junior.id === currentJuniorId) ?? null;
  const history = currentJuniorId ? historyByJunior[currentJuniorId] ?? [] : [];
  const totalAmount = history.reduce((sum, item) => sum + item.amount, 0);
  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const visibleHistory = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const amount = Number(amountInput);
  const isValidAmount = Number.isInteger(amount) && amount >= 100 && amount <= 50000;
  const canSend = currentJunior !== null
    && message.trim().length > 0
    && isValidAmount;

  const filteredJuniors = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("ja");
    return juniors
      .filter((junior) => !query ||
        `${junior.name} ${junior.affiliation}`.toLocaleLowerCase("ja").includes(query))
      .sort((left, right) => {
        if (left.id === oshiId) return -1;
        if (right.id === oshiId) return 1;
        return left.name.localeCompare(right.name, "ja");
      });
  }, [juniors, oshiId, searchQuery]);

  const selectJunior = (juniorId: string) => {
    setCurrentJuniorId(juniorId);
    setCurrentPage(1);
    setMessage("");
    setAmountInput("");
    setSelectedTier(null);
    setActiveTab("compose");
    setIsModalOpen(false);
  };

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
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
        date: formatDate(result.entry.createdAt),
        message: result.entry.message,
        amount: result.entry.amount,
      };

      setHistoryByJunior((current) => ({
        ...current,
        [currentJuniorId]: [entry, ...(current[currentJuniorId] ?? [])],
      }));
      setMessage("");
      setAmountInput("");
      setSelectedTier(null);
      setCurrentPage(1);
      setIsConfirmOpen(false);
      setFormError("");
      showToast(`${currentJunior.name}さんにファンレターを送信しました（¥${entry.amount.toLocaleString()}）`);
    });
  };

  return (
    <section className={styles.page}>
      <h1 className={styles.pageTitle}>ファンレター</h1>

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

      <div className={styles.tabs} role="tablist" aria-label="ファンレターメニュー">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "compose"}
          className={`${styles.tab} ${activeTab === "compose" ? styles.active : ""}`}
          onClick={() => setActiveTab("compose")}
        >
          メッセージ作成
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "history"}
          className={`${styles.tab} ${activeTab === "history" ? styles.active : ""}`}
          onClick={() => setActiveTab("history")}
        >
          送信履歴 <span className={styles.count}>{history.length}</span>
        </button>
      </div>

      {activeTab === "compose" ? (
        <div role="tabpanel">
          <div className={styles.sectionLabel}><span>・ ・ ・</span>LETTER<span>・ ・ ・</span></div>
          <textarea
            className={styles.messageInput}
            maxLength={300}
            placeholder="メッセージを入力してください"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className={styles.charCount}>{message.length} / 300</div>

          <div className={styles.amountSection}>
            <label className={styles.amountLabel} htmlFor="superchat-amount">スーパーチャット金額</label>
            <div className={styles.amountInputWrapper}>
              <span>¥</span>
              <input
                id="superchat-amount"
                className={styles.amountInput}
                type="number"
                min={100}
                max={50000}
                step={1}
                inputMode="numeric"
                placeholder="100〜50,000"
                value={amountInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const nextAmount = Number(nextValue);
                  setAmountInput(nextValue);
                  setSelectedTier(SUPERCHAT_TIERS.find((tier) => tier.amount === nextAmount) ?? null);
                }}
              />
              <span>円</span>
            </div>
            <p className={styles.amountHint}>100円以上50,000円以下で入力してください</p>
          </div>

          <div className={styles.tiers} aria-label="スーパーチャット金額の入力補助">
            {SUPERCHAT_TIERS.map((tier) => (
              <button
                type="button"
                key={tier.id}
                className={`${styles.tier} ${styles[`tier${tier.id}`]} ${selectedTier?.id === tier.id ? styles.selected : ""}`}
                onClick={() => {
                  setAmountInput(String(tier.amount));
                  setSelectedTier(tier);
                }}
              >
                <span>¥{tier.amount.toLocaleString()}</span>
              </button>
            ))}
          </div>

          <div className={styles.sendRow}>
            {isValidAmount && <div className={styles.total}>合計 <b>¥{amount.toLocaleString()}</b></div>}
            <button type="button" className={styles.sendButton} disabled={!canSend || isPending} onClick={openConfirmation}>確認する</button>
          </div>
        </div>
      ) : (
        <div role="tabpanel">
          <div className={styles.sectionLabel}><span>・ ・ ・</span>HISTORY<span>・ ・ ・</span></div>
          <div className={styles.stats}>
            <div className={styles.statBox}><strong>{history.length}</strong><span>送信メッセージ数</span></div>
            <div className={styles.statBox}><strong>¥{totalAmount.toLocaleString()}</strong><span>スーパーチャット合計</span></div>
          </div>

          {visibleHistory.length > 0 ? (
            <div className={styles.historyList}>
              {visibleHistory.map((entry) => (
                <article key={entry.id} className={styles.historyItem}>
                  <div className={styles.historyTop}>
                    <time>{entry.date}</time>
                    <span className={styles.historyBadge}>¥{entry.amount.toLocaleString()}</span>
                  </div>
                  <p>{entry.message}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>まだメッセージを送っていません。</div>
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
        <div className={styles.modalOverlay}>
          <div className={styles.confirmPanel} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <h2 id="confirm-dialog-title">ファンレターを確認</h2>
            <dl className={styles.confirmDetails}>
              <div><dt>送信先</dt><dd>{currentJunior.name}</dd></div>
              <div><dt>金額</dt><dd>¥{amount.toLocaleString()}</dd></div>
              <div><dt>メッセージ</dt><dd>{message.trim()}</dd></div>
            </dl>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            <div className={styles.confirmActions}>
              <button type="button" className={styles.backButton} disabled={isPending} onClick={() => setIsConfirmOpen(false)}>戻る</button>
              <button type="button" className={styles.sendButton} disabled={isPending} onClick={handleSend}>
                {isPending ? "送信中..." : "送信する"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.toast} ${toast ? styles.toastVisible : ""}`} role="status">{toast}</div>
    </section>
  );
}
